import React, { useState, useEffect } from 'react';
import MusicImportService from '../services/MusicImportService';

const MusicImportController = () => {
    const [albums, setAlbums] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedAlbums, setSelectedAlbums] = useState([]);
    const [totalSize, setTotalSize] = useState(0);
    const [sortOrder, setSortOrder] = useState('desc');
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferProgress, setTransferProgress] = useState(0);

    useEffect(() => {
        const fetchAlbums = async () => {
            setIsLoading(true);
            setError('');

            try {
                const result = await MusicImportService.scanMusicLibrary();

                if (result.success) {
                    setAlbums(result.albums);
                } else {
                    setError(result.message);
                }
            } catch (error) {
                console.error('Error loading music library:', error);
                setError('Failed to load music library: ' + error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAlbums();
    }, []);

    const toggleAlbumSelection = (album) => {
        if (selectedAlbums.includes(album)) {
            setSelectedAlbums(selectedAlbums.filter((selectedAlbum) => selectedAlbum !== album));
            setTotalSize((prevTotalSize) => prevTotalSize - album.size);
        } else {
            setSelectedAlbums([...selectedAlbums, album]);
            setTotalSize((prevTotalSize) => prevTotalSize + album.size);
        }
    };

    const startTransfer = async () => {
        if (selectedAlbums.length === 0) {
            setError('Please select at least one album to transfer.');
            return;
        }

        setIsTransferring(true);
        setTransferProgress(0);
        setError(''); // Clear any previous errors

        try {
            const result = await MusicImportService.transferAlbums(
                selectedAlbums,
                (progress) => setTransferProgress(progress)
            );

            if (result.success) {
                setTransferProgress(100);
                // Clear selection after successful transfer
                setSelectedAlbums([]);
                setTotalSize(0); // Add this line to fix the bug
            } else {
                setError(result.message);
            }
        } catch (error) {
            console.error('Error during transfer:', error);
            setError('Failed to transfer albums: ' + error.message);
        } finally {
            setIsTransferring(false);
        }
    };

    const formatSize = (sizeInBytes) => {
        const sizeInMB = sizeInBytes / (1024 * 1024);
        return sizeInMB > 1024
            ? `${(sizeInMB / 1024).toFixed(2)} GB`
            : `${sizeInMB.toFixed(2)} MB`;
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
            {isLoading && (
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <p>Loading music library...</p>
                </div>
            )}

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

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <button
                    onClick={startTransfer}
                    disabled={isTransferring || selectedAlbums.length === 0}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: isTransferring ? '#6c757d' : '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: isTransferring || selectedAlbums.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                    }}
                >
                    {isTransferring ? `Transferring... (${transferProgress}%)` : `Transfer`}
                </button>
            </div>

            {albums.length > 0 && (
                <>
                    <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '16px' }}>
                        <strong>Total Size of Selected Albums:</strong> {formatSize(totalSize)}
                        {selectedAlbums.length > 0 && (
                            <span style={{ marginLeft: '20px' }}>
                                <strong>Albums Selected:</strong> {selectedAlbums.length}
                            </span>
                        )}
                    </div>

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
                                onClick={() => toggleAlbumSelection(album)}
                            >
                                <img
                                    src={album.albumCover
                                        ? `data:${album.albumCover.format};base64,${album.albumCover.data}`
                                        : '/assets/emptyCover.jpeg'}
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
                </>
            )}
        </div>
    );
};

export default MusicImportController;