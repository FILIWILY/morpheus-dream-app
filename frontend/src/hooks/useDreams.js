import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useDreams = () => {
    const [dreams, setDreams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDreams = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/dreams');
            setDreams(response.data || []);
        } catch (err) {
            console.error('Failed to fetch dreams:', err);
            setError('historyLoadError'); // Use i18n key instead of hardcoded string
            setDreams([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDreams();
    }, [fetchDreams]);

    const deleteDreams = useCallback(async (dreamIds) => {
        try {
            await api.delete('/dreams', { data: { dreamIds } });
            setDreams(prevDreams => prevDreams.filter(dream => !dreamIds.includes(dream.id)));
        } catch (err) {
            console.error('Failed to delete dreams:', err);
            setError('historyLoadError'); // Consider a more specific key if available
        }
    }, []);

    return { dreams, isLoading, error, fetchDreams, deleteDreams };
};
