const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs'); // for constants
const fsp = require('fs').promises; // for async/await
const mm = require('music-metadata');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Path to hardcoded config.json in the repository
const configPath = path.join(__dirname, 'config.json');

// Utility function to read the hardcoded config file
const readConfig = async () => {
    try {
        const configData = await fsp.readFile(configPath, 'utf-8');
        return JSON.parse(configData);
    } catch (error) {
        console.error('Error reading config file:', error.message);
        return { musicFolderPath: "" }; // Default empty path
    }
};

// Simple development check instead of electron-is-dev
const isDev = process.env.NODE_ENV === 'development' || process.defaultApp || /node_modules[\\/]electron[\\/]/.test(process.execPath);

function createWindow() {
    // Create the browser window
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    // Load the app
    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../build/index.html')}`;

    mainWindow.loadURL(startUrl);

    // Open DevTools in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    return mainWindow;
}

// Keep a simple in-memory selected drive path in main process
let selectedDrivePath = null;

// New: cancellation flag for ongoing transfer
let transferCancelled = false;

// IPC Handlers - Think of these as your REST endpoints
ipcMain.handle('scan-album-folders', async () => {
    try {
        const config = await readConfig();
        const folderPath = config.musicFolderPath;

        if (!folderPath) {
            return { success: false, message: 'Music folder path is not configured in config.json.' };
        }

        if (!fs.existsSync(folderPath)) {
            return { success: false, message: 'Configured folder path does not exist. Please update config.json.' };
        }

        const albums = [];
        console.log('Scanning folderPath:', folderPath);

        const artistFolders = await fsp.readdir(folderPath, { withFileTypes: true });
        console.log('Artist folders found:', artistFolders.map(f => f.name));

        for (const artistFolder of artistFolders) {
            if (artistFolder.isDirectory()) {
                const artistPath = path.join(folderPath, artistFolder.name);
                console.log('Artist path:', artistPath);

                try {
                    const albumFolders = await fsp.readdir(artistPath, { withFileTypes: true });
                    console.log(`Albums found in artist folder (${artistFolder.name}):`, albumFolders.map(f => f.name));

                    for (const albumFolder of albumFolders) {
                        if (albumFolder.isDirectory()) {
                            const albumPath = path.join(artistPath, albumFolder.name);

                            try {
                                const albumStats = await fsp.stat(albumPath); // Get album folder stats
                                const dateModified = albumStats.mtime; // Extract modified time

                                const files = await fsp.readdir(albumPath);
                                const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));
                                console.log(`MP3 files found in ${albumFolder.name}:`, mp3Files);

                                if (mp3Files.length > 0) {
                                    let totalSize = 0;

                                    for (const mp3File of mp3Files) {
                                        const filePath = path.join(albumPath, mp3File);

                                        try {
                                            // Check file accessibility before reading stats
                                            await fsp.access(filePath, fs.constants.F_OK);
                                            const stats = await fsp.stat(filePath);

                                            totalSize += stats.size;
                                        } catch (fileError) {
                                            console.warn(`Could not access file ${filePath}:`, fileError.message);
                                        }
                                    }

                                    console.log(`Total size for album ${albumFolder.name}:`, totalSize);

                                    // Extract album artwork (if available) from the first MP3 file
                                    let albumCover = null;
                                    try {
                                        const metadata = await mm.parseFile(path.join(albumPath, mp3Files[0]));
                                        if (metadata.common.picture && metadata.common.picture.length > 0) {
                                            const picture = metadata.common.picture[0];
                                            albumCover = {
                                                format: picture.format,
                                                data: picture.data.toString('base64')
                                            };
                                        }
                                    } catch (metaError) {
                                        console.warn(`Could not parse metadata for ${mp3Files[0]}:`, metaError.message);
                                    }

                                    albums.push({
                                        name: albumFolder.name,
                                        artist: artistFolder.name,
                                        album: albumFolder.name,
                                        path: albumPath,
                                        trackCount: mp3Files.length,
                                        tracks: mp3Files,
                                        albumCover: albumCover,
                                        size: totalSize,
                                        dateModified: dateModified // Include date modified
                                    });
                                }
                            } catch (albumError) {
                                console.warn(`Could not read album folder ${albumPath}:`, albumError.message);
                            }
                        }
                    }
                } catch (artistError) {
                    console.warn(`Could not read artist folder ${artistPath}:`, artistError.message);
                }
            }
        }

        console.log('Albums found:', albums);
        return { success: true, albums };
    } catch (error) {
        console.error('Error scanning albums:', error);
        throw error;
    }
});

// New: list mounted drives (macOS: /Volumes)
ipcMain.handle('list-drives', async () => {
    try {
        const volumesRoot = (process.platform === 'darwin') ? '/Volumes' : (process.platform === 'win32' ? null : '/mnt');
        if (!volumesRoot) {
            return { success: false, message: 'Drive listing not implemented for this OS.' };
        }

        const entries = await fsp.readdir(volumesRoot, { withFileTypes: true });
        const drives = [];
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const fullPath = path.join(volumesRoot, entry.name);
                // Only include directories we can stat
                try {
                    const stats = await fsp.stat(fullPath);
                    if (stats.isDirectory()) {
                        drives.push({ name: entry.name, path: fullPath });
                    }
                } catch (err) {
                    // ignore entries we can't stat
                }
            }
        }
        return { success: true, drives };
    } catch (error) {
        console.error('Error listing drives:', error.message);
        return { success: false, message: error.message };
    }
});

