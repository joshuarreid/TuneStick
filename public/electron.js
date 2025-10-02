const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs'); // for constants
const fsp = require('fs').promises; // for async/await
const mm = require('music-metadata');

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
                                            continue;
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
        console.log('Received transfer-albums data:', data);

        // Extract albums and destination from the data object
        const { albums, destination } = data || {};

        console.log('Albums:', albums);
        console.log('Destination:', destination);

        if (!albums || !Array.isArray(albums) || albums.length === 0) {
            throw new Error('No albums provided for transfer or albums is not an array.');
        }
        if (!destination) {
            throw new Error('No destination folder provided.');
        }

        let progress = 0;
        const progressUpdates = [];

        for (const album of albums) {
            const albumPath = album.path;
            const albumName = album.name;
            const albumDest = path.join(destination, albumName);

            await fsp.mkdir(albumDest, { recursive: true });

            for (const track of album.tracks) {
                const sourceFile = path.join(albumPath, track);
                const destFile = path.join(albumDest, track);
                await fsp.copyFile(sourceFile, destFile);

                progress += Math.floor(100 / albums.length / album.tracks.length);
                progressUpdates.push(progress);
            }
        }

        return { success: true, progress: progressUpdates };
    } catch (error) {
        console.error('Error during transfer:', error);
        return { success: false, message: error.message };
    }
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