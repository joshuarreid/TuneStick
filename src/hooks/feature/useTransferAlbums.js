import { useState } from 'react';
import MusicLibraryService from "../../services/MusicLibraryService";

export function useTransferAlbums(selectedAlbums, setSelectedAlbums, setTotalSize) {
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferProgress, setTransferProgress] = useState(0);
    const [transferComplete, setTransferComplete] = useState(false);
    const [error, setError] = useState('');

    const startTransfer = async () => {
        if (selectedAlbums.length === 0) {
            setError('Please select at least one album to transfer.');
            return;
        }
        try {
            let destinationResult;
            if (MusicLibraryService.selectDestination && typeof MusicLibraryService.selectDestination === 'function') {
                destinationResult = await MusicImportService.selectDestination();
            } else {
                destinationResult = { success: true };
            }
            if (!destinationResult.success) {
                setError('Destination selection was cancelled or failed.');
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
                const result = await MusicLibraryService.transferAlbums(selectedAlbums, updateProgress);
                setTransferProgress(100);
                if (result.success) {
                    setTimeout(() => {
                        setTransferComplete(true);
                        setSelectedAlbums([]);
                        setTotalSize(0);
                    }, 200);
                } else {
                    setError(result.message);
                    setShowTransferModal(false);
                }
            } catch (error) {
                setError('Failed to transfer albums: ' + error.message);
                setShowTransferModal(false);
            }
        } catch (error) {
            setError('Failed to select destination: ' + error.message);
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