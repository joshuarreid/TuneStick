import React, { useState } from 'react';
import MusicImportService from '../services/MusicImportService';

const MusicImportController = () => {
    const [selectedFolder, setSelectedFolder] = useState('');
    const [albums, setAlbums] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedAlbums, setSelectedAlbums] = useState([]); // State to track selected albums

    const handleImportMusic = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await MusicImportService.selectMusicFolder();

            if (result.success) {
                setSelectedFolder(result.folderPath);
                const scanResult = await MusicImportService.scanMusicLibrary(result.folderPath);

                if (scanResult.success) {
                    setAlbums(scanResult.albums);
                } else {
                    setError(scanResult.message);
                }
            } else {
                console.log(result.message);
            }
        } catch (error) {
            console.error('Import failed:', error);
            setError('Failed to import music: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to toggle album selection
    const toggleAlbumSelection = (album) => {
        if (selectedAlbums.includes(album)) {
            // Remove from selection
            setSelectedAlbums(selectedAlbums.filter((selectedAlbum) => selectedAlbum !== album));
        } else {
            // Add to selection
            setSelectedAlbums([...selectedAlbums, album]);
        }
    };

    return (
        <div
            className="music-import-container"
            style={{
                backgroundColor: '#2c2c2c',
                color: '#fff',
                fontFamily: 'Arial, sans-serif',
                padding: '20px',
                minHeight: '100vh',
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <button
                    onClick={handleImportMusic}
                    disabled={isLoading}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px',
                    }}
                >
                    {isLoading ? 'Scanning...' : 'Import Music'}
                </button>
            </div>

            {error && (
                <div
                    className="error-message"
                    style={{
                        color: 'red',
                        textAlign: 'center',
                        marginBottom: '20px',
                    }}
                >
                    {error}
                </div>
            )}

            {albums.length > 0 && (
                <div
                    className="albums-grid"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: '20px',
                        padding: '0 20px',
                    }}
                >
                    {albums.map((album, index) => (
                        <div
                            key={index}
                            className={`album-card ${selectedAlbums.includes(album) ? 'selected' : ''}`}
                            style={{
                                textAlign: 'center',
                                fontFamily: 'Arial, sans-serif',
                                cursor: 'pointer',
                                border: selectedAlbums.includes(album) ? '2px solid #007bff' : '2px solid transparent',
                                borderRadius: '8px',
                                padding: '10px',
                                backgroundColor: selectedAlbums.includes(album) ? '#444' : 'transparent',
                                transition: 'all 0.3s ease',
                            }}
                            onClick={() => toggleAlbumSelection(album)} // Toggle selection on click
                        >
                            <img
                                src={album.albumCover
                                    ? `data:${album.albumCover.format};base64,${album.albumCover.data}`
                                    : `file://${__dirname}/assets/emptyCover.jpeg`}
                                alt="Album Cover"
                                style={{
                                    width: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                }}
                            />
                            <h4
                                style={{
                                    margin: '10px 0 5px 0',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: '#fff',
                                }}
                            >
                                {album.album}
                            </h4>
                            <p
                                style={{
                                    margin: '0',
                                    fontSize: '10px',
                                    color: '#ccc',
                                }}
                            >
                                {album.artist}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MusicImportController;