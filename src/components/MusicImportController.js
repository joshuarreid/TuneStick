// Import React and useState to manage the component's state
import React, { useState } from 'react';

// Import the MusicImportService for handling folder selection and album scanning
import MusicImportService from '../services/MusicImportService';

// MusicImportController - Main Component
const MusicImportController = () => {
    // State variables (like variables that update the UI dynamically)
    const [selectedFolder, setSelectedFolder] = useState(''); // Stores the folder path
    const [albums, setAlbums] = useState([]); // Stores the list of albums
    const [isLoading, setIsLoading] = useState(false); // Tracks if the app is busy scanning
    const [error, setError] = useState(''); // Stores error messages

    // Function to handle the "Import Music" button click
    const handleImportMusic = async () => {
        setIsLoading(true); // Start the loading state
        setError(''); // Clear any previous errors

        try {
            // Ask the user to select a folder
            const result = await MusicImportService.selectMusicFolder();

            if (result.success) {
                // Save the selected folder path
                setSelectedFolder(result.folderPath);

                // Scan the selected folder for albums
                const scanResult = await MusicImportService.scanMusicLibrary(result.folderPath);

                if (scanResult.success) {
                    // Save the list of albums found
                    setAlbums(scanResult.albums);
                } else {
                    // Show an error message if scanning fails
                    setError(scanResult.message);
                }
            } else {
                console.log(result.message); // Log a message if folder selection is canceled
            }
        } catch (error) {
            console.error('Import failed:', error); // Log the error to the console
            setError('Failed to import music: ' + error.message); // Show an error message
        } finally {
            setIsLoading(false); // Stop the loading state
        }
    };

    // The HTML-like structure that React will render
    return (
        <div className="music-import-container">
            <h2>Import Music</h2>

            {/* Import Music Button */}
            <button
                onClick={handleImportMusic} // Runs the handleImportMusic function when clicked
                disabled={isLoading} // Disables the button while scanning
                className="import-button"
            >
                {/* Change button text based on loading state */}
                {isLoading ? 'Scanning...' : 'Import Music'}
            </button>

            {/* Show an error message if there's an error */}
            {error && (
                <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
                    {error}
                </div>
            )}

            {/* Show the selected folder path */}
            {selectedFolder && (
                <div className="selected-folder" style={{ marginTop: '20px' }}>
                    <h3>Selected Folder:</h3>
                    <p>{selectedFolder}</p>
                </div>
            )}

            {/* Display the list of albums if any are found */}
            {albums.length > 0 && (
                <div className="albums-list" style={{ marginTop: '20px' }}>
                    <h3>Found Albums ({albums.length}):</h3>

                    {/* Grid for displaying albums */}
                    <div className="albums-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: '15px',
                        marginTop: '15px'
                    }}>
                        {/* Map over the albums array and create a card for each album */}
                        {albums.map((album, index) => (
                            <div key={index} className="album-card" style={{
                                border: '1px solid #ddd',
                                padding: '15px',
                                borderRadius: '8px',
                                backgroundColor: '#f9f9f9'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>
                                    {album.album}
                                </h4>
                                <p style={{ margin: '5px 0', color: '#666' }}>
                                    <strong>Artist:</strong> {album.artist}
                                </p>
                                <p style={{ margin: '5px 0', color: '#666' }}>
                                    <strong>Tracks:</strong> {album.trackCount}
                                </p>
                                <p style={{ margin: '5px 0', fontSize: '12px', color: '#888' }}>
                                    {album.path}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Export the component so it can be used in other files
export default MusicImportController;