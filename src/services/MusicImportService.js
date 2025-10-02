const { ipcRenderer } = window.require('electron');

class MusicImportService {
    constructor() {
        this.ipcRenderer = ipcRenderer;
    }

    /**
     * Scans the music library for albums
     * This now uses the hardcoded path from config.json
     */
    async scanMusicLibrary() {
        try {
            console.log('Invoking scan-album-folders');
            const result = await this.ipcRenderer.invoke('scan-album-folders');
            console.log('scan-album-folders returned:', result);
            if (!result.success) {
                return { success: false, message: result.message };
            }

            return { success: true, albums: result.albums, message: `Found ${result.albums.length} albums` };
        } catch (error) {
            console.error('Error scanning music library:', error);
            return { success: false, message: error.message };
        }
    }
}

export default new MusicImportService();