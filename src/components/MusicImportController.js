import React, { useState, useEffect } from 'react';
import MusicImportService from '../services/MusicImportService';

const MusicImportController = () => {
    const [albums, setAlbums] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedAlbums, setSelectedAlbums] = useState([]);
    const [totalSize, setTotalSize] = useState(0);
    const [sortOrder, setSortOrder] = useState('desc');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferProgress, setTransferProgress] = useState(0);
    const [transferComplete, setTransferComplete] = useState(false);

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

        try {
            // First, open destination selector (Finder)
            let destinationResult;

            // Check if selectDestination method exists
            if (MusicImportService.selectDestination && typeof MusicImportService.selectDestination === 'function') {
                destinationResult = await MusicImportService.selectDestination();
            } else {
                // Fallback - assume destination is selected or use a default method
                console.warn('selectDestination method not found, proceeding with transfer');
                destinationResult = { success: true };
            }

            if (!destinationResult.success) {
                setError('Destination selection cancelled or failed.');
                return;
            }

            // Show modal and start transfer process
            setShowTransferModal(true);
            setTransferProgress(0);
            setTransferComplete(false);
            setError('');

            // Simulate progress over 1 second minimum
            const startTime = Date.now();
            let progressInterval;

            const updateProgress = (actualProgress) => {
                const elapsedTime = Date.now() - startTime;
                const minDuration = 1000; // 1 second minimum

                if (elapsedTime < minDuration) {
                    // If we haven't reached 1 second yet, interpolate progress
                    const timeProgress = (elapsedTime / minDuration) * 100;
                    setTransferProgress(Math.min(timeProgress, actualProgress));
                } else {
                    // After 1 second, use actual progress
                    setTransferProgress(actualProgress);
                }
            };

            // Start progress simulation
            progressInterval = setInterval(() => {
                updateProgress(transferProgress);
            }, 50);

            try {
                const result = await MusicImportService.transferAlbums(
                    selectedAlbums,
                    updateProgress
                );

                // Ensure we show 100% for at least a moment
                clearInterval(progressInterval);
                setTransferProgress(100);

                if (result.success) {
                    // Wait a bit to show 100%, then mark as complete
                    setTimeout(() => {
                        setTransferComplete(true);
                        // Clear selection after successful transfer
                        setSelectedAlbums([]);
                        setTotalSize(0);
                    }, 200);
                } else {
                    setError(result.message);
                    setShowTransferModal(false);
                }
            } catch (error) {
                clearInterval(progressInterval);
                console.error('Error during transfer:', error);
                setError('Failed to transfer albums: ' + error.message);
                setShowTransferModal(false);
            }

        } catch (error) {
            console.error('Error selecting destination:', error);
            setError('Failed to select destination: ' + error.message);
        }
    };

    const closeModal = () => {
        setShowTransferModal(false);
        setTransferComplete(false);
        setTransferProgress(0);
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
                    disabled={selectedAlbums.length === 0}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: selectedAlbums.length === 0 ? '#6c757d' : '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: selectedAlbums.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                    }}
                >
                    Transfer
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

            {/* Transfer Modal */}
            {showTransferModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#2c2c2c',
                            border: '2px solid #007bff',
                            borderRadius: '10px',
                            padding: '30px',
                            textAlign: 'center',
                            minWidth: '400px',
                            maxWidth: '500px',
                        }}
                    >
                        {!transferComplete ? (
                            <>
                                <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>
                                    Transferring Albums...
                                </h3>
                                <div
                                    style={{
                                        width: '100%',
                                        height: '20px',
                                        backgroundColor: '#444',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        marginBottom: '20px',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${transferProgress}%`,
                                            height: '100%',
                                            backgroundColor: '#007bff',
                                            borderRadius: '10px',
                                            transition: 'width 0.1s ease',
                                        }}
                                    />
                                </div>
                                <p style={{ margin: 0, color: '#ccc', fontSize: '18px' }}>
                                    {Math.round(transferProgress)}%
                                </p>
                            </>
                        ) : (
                            <>
                                <h3 style={{ margin: '0 0 20px 0', color: '#28a745' }}>
                                    Transfer Complete!
                                </h3>
                                <button
                                    onClick={closeModal}
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
                                    Close
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MusicImportController;