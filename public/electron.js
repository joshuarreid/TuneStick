const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const mm = require('music-metadata'); // Import music-metadata library

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
ipcMain.handle('select-music-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Music Library Folder'
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('scan-album-folders', async (event, folderPath) => {
    try {
        const albums = [];
        console.log('Scanning folderPath:', folderPath);

        const artistFolders = await fs.readdir(folderPath, { withFileTypes: true });
        console.log('Artist folders found:', artistFolders.map(f => f.name));

        for (const artistFolder of artistFolders) {
            if (artistFolder.isDirectory()) {
                const artistPath = path.join(folderPath, artistFolder.name);
                console.log('Artist path:', artistPath);

                try {
                    const albumFolders = await fs.readdir(artistPath, { withFileTypes: true });
                    console.log(`Albums found in artist folder (${artistFolder.name}):`, albumFolders.map(f => f.name));

                    for (const albumFolder of albumFolders) {
                        if (albumFolder.isDirectory()) {
                            const albumPath = path.join(artistPath, albumFolder.name);
                            console.log('Album path:', albumPath);

                            try {
                                const files = await fs.readdir(albumPath);
                                const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));
                                console.log(`MP3 files found in ${albumFolder.name}:`, mp3Files);

                                if (mp3Files.length > 0) {
                                    // Extract album artwork (if available) from the first MP3 file
                                    let albumCover = null;
                                    const metadata = await mm.parseFile(path.join(albumPath, mp3Files[0]));

                                    if (metadata.common.picture && metadata.common.picture.length > 0) {
                                        const picture = metadata.common.picture[0];
                                        albumCover = {
                                            format: picture.format,
                                            data: picture.data.toString('base64') // Convert image buffer to base64
                                        };
                                    }

                                    albums.push({
                                        name: albumFolder.name,
                                        artist: artistFolder.name,
                                        album: albumFolder.name,
                                        path: albumPath,
                                        trackCount: mp3Files.length,
                                        tracks: mp3Files,
                                        albumCover: albumCover // Include album cover in the result
                                    });
                                }
                            } catch (error) {
                                console.warn(`Could not read album folder ${albumPath}:`, error.message);
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`Could not read artist folder ${artistPath}:`, error.message);
                }
            }
        }

        console.log('Albums found:', albums);
        return albums;
    } catch (error) {
        console.error('Error scanning albums:', error);
        throw error;
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