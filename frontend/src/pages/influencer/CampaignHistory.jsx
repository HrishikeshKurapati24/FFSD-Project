import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/influencer/campaign_history.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import InfluencerNavigation from '../../components/influencer/InfluencerNavigation';
import CampaignHistoryHeader from '../../components/influencer/campaignHistory/CampaignHistoryHeader';
import CampaignHistoryList from '../../components/influencer/campaignHistory/CampaignHistoryList';

const EXTERNAL_ASSETS = {
  styles: ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'],
  scripts: []
};

const formatNumber = (value) => {
  const numericValue = Number(value || 0);
  if (Number.isNaN(numericValue)) {
    return '0';
  }
  if (numericValue >= 1_000_000) {
    return `${(numericValue / 1_000_000).toFixed(1)}M`;
  }
  if (numericValue >= 1_000) {
    return `${(numericValue / 1_000).toFixed(1)}K`;
  }
  return numericValue.toLocaleString();
};

const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const formatCurrency = (value) => {
  const numericValue = Number(value || 0);
  if (Number.isNaN(numericValue)) {
    return '$0';
  }
  return `$${numericValue.toLocaleString()}`;
};

const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }
  try {
    return new Date(value).toLocaleDateString();
  } catch (error) {
    return 'N/A';
  }
};

const CampaignHistory = () => {
  useExternalAssets(EXTERNAL_ASSETS);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  const fetchCampaignHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/influencer/campaign-history`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/signin');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load campaign history.');
      }

      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      } else {
        setError(data.message || 'Unable to load campaign history.');
      }
    } catch (err) {
      console.error('Error fetching campaign history:', err);
      setError(err.message || 'Unable to load campaign history.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCampaignHistory();
  }, [fetchCampaignHistory]);

  const handleSignOut = async (event) => {
    event?.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/influencer/signout`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          if (data.success) {
            window.location.href = '/signin';
            return;
          }
        }
      }
    } catch (signOutError) {
      console.error('Error during sign out:', signOutError);
    }
    window.location.href = '/signin';
  };

  const getBrandLogo = (logoPath) => {
    if (!logoPath) {
      return '/images/default-brand-logo.jpg';
    }
    return logoPath.startsWith('http') ? logoPath : `${API_BASE_URL}${logoPath}`;
  };

  if (loading) {
    return (
      <div className={styles['campaign-history-page']}>
        <div className={styles['loading-state']}>Loading campaign history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['campaign-history-page']}>
        <div className={styles['error-state']}>
          <p>{error}</p>
          <button type="button" onClick={fetchCampaignHistory}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['campaign-history-page']}>
      <InfluencerNavigation onSignOut={handleSignOut} />

      <div className={styles.container}>
        <CampaignHistoryHeader styles={styles} onRefresh={fetchCampaignHistory} />

        <CampaignHistoryList
          campaigns={campaigns}
          styles={styles}
          formatNumber={formatNumber}
          formatPercent={formatPercent}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getBrandLogo={getBrandLogo}
        />
      </div>
    </div>
  );
};

export default CampaignHistory;