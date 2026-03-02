import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../services/api';

const AdminContext = createContext(null);

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};

export const AdminProvider = ({ children }) => {
    const [admin, setAdminState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Verify admin token on mount
    const verifyAuth = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/verify`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && data.user) {
                    setAdminState(data.user);
                    setError(null);
                } else {
                    setAdminState(null);
                }
            } else {
                setAdminState(null);
            }
        } catch (err) {
            console.error('Admin auth verify error:', err);
            setAdminState(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Only verify if on a protected admin page (not login page itself)
        const path = window.location.pathname;
        if (path.startsWith('/admin') && path !== '/admin/login') {
            verifyAuth();
        } else {
            setLoading(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /**
     * Called after a successful login to update auth state.
     */
    const setAdmin = useCallback((userData) => {
        setAdminState(userData);
        setError(null);
    }, []);

    /**
     * Logs out the admin and clears state.
     */
    const signOut = useCallback(async () => {
        try {
            await fetch(`${API_BASE_URL}/admin/logout`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
        } catch (err) {
            console.error('Admin logout error:', err);
        } finally {
            setAdminState(null);
            setError(null);
            window.location.href = '/admin/login';
        }
    }, []);

    const value = {
        admin,
        loading,
        error,
        isAuthenticated: !!admin,
        setAdmin,
        signOut,
        verifyAuth
    };

    return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
