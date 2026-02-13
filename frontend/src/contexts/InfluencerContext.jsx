import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../services/api';

const InfluencerContext = createContext(null);

export const useInfluencer = () => {
  const context = useContext(InfluencerContext);
  if (!context) {
    throw new Error('useInfluencer must be used within an InfluencerProvider');
  }
  return context;
};

export const InfluencerProvider = ({ children }) => {
  const [influencer, setInfluencer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionLimits, setSubscriptionLimits] = useState(null);

  // Fetch influencer profile data from backend
  const fetchInfluencerData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/influencer/profile`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        // User not authenticated, clear context
        setInfluencer(null);
        setError('The user is not authenticated');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load influencer profile');
      }

      const data = await response.json();
      if (data.success && data.influencer) {
        setInfluencer(data.influencer);
        setError(null);
      } else {
        setInfluencer(null);
        setError('No influencer data available');
      }
    } catch (err) {
      console.error('Error fetching influencer data:', err);
      setError(err.message || 'Failed to load influencer data');
      setInfluencer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize influencer data after signin
  const initializeInfluencer = useCallback(async (userData) => {
    // If we have userData from signin, we can set basic info immediately
    // and then fetch full profile
    if (userData && userData.userType === 'influencer') {
      setInfluencer({
        id: userData.id,
        email: userData.email,
        displayName: userData.displayName,
        username: userData.username || userData.email?.split('@')[0]
      });
      // Fetch full profile data
      await fetchInfluencerData();
    }
  }, [fetchInfluencerData]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/influencer/signout`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        setInfluencer(null);
        setError(null);
        window.location.href = '/signin';
      } else {
        // Even on error, clear context and redirect
        setInfluencer(null);
        setError(null);
        window.location.href = '/signin';
      }
    } catch (error) {
      console.error('Error during signout:', error);
      // Even on error, clear context and redirect
      setInfluencer(null);
      setError(null);
      window.location.href = '/signin';
    }
  }, []);

  // Update influencer data (useful after profile updates)
  const updateInfluencer = useCallback((updatedData) => {
    setInfluencer((prev) => (prev ? { ...prev, ...updatedData } : updatedData));
  }, []);

  // Refresh influencer data
  const refreshInfluencer = useCallback(async () => {
    await fetchInfluencerData();
  }, [fetchInfluencerData]);

  // Cache dashboard data (subscription info from dashboard)
  const cacheDashboardData = useCallback((dashboardData) => {
    if (dashboardData.subscriptionStatus) {
      setSubscriptionStatus(dashboardData.subscriptionStatus);
    }
    if (dashboardData.subscriptionLimits) {
      setSubscriptionLimits(dashboardData.subscriptionLimits);
    }
  }, []);

  // Check if we should fetch on mount (only if on influencer pages)
  useEffect(() => {
    const path = window.location.pathname;
    if ((path.startsWith('/influencer') || path.startsWith('/subscription') || path === '/feedback') && !influencer && !loading) {
      fetchInfluencerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const value = {
    influencer,
    loading,
    error,
    subscriptionStatus,
    subscriptionLimits,
    signOut,
    updateInfluencer,
    refreshInfluencer: fetchInfluencerData,
    cacheDashboardData,
    initializeInfluencer,
    fetchInfluencerData,
    isAuthenticated: !!influencer
  };

  return <InfluencerContext.Provider value={value}>{children}</InfluencerContext.Provider>;
};

