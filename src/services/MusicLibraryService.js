const { ipcRenderer } = window.require('electron');

class MusicLibraryService {
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

    // New: list mounted drives
    async listDrives() {
        try {
            return await this.ipcRenderer.invoke('list-drives');
        } catch (error) {
            console.error('Error listing drives:', error);
            return { success: false, message: error.message };
        }
    }

    // New: set selected drive
    async setSelectedDrive(drivePath) {
        try {
            return await this.ipcRenderer.invoke('set-selected-drive', drivePath);
        } catch (error) {
            console.error('Error setting selected drive:', error);
            return { success: false, message: error.message };
        }
    }

    async getSelectedDrive() {
        try {
            return await this.ipcRenderer.invoke('get-selected-drive');
        } catch (error) {
            console.error('Error getting selected drive:', error);
            return { success: false, message: error.message };
        }
    }

    async confirmEraseDrive(drivePath) {
        try {
            return await this.ipcRenderer.invoke('confirm-erase-drive', drivePath);
        } catch (error) {
            console.error('Error confirming erase drive:', error);
            return false;
        }
    }

    async eraseDrive(payload) {
        try {
            return await this.ipcRenderer.invoke('erase-drive', payload);
        } catch (error) {
            console.error('Error erasing drive:', error);
            return { success: false, message: error.message };
        }
    }

    // albums: array, onProgress: fn, options: { action: 'append'|'erase', label }
    async transferAlbums(albums, onProgress, options = {}) {
        try {
            if (!albums || albums.length === 0) {
                throw new Error('No albums provided for transfer.');
            }

            // Check if there's a selected drive
            const sel = await this.getSelectedDrive();
            let destination = null;

            if (sel && sel.success && sel.drive) {
                // If user requested erase, confirm and perform it; otherwise append
                const action = options.action || 'append';
                if (action === 'erase') {
                    const confirmed = await this.confirmEraseDrive(sel.drive);
                    if (!confirmed) {
                        throw new Error('Erase cancelled by user. Transfer aborted.');
                    }

                    // Erase drive contents and optionally rename using provided label
                    const erasePayload = { drivePath: sel.drive };
                    if (options && options.label) erasePayload.label = options.label;

                    const eraseResult = await this.eraseDrive(erasePayload);
                    if (!eraseResult.success) {
                        throw new Error('Failed to erase drive: ' + (eraseResult.message || 'Unknown error'));
                    }

                    destination = sel.drive; // Use drive root as destination after erasing
                } else {
                    // Append mode — do not erase; just write into the drive root
                    destination = sel.drive;
                }
            } else {
                // Fallback to folder selection dialog
                destination = await this.ipcRenderer.invoke('select-destination-folder');
                if (!destination) {
                    throw new Error('No destination folder selected.');
                }
            }

            // Listen for progress updates from main process
            const progressListener = (event, progress) => {
                if (typeof onProgress === 'function') {
                    onProgress(progress);
                }
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
    }}

export default new MusicLibraryService();