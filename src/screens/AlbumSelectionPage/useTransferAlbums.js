import { useState } from 'react';
import MusicLibraryService from "../../services/MusicLibraryService";

export function useTransferAlbums(selectedAlbums, setSelectedAlbums, setTotalSize) {
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferProgress, setTransferProgress] = useState(0);
    const [transferComplete, setTransferComplete] = useState(false);
    const [error, setError] = useState('');

    // New: track-level metadata
    const [currentTrack, setCurrentTrack] = useState(null);
    const [trackIndex, setTrackIndex] = useState(0);
    const [totalTracks, setTotalTracks] = useState(0);
    const [currentAlbum, setCurrentAlbum] = useState(null);

    const startTransfer = async (options = {}) => {
        if (selectedAlbums.length === 0) {
            setError('Please select at least one album to transfer.');
            return;
        }

        setShowTransferModal(true);
        setTransferProgress(0);
        setTransferComplete(false);
        setError('');

        // reset track info
        setCurrentTrack(null);
        setTrackIndex(0);
        setTotalTracks(0);
        setCurrentAlbum(null);

        const updateProgress = (payload) => {
            // payload may be an object { progress, trackName, trackIndex, totalTracks, album }
            if (payload && typeof payload === 'object') {
                setTransferProgress(payload.progress || 0);
                setCurrentTrack(payload.trackName || null);
                setTrackIndex(payload.trackIndex || 0);
                setTotalTracks(payload.totalTracks || 0);
                setCurrentAlbum(payload.album || null);
            } else {
                // backward compatible: numeric progress
                setTransferProgress(payload || 0);
            }
        };

        try {
            const result = await MusicLibraryService.transferAlbums(selectedAlbums, updateProgress, options);
            setTransferProgress(100);
            if (result && result.success) {
                setTimeout(() => {
                    setTransferComplete(true);
                    setSelectedAlbums([]);
                    setTotalSize(0);
                    // clear track metadata after completion
                    setCurrentTrack(null);
                    setTrackIndex(0);
                    setTotalTracks(0);
                    setCurrentAlbum(null);
                }, 200);
            } else {
                setError(result.message || 'Transfer failed');
                setShowTransferModal(false);
            }
        } catch (err) {
            setError('Failed to transfer albums: ' + (err.message || err));
            setShowTransferModal(false);
        }
    };

    const closeModal = () => {
        setShowTransferModal(false);
        setTransferComplete(false);
        setTransferProgress(0);
        // reset track metadata
        setCurrentTrack(null);
        setTrackIndex(0);
        setTotalTracks(0);
        setCurrentAlbum(null);
    };

    // New: cancel ongoing transfer (calls main via service). Minimal behavior — just request cancellation and hide modal.
    const cancelTransfer = async () => {
        try {
            await MusicLibraryService.cancelTransfer();
        } catch (err) {
            console.error('Error sending cancel request:', err);
        }
        // Hide modal immediately; main process will stop copying and service will clean up listeners when transferAlbums resolves.
        setShowTransferModal(false);
    };

    return {
        showTransferModal,
        transferProgress,
        transferComplete,
        error,
        setShowTransferModal,
        setTransferProgress,
        setTransferComplete,
        setError,
        startTransfer,
        closeModal,
        // track metadata
        currentTrack,
        trackIndex,
        totalTracks,
        currentAlbum,
        cancelTransfer,
    };
}