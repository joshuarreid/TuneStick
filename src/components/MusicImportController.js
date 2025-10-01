import React, { useState } from 'react';
import MusicImportService from '../services/MusicImportService';

/**
 * Controller component - handles user interactions
 * Similar to Spring Boot @RestController
 */
const MusicImportController = () => {
    const [selectedFolder, setSelectedFolder] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [validationResult, setValidationResult] = useState(null);

    /**
     * Handle import button click
     * Similar to @PostMapping("/import/select-folder")
     */
    const handleImportMusic = async () => {
        setIsLoading(true);

        try {
            // Call service layer
            const result = await MusicImportService.selectMusicFolder();

            if (result.success) {
                setSelectedFolder(result.folderPath);

                // Validate the selected folder
                const validation = await MusicImportService.validateMusicFolder(result.folderPath);
                setValidationResult(validation);
            } else {
                console.log(result.message);
            }
        } catch (error) {
            console.error('Import failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="music-import-container">
            <h2>Import Music</h2>

            <button
                onClick={handleImportMusic}
                disabled={isLoading}
                className="import-button"
            >
                {isLoading ? 'Opening...' : 'Import Music'}
            </button>

            {selectedFolder && (
                <div className="selected-folder">
                    <h3>Selected Folder:</h3>
                    <p>{selectedFolder}</p>
                </div>
            )}

            {validationResult && (
                <div className={`validation-result ${validationResult.valid ? 'success' : 'error'}`}>
                    <p>{validationResult.message}</p>
                    {validationResult.valid && (
                        <p>Found {validationResult.albumCount} album folders</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default MusicImportController;