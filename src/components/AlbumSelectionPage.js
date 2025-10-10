import React, { useState } from 'react';
import { useAlbums } from '../hooks/useAlbums';
import { useAlbumSelection } from '../hooks/useAlbumSelection';
import { useTransferAlbums } from '../hooks/useTransferAlbums';
import emptyCoverImage from '../assets/emptyCover.jpeg';

const AlbumSelectionPage = () => {
    const [sortOption, setSortOption] = useState('modified');
    const [showSelectedModal, setShowSelectedModal] = useState(false);

    // 1. Albums hook
    const { albums: sortedAlbums, isLoading, error: albumsError } = useAlbums(sortOption);

    // 2. Selection hook
    const {
        selectedAlbums,
        totalSize,
        draggedIndex,
        toggleAlbumSelection,
        removeSelectedAlbum,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        setSelectedAlbums,
        setTotalSize
    } = useAlbumSelection();

    // 3. Transfer hook
    const {
        showTransferModal,
        transferProgress,
        transferComplete,
        error: transferError,
        setShowTransferModal,
        startTransfer,
        closeModal
    } = useTransferAlbums(selectedAlbums, setSelectedAlbums, setTotalSize);

    // Merge errors for display
    const error = albumsError || transferError;

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
                position: 'relative',
            }}
        >
            {/* Sort Dropdown */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: '100%', marginBottom: '18px', marginTop: '2px' }}>
                <select
                    value={sortOption}
                    onChange={e => setSortOption(e.target.value)}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid #007bff',
                        background: '#222',
                        color: '#fff',
                        fontSize: '16px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        outline: 'none',
                        cursor: 'pointer',
                        marginRight: '30px',
                    }}
                >
                    <option value="modified">Recently Modified</option>
                    <option value="artist">Artist</option>
                    <option value="album">Album Name (A-Z)</option>
                </select>
            </div>

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
                        onClick={() => setShowSelectedModal(true)}
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

            {sortedAlbums.length > 0 && (
                <div
                    className="albums-grid"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: '20px',
                        padding: '0 20px',
                    }}
                >
                    {sortedAlbums.map((album, index) => (
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

            {/* Selected Albums Modal and Overlay */}
            {showSelectedModal && (
                <>
                    <div
                        onClick={() => setShowSelectedModal(false)}
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