import React, { useState } from 'react';
import { useAlbums } from './useAlbums';
import { useAlbumSelection } from './useAlbumSelection';
import { useTransferAlbums } from './useTransferAlbums';
import MusicLibraryService from '../../services/MusicLibraryService';
import emptyCoverImage from '../../assets/emptyCover.jpeg';
import './AlbumSelectionPage.css';

const AlbumSelectionPage = () => {
    const [sortOption, setSortOption] = useState('modified');
    const [showSelectedModal, setShowSelectedModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // New state: drive name modal
    const [showDriveNameModal, setShowDriveNameModal] = useState(false);
    const [driveNameInput, setDriveNameInput] = useState('');
    const [driveAction, setDriveAction] = useState('append');

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
        startTransfer,
        closeModal,
        cancelTransfer,
        currentTrack,
        trackIndex,
        totalTracks,
        currentAlbum
    } = useTransferAlbums(selectedAlbums, setSelectedAlbums, setTotalSize);

    const error = albumsError || transferError;

    // Filter albums by search query (album name or artist name)
    const filteredAlbums = React.useMemo(() => {
        if (!searchQuery || searchQuery.trim() === '') return sortedAlbums || [];
        const q = searchQuery.toLowerCase();
        return (sortedAlbums || []).filter(album => {
            const albumName = (album.album || '').toLowerCase();
            const artistName = (album.artist || '').toLowerCase();
            return albumName.includes(q) || artistName.includes(q);
        });
    }, [searchQuery, sortedAlbums]);

    const formatSize = (sizeInBytes) => {
        const sizeInMB = sizeInBytes / (1024 * 1024);
        return sizeInMB > 1024
            ? `${(sizeInMB / 1024).toFixed(2)} GB`
            : `${sizeInMB.toFixed(2)} MB`;
    };

    const handleTransferClick = async () => {
        // If no albums selected, just call startTransfer which will show an error
        if (selectedAlbums.length === 0) {
            startTransfer();
            return;
        }

        try {
            const sel = await MusicLibraryService.getSelectedDrive();
            if (sel && sel.success && sel.drive) {
                // derive default name from mount point
                const parts = sel.drive.split('/');
                const defaultName = parts[parts.length - 1] || 'UNTITLED';
                setDriveNameInput(defaultName);
                setShowDriveNameModal(true);
            } else {
                // no selected drive -> fallback to folder picker via startTransfer()
                startTransfer();
            }
        } catch (err) {
            // On error, fallback to folder picker
            console.error('Error checking selected drive, falling back to folder picker', err);
            startTransfer();
        }
    };

    const confirmDriveNameAndTransfer = async () => {
        setShowDriveNameModal(false);
        const options = { action: driveAction };
        if (driveAction === 'erase') {
            const trimmed = (driveNameInput || '').trim();
            if (trimmed !== '') options.label = trimmed;
        }
        await startTransfer(options);
    };

    const cancelDriveName = () => {
        setShowDriveNameModal(false);
        // User cancelled naming -> abort transfer (do nothing)
    };

    return (
        <div className="music-import-container">
            {/* Controls: Search (left) + Sort (right) */}
            <div className="controls">
                <input
                    type="text"
                    placeholder="Search albums or artists..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="search-input"
                    aria-label="Search albums or artists"
                />
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
                    onClick={handleTransferClick}
                    disabled={selectedAlbums.length === 0}
                    className={`transfer-btn${selectedAlbums.length === 0 ? ' disabled' : ''}`}
                >
                    Transfer
                </button>
            </div>

            {/* Drive Action Modal (Append vs Erase) */}
            {showDriveNameModal && (
                <>
                    <div className="selected-modal-overlay" onClick={cancelDriveName} />
                    <div className="selected-modal drive-action">
                        <h3>Prepare Drive</h3>
                        <p>Choose what to do with the selected drive:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="radio"
                                    name="driveAction"
                                    value="append"
                                    checked={driveAction === 'append'}
                                    onChange={() => setDriveAction('append')}
                                />
                                <span><strong>Append</strong> — Add selected albums to the drive without erasing existing content.</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input
                                    type="radio"
                                    name="driveAction"
                                    value="erase"
                                    checked={driveAction === 'erase'}
                                    onChange={() => setDriveAction('erase')}
                                />
                                <span><strong>Erase & Transfer</strong> — Erase all drive contents before transferring.</span>
                            </label>
                        </div>

                        {driveAction === 'erase' && (
                            <>
                                <p style={{ marginTop: 12 }}>Enter a name for the drive (leave blank to keep current name):</p>
                                <input
                                    type="text"
                                    value={driveNameInput}
                                    onChange={(e) => setDriveNameInput(e.target.value)}
                                    className="drive-name-input"
                                />
                            </>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                            <button onClick={cancelDriveName} className="cancel-btn">Cancel</button>
                            {driveAction === 'erase' ? (
                                <button onClick={confirmDriveNameAndTransfer} className="confirm-btn">Erase & Transfer</button>
                            ) : (
                                <button onClick={confirmDriveNameAndTransfer} className="confirm-btn">Transfer (Append)</button>
                            )}
                        </div>
                    </div>
                </>
            )}

            {filteredAlbums.length > 0 ? (
                <div className="albums-grid">
                    {filteredAlbums.map((album, index) => (
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
            ) : (
                <div className="no-results" style={{ textAlign: 'center', marginTop: 20, color: '#ccc' }}>
                    No albums found.
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
                                {currentTrack && (
                                    <p className="transfer-current-track" style={{ marginTop: 8, color: '#cfeaff' }}>
                                        Copying: <strong>{currentAlbum || ''}</strong> — {currentTrack} ({trackIndex}/{totalTracks})
                                    </p>
                                )}

                                {/* New: Cancel button to stop the ongoing transfer */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                                    <button
                                        onClick={cancelTransfer}
                                        className="cancel-btn"
                                    >
                                        Cancel
                                    </button>
                                </div>
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

