import { useState } from 'react';
import MusicLibraryService from "../../services/MusicLibraryService";

export function useTransferAlbums(selectedAlbums, setSelectedAlbums, setTotalSize) {
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferProgress, setTransferProgress] = useState(0);
    const [transferComplete, setTransferComplete] = useState(false);
    const [error, setError] = useState('');

    const startTransfer = async (options = {}) => {
        if (selectedAlbums.length === 0) {
            setError('Please select at least one album to transfer.');
            return;
        }

        setShowTransferModal(true);
        setTransferProgress(0);
        setTransferComplete(false);
        setError('');

        const updateProgress = (actualProgress) => {
            setTransferProgress(actualProgress);
        };

        try {

            const result = await MusicLibraryService.transferAlbums(selectedAlbums, updateProgress, options);
            setTransferProgress(100);
            if (result && result.success) {
                setTimeout(() => {
                    setTransferComplete(true);
                    setSelectedAlbums([]);
                    setTotalSize(0);
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
    };
}