import {useState, useEffect, useMemo} from 'react';
import MusicLibraryService from "../../services/MusicLibraryService";



/**
 * Custom React hook that manages album data from the music library.
 * It handles scanning, loading state, and error tracking, then returns
 * a sorted list of albums based on the selected sort option.
 */
export function useAlbums(sortOption = 'modified') {
    const [albums, setAlbums] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);


    useEffect(() => {
        setIsLoading(true);
        setError('');
        MusicLibraryService.scanMusicLibrary()
            .then(result => {
                if (result.success) {
                    setAlbums(result.albums);
                }
                else {
                    setError(result.message)
                }
            })
            .catch(e => setError('Failed to load music library: ' + e.message))
            .finally(() => setIsLoading(false));
    }, []);


    /**
     * useMemo caches the sorted album list so we only re-sort when albums or sortOption change.
     * This prevents unnecessary sorting on every render and improves performance.
     */
    const sortedAlbums = useMemo(() => {
        if (!albums) return [];
        switch (sortOption) {
            case 'artist':
                return [...albums].sort((a, b) => a.artist.localeCompare(b.artist));
            case 'album':
                return [...albums].sort((a, b) => a.album.localeCompare(b.album));
            case 'modified':
                default:
                return [...albums].sort((a, b) => new Date(b.modified) - new Date(a.modified));

        }
    }, [albums, sortOption]);
    return {albums: sortedAlbums, isLoading, error};
}