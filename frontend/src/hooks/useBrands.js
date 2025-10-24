import { useState } from 'react';
import { apiService } from '../services/api';

export const useBrands = () => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBrands = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.fetchBrands();
            setBrands(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch brands');
        } finally {
            setLoading(false);
        }
    };

    return { brands, loading, error, fetchBrands };
};
