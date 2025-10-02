const { ipcRenderer } = window.require('electron');

class MusicImportService {
    constructor() {
        this.ipcRenderer = ipcRenderer;
    }

    async scanMusicLibrary() {
        try {
            const result = await this.ipcRenderer.invoke('scan-album-folders');
            if (!result.success) {
                return { success: false, message: result.message };
            }
            return { success: true, albums: result.albums };
        } catch (error) {
            console.error('Error scanning music library:', error);
            return { success: false, message: error.message };
        }
    }

    async transferAlbums(albums, onProgress) {
        try {
            if (!albums || albums.length === 0) {
                throw new Error('No albums provided for transfer.');
            }

            const destination = await this.ipcRenderer.invoke('select-destination-folder');
            if (!destination) {
                throw new Error('No destination folder selected.');
            }

            // Set up progress listener
            const progressListener = (event, progress) => {
                onProgress(progress);
            };

            this.ipcRenderer.on('transfer-progress', progressListener);

            try {
                const result = await this.ipcRenderer.invoke('transfer-albums', { albums, destination });

                // Clean up the listener
                this.ipcRenderer.removeListener('transfer-progress', progressListener);

                return result;
            } catch (error) {
                // Clean up the listener in case of error
                this.ipcRenderer.removeListener('transfer-progress', progressListener);
                throw error;
            }

        } catch (error) {
            console.error('Error during transfer:', error);
            return { success: false, message: error.message };
        }
    }
}

export default new MusicImportService();