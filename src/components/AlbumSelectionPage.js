import React, { useState, useEffect } from 'react';
import MusicImportService from '../services/MusicLibraryService';
import emptyCoverImage from '../assets/emptyCover.jpeg';

const AlbumSelectionPage = () => {
    const [albums, setAlbums] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedAlbums, setSelectedAlbums] = useState([]);
    const [totalSize, setTotalSize] = useState(0);
    const [sortOrder, setSortOrder] = useState('desc');
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferProgress, setTransferProgress] = useState(0);
    const [transferComplete, setTransferComplete] = useState(false);
    const [showSelectedModal, setShowSelectedModal] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);

    useEffect(() => {
        const fetchAlbums = async () => {
            setIsLoading(true);
            setError('');

            try {
                const result = await MusicImportService.scanMusicLibrary();

                if (result.success) {
                    // Sort by recently modified (descending)
                    const sortedAlbums = result.albums.sort(
                        (a, b) => new Date(b.modified) - new Date(a.modified)
                    );
                    setAlbums(sortedAlbums);
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
    },  []);

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

            // Use actual backend progress updates
            const updateProgress = (actualProgress) => {
                setTransferProgress(actualProgress);
            };

            try {
                const result = await MusicImportService.transferAlbums(
                    selectedAlbums,
                    updateProgress
                );

                // Ensure we show 100% for at least a moment
                setTransferProgress(100);

                if (result.success) {
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

    // Remove album from selection
    const removeSelectedAlbum = (index) => {
        const album = selectedAlbums[index];
        setSelectedAlbums(selectedAlbums.filter((_, i) => i !== index));
        setTotalSize((prevTotalSize) => prevTotalSize - album.size);
    };

    // Drag and drop handlers for reordering
    const handleDragStart = (index) => {
        setDraggedIndex(index);
    };
    const handleDragOver = (index) => {
        if (draggedIndex === null || draggedIndex === index) return;
        const updated = [...selectedAlbums];
        const [dragged] = updated.splice(draggedIndex, 1);
        updated.splice(index, 0, dragged);
        setSelectedAlbums(updated);
        setDraggedIndex(index);
    };
    const handleDragEnd = () => {
        setDraggedIndex(null);
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

            {/* Floating Modal for Total Size and Transfer Button */}
            <div
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    backgroundColor: '#222',
                    border: '2px solid #007bff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    width: '350px',
                    height: '140px',
                    minWidth: '350px',
                    minHeight: '140px',
                    maxWidth: '350px',
                    maxHeight: '140px',
                    textAlign: 'center',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                }}
            >
                <div style={{ fontSize: '16px', marginBottom: '12px', color: '#fff' }}>
                    <strong>Total Size of Selected Albums:</strong> {formatSize(totalSize)}
                </div>
                {selectedAlbums.length > 0 && (
                    <div
                        style={{ fontSize: '14px', marginBottom: '12px', color: '#ccc', cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => {
                            console.log('Albums Selected clicked');
                            setShowSelectedModal(true);
                        }}
                    >
                        <strong>Albums Selected:</strong> {selectedAlbums.length}
                    </div>
                )}
                <button
                    onClick={startTransfer}
                    disabled={selectedAlbums.length === 0}
                    style={{
                        padding: '10px 30px',
                        backgroundColor: selectedAlbums.length === 0 ? '#6c757d' : '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: selectedAlbums.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        width: '70%',
                    }}
                >
                    Transfer
                </button>
            </div>

            {albums.length > 0 && (
                <>
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
                                        : emptyCoverImage}
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
            {/* Selected Albums Modal and Overlay - moved to root level */}
            {showSelectedModal && (
                <>
                    {console.log('Selected Albums Modal should be visible', showSelectedModal, selectedAlbums)}
                    {/* Overlay to close modal when clicking outside */}
                    <div
                        onClick={() => {
                            console.log('Overlay clicked, closing modal');
                            setShowSelectedModal(false);
                        }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            zIndex: 1000,
                            background: 'transparent',
                        }}
                    />
                    {/* Modal itself */}
                    <div
                        style={{
                            position: 'fixed',
                            bottom: '150px',
                            right: '30px',
                            width: '350px',
                            maxHeight: '220px',
                            backgroundColor: '#333',
                            border: '2px solid #007bff',
                            borderRadius: '10px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                            overflowY: 'auto',
                            zIndex: 1001,
                            padding: '10px 0',
                        }}
                    >
                        {selectedAlbums.length === 0 ? (
                            <div style={{ color: '#ccc', textAlign: 'center', padding: '10px' }}>No albums selected.</div>
                        ) : (
                            selectedAlbums.map((album, idx) => (
                                <div
                                    key={album.album + idx}
                                    draggable
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragOver={(e) => { e.preventDefault(); handleDragOver(idx); }}
                                    onDragEnd={handleDragEnd}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px 16px',
                                        borderBottom: '1px solid #444',
                                        background: draggedIndex === idx ? '#222' : 'transparent',
                                        cursor: 'grab',
                                    }}
                                >
                                    {/* Hamburger icon */}
                                    <span style={{ marginRight: '12px', cursor: 'grab', fontSize: '18px' }}>
                                        &#9776;
                                    </span>
                                    <span style={{ flex: 1, color: '#fff', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {album.album}
                                    </span>
                                    <button
                                        onClick={() => removeSelectedAlbum(idx)}
                                        style={{
                                            marginLeft: '12px',
                                            background: 'none',
                                            border: 'none',
                                            color: '#ff4d4f',
                                            fontSize: '18px',
                                            cursor: 'pointer',
                                        }}
                                        title="Remove"
                                    >
                                        &minus;
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AlbumSelectionPage;

