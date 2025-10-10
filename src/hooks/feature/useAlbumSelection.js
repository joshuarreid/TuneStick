import { useState } from 'react';

export function useAlbumSelection() {
    const [selectedAlbums, setSelectedAlbums] = useState([]);
    const [totalSize, setTotalSize] = useState(0);
    const [draggedIndex, setDraggedIndex] = useState(null);


    /**
     * Toggles the selection state of an album.
     */
    const toggleAlbumSelection = (album) => {
        //If album already selected, remove it
        if (selectedAlbums.includes(album)) {
            setSelectedAlbums(selectedAlbums.filter((selectedAlbum) => selectedAlbum !== album));
            setTotalSize(prevTotalSize => prevTotalSize - album.size);
        }
        //If album not selected, add it
        else {
            // Duplicate array with new album added
            setSelectedAlbums([...selectedAlbums, album]);
            setTotalSize(prevTotalSize => prevTotalSize + album.size);
        }
    };


    /**
     * Removes an album from the selected albums list by its index.
     */
    const removeSelectedAlbum = (index) => {
        const album = selectedAlbums[index];
        // create a new array without the album at the specified index
        setSelectedAlbums(selectedAlbums.filter((_, i) => i !== index));
        setTotalSize(prevTotalSize => prevTotalSize - album.size);
    }

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

    return {
        selectedAlbums,
        totalSize,
        draggedIndex,
        setSelectedAlbums,
        setTotalSize,
        toggleAlbumSelection,
        removeSelectedAlbum,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
    };


}