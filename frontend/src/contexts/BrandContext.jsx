import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../services/api';

const BrandContext = createContext(null);

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};

export const BrandProvider = ({ children }) => {
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionLimits, setSubscriptionLimits] = useState(null);

  // Fetch brand profile data from backend
  const fetchBrandData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/brand/profile`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        // User not authenticated, clear context
        setBrand(null);
        setError('The user is not authenticated');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load brand profile');
      }

      const data = await response.json();
      if (data.success && data.brand) {
        setBrand(data.brand);
        setError(null);
      } else {
        setBrand(null);
        setError('No brand data available');
      }
    } catch (err) {
      console.error('Error fetching brand data:', err);
      setError(err.message || 'Failed to load brand data');
      setBrand(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize brand data after signin
  const initializeBrand = useCallback(async (userData) => {
    // If we have userData from signin, we can set basic info immediately
    // and then fetch full profile
    if (userData && userData.userType === 'brand') {
      setBrand({
        id: userData.id,
        email: userData.email,
        displayName: userData.displayName,
        username: userData.username || userData.email?.split('@')[0]
      });
      // Fetch full profile data
      await fetchBrandData();
    }
  }, [fetchBrandData]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/brand/signout`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        setBrand(null);
        setError(null);
        window.location.href = '/signin';
      } else {
        // Even on error, clear context and redirect
        setBrand(null);
        setError(null);
        window.location.href = '/signin';
      }
    } catch (error) {
      console.error('Error during signout:', error);
      // Even on error, clear context and redirect
      setBrand(null);
      setError(null);
      window.location.href = '/signin';
    }
  }, []);

  // Update brand data (useful after profile updates)
  const updateBrand = useCallback((updatedData) => {
    setBrand((prev) => (prev ? { ...prev, ...updatedData } : updatedData));
  }, []);

  // Refresh brand data
  const refreshBrand = useCallback(async () => {
    await fetchBrandData();
  }, [fetchBrandData]);

  // Cache dashboard data (subscription info from dashboard)
  const cacheDashboardData = useCallback((dashboardData) => {
    if (dashboardData.subscriptionStatus) {
      setSubscriptionStatus(dashboardData.subscriptionStatus);
    }
    if (dashboardData.subscriptionLimits) {
      setSubscriptionLimits(dashboardData.subscriptionLimits);
    }
  }, []);

  // Check if we should fetch on mount (only if on brand pages)
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/brand') && !brand && !loading) {
      fetchBrandData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const value = {
    brand,
    loading,
    error,
    subscriptionStatus,
    subscriptionLimits,
    signOut,
    updateBrand,
    refreshBrand: fetchBrandData,
    cacheDashboardData,
    initializeBrand,
    fetchBrandData,
    isAuthenticated: !!brand
  };

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};

