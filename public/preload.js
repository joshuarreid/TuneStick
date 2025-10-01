const { contextBridge, ipcRenderer } = require('electron');

/**
 * Exposes secure API to renderer process
 * Similar to defining REST API endpoints
 */
contextBridge.exposeInMainWorld('electronAPI', {
    openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
    readDirectory: (folderPath) => ipcRenderer.invoke('read-directory', folderPath)
});