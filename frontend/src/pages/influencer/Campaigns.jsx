import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/influencer/campaigns.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import InfluencerNavigation from '../../components/influencer/InfluencerNavigation';
import CampaignSearchFilters from '../../components/influencer/campaigns/CampaignSearchFilters';
import CampaignList from '../../components/influencer/campaigns/CampaignList';

const EXTERNAL_ASSETS = {
  styles: ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'],
  scripts: []
};

const budgetRanges = [
  { value: '', label: 'Any Budget' },
  { value: '0-500', label: '$0 - $500' },
  { value: '500-1000', label: '$500 - $1,000' },
  { value: '1000-5000', label: '$1,000 - $5,000' },
  { value: '5000+', label: '$5,000+' }
];

const durationOptions = [
  { value: '', label: 'Any Duration' },
  { value: '1-7', label: '1-7 days' },
  { value: '8-30', label: '8-30 days' },
  { value: '31-90', label: '31-90 days' },
  { value: '90+', label: '90+ days' }
];

const channelOptions = ['Instagram', 'YouTube', 'TikTok', 'Facebook', 'Twitter', 'LinkedIn'];
const categoryOptions = [
  'Fashion',
  'Beauty',
  'Lifestyle',
  'Food',
  'Travel',
  'Technology',
  'Fitness',
  'Entertainment',
  'Business',
  'Education',
  'Health',
  'Automotive',
  'Sports',
  'Gaming'
];

const Campaigns = () => {
  useExternalAssets(EXTERNAL_ASSETS);
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    budget: '',
    channel: '',
    duration: '',
    category: ''
  });

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/influencer/collab`, {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.status === 401 || response.status === 403) {
          throw new Error('The user is not authenticated');
        }

        if (!response.ok) {
          throw new Error('Failed to load campaigns');
        }

        const data = await response.json();
        if (data.success && Array.isArray(data.collabs)) {
          setCampaigns(data.collabs);
        } else {
          throw new Error(data.message || 'Unable to fetch campaigns');
        }
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError(err.message || 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [navigate]);

  const handleSignOut = async (event) => {
    event?.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/influencer/signout`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'include'
      });
    } catch (err) {
      console.error('Error during signout:', err);
    } finally {
      window.location.href = '/signin';
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ status: '', budget: '', channel: '', duration: '', category: '' });
    setSearchQuery('');
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 || Object.values(filters).some((value) => value && value.length > 0);

  const filteredCampaigns = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      const searchTarget = [
        campaign.title,
        campaign.brand_name,
        campaign.description,
        campaign.objectives,
        campaign.product_names,
        campaign.primary_category
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (search && !searchTarget.includes(search)) {
        return false;
      }

      if (filters.status) {
        const status = (campaign.status || 'active').toLowerCase();
        if (status !== filters.status.toLowerCase()) {
          return false;
        }
      }

      if (filters.budget) {
        const budget = Number(campaign.budget) || 0;
        switch (filters.budget) {
          case '0-500':
            if (budget < 0 || budget > 500) return false;
            break;
          case '500-1000':
            if (budget < 500 || budget > 1000) return false;
            break;
          case '1000-5000':
            if (budget < 1000 || budget > 5000) return false;
            break;
          case '5000+':
            if (budget < 5000) return false;
            break;
          default:
            break;
        }
      }

      if (filters.channel) {
        const channels = Array.isArray(campaign.required_channels)
          ? campaign.required_channels.map((channel) => (channel || '').toLowerCase())
          : (campaign.required_channels || '').toLowerCase();
        if (Array.isArray(channels)) {
          if (!channels.some((channel) => channel.includes(filters.channel.toLowerCase()))) {
            return false;
          }
        } else if (!channels.includes(filters.channel.toLowerCase())) {
          return false;
        }
      }

      if (filters.duration) {
        const duration = Number(campaign.duration) || 0;
        let actualDuration = duration;
        if (!duration && campaign.start_date && campaign.end_date) {
          const start = new Date(campaign.start_date);
          const end = new Date(campaign.end_date);
          const diff = Math.abs(end - start);
          actualDuration = Math.ceil(diff / (1000 * 60 * 60 * 24));
        }

        switch (filters.duration) {
          case '1-7':
            if (actualDuration < 1 || actualDuration > 7) return false;
            break;
          case '8-30':
            if (actualDuration < 8 || actualDuration > 30) return false;
            break;
          case '31-90':
            if (actualDuration < 31 || actualDuration > 90) return false;
            break;
          case '90+':
            if (actualDuration < 90) return false;
            break;
          default:
            break;
        }
      }

      if (filters.category) {
        const category = (campaign.primary_category || '').toLowerCase();
        if (!category.includes(filters.category.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [campaigns, filters, searchQuery]);

  return (
    <div className={styles.campaignsPage}>
      <InfluencerNavigation onSignOut={handleSignOut} />

      <div className={styles.container}>
        <CampaignSearchFilters
          styles={styles}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
          filters={filters}
          onFilterChange={handleFilterChange}
          budgetRanges={budgetRanges}
          durationOptions={durationOptions}
          channelOptions={channelOptions}
          categoryOptions={categoryOptions}
          hasActiveFilters={hasActiveFilters}
          filteredCount={filteredCampaigns.length}
          onResetFilters={resetFilters}
        />

        {loading && <div className={styles.loadingState}>Loading campaigns...</div>}
        {error && !loading && <div className={styles.errorState}>{error}</div>}

        {!loading && !error && filteredCampaigns.length === 0 && (
          <div className={styles.noCampaigns}>
            <h3>No Campaigns Available</h3>
            <p>There are currently no active campaigns. Check back later for new opportunities!</p>
          </div>
        )}

        {!loading && !error && filteredCampaigns.length > 0 && (
          <CampaignList campaigns={filteredCampaigns} styles={styles} />
        )}
      </div>
    </div>
  );
};

export default Campaigns;
