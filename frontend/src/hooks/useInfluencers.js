import { useState } from 'react';
import { apiService } from '../services/api';

export const useInfluencers = () => {
    const [influencers, setInfluencers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchInfluencers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.fetchInfluencers();
            setInfluencers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch influencers');
        } finally {
            setLoading(false);
        }
    };

    return { influencers, loading, error, fetchInfluencers };
};
