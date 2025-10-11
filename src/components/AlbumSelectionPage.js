import React, { useState } from 'react';
    import { useAlbums } from '../hooks/feature/useAlbums';
    import { useAlbumSelection } from '../hooks/feature/useAlbumSelection';
    import { useTransferAlbums } from '../hooks/feature/useTransferAlbums';
    import emptyCoverImage from '../assets/emptyCover.jpeg';
    import './AlbumSelectionPage.css';

    const AlbumSelectionPage = () => {
        const [sortOption, setSortOption] = useState('modified');
        const [showSelectedModal, setShowSelectedModal] = useState(false);

        const { albums: sortedAlbums, isLoading, error: albumsError } = useAlbums(sortOption);

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

        const {
            showTransferModal,
            transferProgress,
            transferComplete,
            error: transferError,
            setShowTransferModal,
            startTransfer,
            closeModal
        } = useTransferAlbums(selectedAlbums, setSelectedAlbums, setTotalSize);

        const error = albumsError || transferError;

        const formatSize = (sizeInBytes) => {
            const sizeInMB = sizeInBytes / (1024 * 1024);
            return sizeInMB > 1024
                ? `${(sizeInMB / 1024).toFixed(2)} GB`
                : `${sizeInMB.toFixed(2)} MB`;
        };

        return (
            <div className="music-import-container">
                {/* Sort Dropdown */}
                <div className="sort-dropdown">
                    <select
                        value={sortOption}
                        onChange={e => setSortOption(e.target.value)}
                        className="sort-select"
                    >
                        <option value="modified">Recently Modified</option>
                        <option value="artist">Artist</option>
                        <option value="album">Album Name (A-Z)</option>
                    </select>
                </div>

                {isLoading && (
                    <div className="loading-message">
                        <p>Loading music library...</p>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Floating Modal for Total Size and Transfer Button */}
                <div className="floating-modal">
                    <div className="total-size">
                        <strong>Total Size of Selected Albums:</strong> {formatSize(totalSize)}
                    </div>
                    {selectedAlbums.length > 0 && (
                        <div
                            className="selected-albums-count"
                            onClick={() => setShowSelectedModal(true)}
                        >
                            <strong>Albums Selected:</strong> {selectedAlbums.length}
                        </div>
                    )}
                    <button
                        onClick={startTransfer}
                        disabled={selectedAlbums.length === 0}
                        className={`transfer-btn${selectedAlbums.length === 0 ? ' disabled' : ''}`}
                    >
                        Transfer
                    </button>
                </div>

                {sortedAlbums.length > 0 && (
                    <div className="albums-grid">
                        {sortedAlbums.map((album, index) => (
                            <div
                                key={index}
                                className={`album-card${selectedAlbums.includes(album) ? ' selected' : ''}`}
                                onClick={() => toggleAlbumSelection(album)}
                            >
                                <img
                                    src={album.albumCover
                                        ? `data:${album.albumCover.format};base64,${album.albumCover.data}`
                                        : emptyCoverImage}
                                    alt="Album Cover"
                                    className="album-cover"
                                />
                                <h4 className="album-title">
                                    {album.album}
                                </h4>
                                <p className="album-artist">
                                    {album.artist}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Transfer Modal */}
                {showTransferModal && (
                    <div className="transfer-modal-overlay">
                        <div className="transfer-modal">
                            {!transferComplete ? (
                                <>
                                    <h3 className="transfer-modal-title">
                                        Transferring Albums...
                                    </h3>
                                    <div className="transfer-progress-bar-bg">
                                        <div
                                            className="transfer-progress-bar"
                                            style={{ width: `${transferProgress}%` }}
                                        />
                                    </div>
                                    <p className="transfer-progress-text">
                                        {Math.round(transferProgress)}%
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="transfer-complete-title">
                                        Transfer Complete!
                                    </h3>
                                    <button
                                        onClick={closeModal}
                                        className="close-modal-btn"
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
                            className="selected-modal-overlay"
                        />
                        <div className="selected-modal">
                            {selectedAlbums.length === 0 ? (
                                <div className="no-albums-selected">No albums selected.</div>
                            ) : (
                                selectedAlbums.map((album, idx) => (
                                    <div
                                        key={album.album + idx}
                                        draggable
                                        onDragStart={() => handleDragStart(idx)}
                                        onDragOver={(e) => { e.preventDefault(); handleDragOver(idx); }}
                                        onDragEnd={handleDragEnd}
                                        className={`selected-album-row${draggedIndex === idx ? ' dragged' : ''}`}
                                    >
                                        <span className="drag-handle">&#9776;</span>
                                        <span className="selected-album-title">
                                            {album.album}
                                        </span>
                                        <button
                                            onClick={() => removeSelectedAlbum(idx)}
                                            className="remove-album-btn"
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