// New: set/get selected drive in main memory (simple)
ipcMain.handle('set-selected-drive', async (event, drivePath) => {
    // If drivePath is null/empty, clear selection
    if (!drivePath) {
        selectedDrivePath = null;
        return { success: true };
    }

    // Basic safety: only allow paths under /Volumes on macOS
    if (process.platform === 'darwin') {
        if (!path.normalize(drivePath).startsWith('/Volumes')) {
            return { success: false, message: 'Invalid drive path.' };
        }
    }
    selectedDrivePath = drivePath;
    return { success: true };
});

ipcMain.handle('get-selected-drive', async () => {
    return { success: true, drive: selectedDrivePath };
});

// New: Confirm erase dialog
ipcMain.handle('confirm-erase-drive', async (event, drivePath) => {
    const result = await dialog.showMessageBox({
        type: 'warning',
        title: 'Confirm Erase',
        message: `Are you sure you want to erase all contents of ${drivePath}? This action cannot be undone.`,
        buttons: ['Erase', 'Cancel'],
        defaultId: 1,
        cancelId: 1,
        noLink: true
    });
    // returns true if user clicked 'Erase' (index 0)
    return result.response === 0;
});

// New: Erase (delete) contents of the selected drive. Accepts optional label to rename the volume (macOS).
ipcMain.handle('erase-drive', async (event, payload) => {
    try {
        const { drivePath, label } = (payload && typeof payload === 'object') ? payload : { drivePath: payload };

        if (!drivePath) {
            return { success: false, message: 'No drive path provided.' };
        }
        // Safety: only allow /Volumes on macOS
        if (process.platform === 'darwin') {
            if (!path.normalize(drivePath).startsWith('/Volumes')) {
                return { success: false, message: 'Erase operation is restricted to /Volumes on macOS.' };
            }
        }

        // Read entries in the drive root and delete them
        const entries = await fsp.readdir(drivePath);
        for (const entry of entries) {
            const entryPath = path.join(drivePath, entry);
            try {
                // Use rm with recursive & force
                await fsp.rm(entryPath, { recursive: true, force: true });
            } catch (rmErr) {
                console.warn(`Failed to remove ${entryPath}:`, rmErr.message);
                // continue with remaining entries
            }
        }

        // If a label was provided and we're on macOS, try to rename the volume using diskutil
        if (label && process.platform === 'darwin') {
            try {
                // Use the mount point path as the target for diskutil rename
                // diskutil rename <mountPoint> <newName>
                // Use quoting for safety
                await execAsync(`diskutil rename "${drivePath}" "${label}"`);
            } catch (renameErr) {
                console.warn('Failed to rename volume:', renameErr.message || renameErr);
                // Not fatal; proceed but return a warning
                return { success: true, warning: `Erased contents but failed to rename: ${renameErr.message}` };
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error erasing drive:', error.message);
        return { success: false, message: error.message };
    }
});

ipcMain.handle('select-destination-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Destination Folder'
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('transfer-albums', async (event, data) => {
    try {
        const { albums, destination } = data || {};

        if (!albums || !Array.isArray(albums) || albums.length === 0) {
            throw new Error('No albums provided for transfer or albums is not an array.');
        }
        if (!destination) {
            throw new Error('No destination folder provided.');
        }

        // Reset cancellation flag at the start of a transfer
        transferCancelled = false;

        // Calculate total number of tracks across all albums so we can report progress per track
        let totalTracks = 0;
        for (const album of albums) {
            if (album && Array.isArray(album.tracks)) totalTracks += album.tracks.length;
        }
        let tracksTransferred = 0;
        let lastPercentSent = -1; // throttle by percent change

        for (const album of albums) {
            // Check cancellation before processing each album
            if (transferCancelled) {
                console.log('Transfer cancelled by user before processing album:', album && album.name);
                transferCancelled = false; // reset for future transfers
                return { success: false, cancelled: true, message: 'Transfer cancelled by user.' };
            }

            const albumPath = album.path;
            const albumName = album.name;
            const albumDest = path.join(destination, albumName);

            await fsp.mkdir(albumDest, { recursive: true });

            for (const track of album.tracks) {
                // Check cancellation before each track copy
                if (transferCancelled) {
                    console.log('Transfer cancelled by user during copy:', track);
                    transferCancelled = false; // reset for future transfers
                    return { success: false, cancelled: true, message: 'Transfer cancelled by user.' };
                }

                const sourceFile = path.join(albumPath, track);
                const destFile = path.join(albumDest, track);
                await fsp.copyFile(sourceFile, destFile);

                // Update counters
                tracksTransferred++;
                const progress = totalTracks > 0 ? Math.round((tracksTransferred / totalTracks) * 100) : 0;

                // Always send track metadata for UI to display current file
                event.sender.send('transfer-track', {
                    trackName: track,
                    trackIndex: tracksTransferred,
                    totalTracks,
                    album: albumName
                });

                // Only send an update when the rounded percent changes to throttle events
                if (progress !== lastPercentSent) {
                    lastPercentSent = progress;
                    // send an object with progress
                    event.sender.send('transfer-progress', { progress });
                }
            }
        }

        // Final progress update (guarantee 100%) with null trackName
        event.sender.send('transfer-progress', { progress: 100 });
        event.sender.send('transfer-track', { trackName: null, trackIndex: totalTracks, totalTracks });

        return { success: true };
    } catch (error) {
        console.error('Error during transfer:', error);
        return { success: false, message: error.message };
    }
});

// New: handle cancel request from renderer
ipcMain.handle('cancel-transfer', async () => {
    transferCancelled = true;
    return { success: true };
});

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
