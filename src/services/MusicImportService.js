const { ipcRenderer } = window.require('electron');

class MusicImportService {
    constructor() {
        // In Spring Boot, this would be @Autowired dependencies
        this.ipcRenderer = ipcRenderer;
    }

    /**
     * Opens native file dialog and returns selected folder path
     * Similar to a Spring Boot @Service method
     */
    async selectMusicFolder() {
        try {
            const folderPath = await this.ipcRenderer.invoke('select-music-folder');

            if (!folderPath) {
                return { success: false, message: 'User canceled selection' };
            }

            return {
                success: true,
                folderPath: folderPath,
                message: 'Folder selected successfully'
            };
        } catch (error) {
            console.error('Error selecting folder:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Scans the music library for albums
     * Handles Music > Artist > Album > MP3s structure
     */
    async scanMusicLibrary(folderPath) {
        try {
            console.log('Invoking scan-album-folders with folderPath:', folderPath);
            const albums = await this.ipcRenderer.invoke('scan-album-folders', folderPath);
            console.log('scan-album-folders returned:', albums);
            if (albums.length === 0) {
                return {
                    success: false,
                    message: 'No albums found. Make sure your folder structure is: Music > Artist > Album > MP3 files'
                };
            }

            return {
                success: true,
                albums: albums,
                message: `Found ${albums.length} albums`
            };
        } catch (error) {
            console.warn(`Could not read album folder ${albumPath}:`, error.message);
            console.warn(`Could not read artist folder ${artistPath}:`, error.message);
            console.error('Error scanning music library:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Validates that the selected folder contains album folders
     * Business logic validation (like Spring Boot @Valid)
     */
    async validateMusicFolder(folderPath) {
        try {
            const albums = await this.ipcRenderer.invoke('scan-album-folders', folderPath);

            if (albums.length === 0) {
                return {
                    valid: false,
                    message: 'Selected folder does not contain any album folders with MP3 files'
                };
            }

            return {
                valid: true,
                albumCount: albums.length,
                albums: albums
            };
        } catch (error) {
            return { valid: false, message: error.message };
        }
    }
}

export default new MusicImportService();