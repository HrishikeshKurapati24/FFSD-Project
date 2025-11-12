import { API_BASE_URL } from '../services/api';

/**
 * Check if user is authenticated by calling the /auth/verify endpoint
 * @returns {Promise<{authenticated: boolean, user: object|null}>}
 */
export const checkAuth = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (response.status === 401) {
            return {
                authenticated: false,
                user: null
            };
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            authenticated: data.authenticated || false,
            user: data.user || null
        };
    } catch (error) {
        console.error('Error checking authentication:', error);
        return {
            authenticated: false,
            user: null
        };
    }
};

/**
 * Get authentication status (wrapper for checkAuth)
 * @returns {Promise<object|null>} User object if authenticated, null otherwise
 */
export const getAuthStatus = async () => {
    const authResult = await checkAuth();
    return authResult.authenticated ? authResult.user : null;
};

/**
 * Logout user by calling the /auth/logout endpoint
 * @returns {Promise<boolean>} True if logout successful, false otherwise
 */
export const logout = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Redirect to login page
        window.location.href = '/signin';
        return true;
    } catch (error) {
        console.error('Error logging out:', error);
        // Still redirect to login even if logout fails
        window.location.href = '/signin';
        return false;
    }
};
