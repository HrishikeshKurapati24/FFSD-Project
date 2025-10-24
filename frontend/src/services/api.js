const API_BASE_URL = 'http://localhost:3000'; // Adjust based on your backend URL

export const apiService = {
    async fetchBrands() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/brands`, {
                method: 'GET',
                credentials: 'include', // Include cookies and authorization headers
                headers: {
                    'Content-Type': 'application/json',
                }
            });
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
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching influencers:', error);
            throw error;
        }
    }
};
