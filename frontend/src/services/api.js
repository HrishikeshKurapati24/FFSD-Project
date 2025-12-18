// API_BASE_URL - backend server URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Handle authentication errors (401) by redirecting to login
const handleAuthError = (response) => {
    if (response.status === 401) {
        // Token expired or invalid - redirect to login
        console.log('Authentication required - redirecting to login');
        window.location.href = '/signin';
        return true;
    }
    return false;
};

// Generic API request handler with error handling
const apiRequest = async (url, options = {}) => {
    try {
        // Use full URL to backend
        const requestUrl = `${API_BASE_URL}${url}`;
        const response = await fetch(requestUrl, {
            ...options,
            credentials: 'include', // Include cookies automatically
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            }
        });

        // Handle authentication errors
        if (handleAuthError(response)) {
            return null;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
};

export const apiService = {
    async fetchBrands() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/brands`, {
                method: 'GET',
                credentials: 'include', // Include cookies and authorization headers
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            // Handle authentication errors
            if (handleAuthError(response)) {
                return [];
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching brands:', error);
            throw error;
        }
    },

    async fetchInfluencers() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/influencers`, {
                method: 'GET',
                credentials: 'include', // Include cookies and authorization headers
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            // Handle authentication errors
            if (handleAuthError(response)) {
                return [];
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching influencers:', error);
            throw error;
        }
    },

    // Generic API request method
    request: apiRequest
};
