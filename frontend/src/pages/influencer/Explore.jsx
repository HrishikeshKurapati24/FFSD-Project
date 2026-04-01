import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/influencer/explore.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import InfluencerNavigation from '../../components/influencer/InfluencerNavigation';
import ExploreIntro from '../../components/influencer/explore/ExploreIntro';
import ExploreFilters from '../../components/influencer/explore/ExploreFilters';
import ResultsInfo from '../../components/influencer/explore/ResultsInfo';
import ViewToggle from '../../components/influencer/explore/ViewToggle';
import BrandList from '../../components/influencer/explore/BrandList';
import InviteModal from '../../components/influencer/explore/InviteModal';

const EXTERNAL_ASSETS = {
  styles: [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
  ],
  scripts: []
};

const DEFAULT_BRAND_LOGO = '/images/default-brand.png';

const Explore = () => {
  useExternalAssets(EXTERNAL_ASSETS);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Data states
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [suggestedBrands, setSuggestedBrands] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Invite modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState({ id: null, name: '' });
  const [inviteFormData, setInviteFormData] = useState({
    campaignTitle: '',
    campaignDescription: '',
    budget: '',
    productName: '',
    channels: []
  });


  const getBrandLogo = (logoPath) => {
    if (!logoPath) {
      return DEFAULT_BRAND_LOGO;
    }
    return logoPath.startsWith('http') ? logoPath : `${API_BASE_URL}${logoPath}`;
  };

  const handleLogoError = (event) => {
    if (event.currentTarget.dataset.fallbackApplied === 'true') {
      return;
    }
    event.currentTarget.dataset.fallbackApplied = 'true';
    event.currentTarget.src = DEFAULT_BRAND_LOGO;
  };

  // Fetch brands data
  const fetchBrands = async (category = 'all', search = '') => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (category && category !== 'all') {
        params.append('category', category);
      }
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`${API_BASE_URL}/influencer/explore?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('The user is not authenticated');
      }

      if (!response.ok) {
        throw new Error('Failed to load brands');
      }

      const data = await response.json();
      if (data.success) {
        setBrands(data.brands || []);
        setCategories(data.categories || []);
        setSelectedCategory(data.selectedCategory || 'all');
        setSearchQuery(data.searchQuery || '');
      }
    } catch (err) {
      console.error('Error fetching brands:', err);
      setError(err.message || 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchBrands();
    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSuggestions = async () => {
    try {
      setSuggestionsLoading(true);
      const response = await fetch(`${API_BASE_URL}/influencer/matchmaking`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setSuggestedBrands(data.recommendations || []);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = async (e) => {
    e?.preventDefault();

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
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.success) {
            window.location.href = '/signin';
            return;
          }
        }
      }

      window.location.href = '/signin';
    } catch (error) {
      console.error('Error during signout:', error);
      window.location.href = '/signin';
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  // Apply filters
  const handleApplyFilters = () => {
    fetchBrands(selectedCategory, searchQuery);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    fetchBrands('all', '');
  };

  // Handle view toggle
  const handleToggleView = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  // Handle open invite modal
  const handleOpenInviteModal = (brandId, brandName) => {
    setSelectedBrand({ id: brandId, name: brandName });
    setInviteFormData({
      campaignTitle: '',
      campaignDescription: '',
      budget: '',
      productName: '',
      channels: []
    });
    setInviteModalOpen(true);
  };

  // Handle close invite modal
  const handleCloseInviteModal = () => {
    setInviteModalOpen(false);
    setSelectedBrand({ id: null, name: '' });
    setInviteFormData({
      campaignTitle: '',
      campaignDescription: '',
      budget: '',
      productName: '',
      channels: []
    });
  };

  // Handle channel checkbox change
  const handleChannelChange = (channel) => {
    setInviteFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  // Handle invite form submission
  const handleSendInvite = async (e) => {
    e.preventDefault();

    // Validate form
    if (!inviteFormData.campaignTitle.trim() ||
      !inviteFormData.campaignDescription.trim() ||
      !inviteFormData.budget ||
      !inviteFormData.productName.trim() ||
      inviteFormData.channels.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/influencer/invite-brand`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          brandId: selectedBrand.id,
          title: inviteFormData.campaignTitle,
          description: inviteFormData.campaignDescription,
          budget: parseFloat(inviteFormData.budget),
          product_name: inviteFormData.productName,
          required_channels: inviteFormData.channels
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Invitation sent successfully to ${selectedBrand.name}!`);
        handleCloseInviteModal();
      } else {
        const errorMessage = data.message || 'Unknown error';
        if (data.showUpgradeLink) {
          if (confirm(errorMessage + '\n\nWould you like to upgrade your plan now?')) {
            navigate('/subscription/manage');
          }
        } else {
          alert('Failed to send invite: ' + errorMessage);
        }
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      alert('An error occurred while sending the invite. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className={styles['explore-page']}>
        <div className="loading-message">Loading brands...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['explore-page']}>
        <div className="error-alert">{error}</div>
      </div>
    );
  }

  return (
    <div className={styles['explore-page']}>
      <InfluencerNavigation onSignOut={handleSignOut} />

      {/* Main Content */}
      <div className="container">
        <ExploreIntro />

        {/* Suggested Brands Section */}
        {suggestedBrands.length > 0 && (
          <div className={styles['suggested-section']}>
            <div className={styles['section-header']}>
              <h2>🤝 Suggested Brands</h2>
              <p>AI-powered matches based on your influencer profile and niche</p>
            </div>
            <div className={styles['suggested-grid']}>
              {suggestedBrands.slice(0, 3).map((match) => (
                <div key={match.brand._id} className={`${styles['suggested-card']} ${match.score >= 80 ? styles['perfect-match'] : ''}`}>
                  <div className={styles['match-card-header']}>
                    <div className={styles['match-avatar']}>
                      <img
                        src={getBrandLogo(match.brand.logoUrl)}
                        alt={match.brand.brandName}
                        onError={handleLogoError}
                      />
                      {match.score >= 90 && <span className={styles['match-badge']}>Top Match</span>}
                    </div>
                    <div className={styles['match-user-info']}>
                      <h3>{match.brand.brandName}</h3>
                      <div className={styles['match-score-container']}>
                        <span className={styles['score-text']}>Match Score: <strong>{match.score}%</strong></span>
                        <div className={styles['match-progress-bar']}>
                          <div
                            className={styles['match-progress-fill']}
                            style={{
                              width: `${match.score}%`,
                              backgroundColor: match.score > 85 ? '#34a853' : '#4285f4'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles['match-reasons']}>
                    {match.matchReasons && match.matchReasons.map((reason, idx) => (
                      <span key={idx} className={styles['reason-tag']}>{reason}</span>
                    ))}
                  </div>
                  <div className={styles['match-actions']}>
                    <button
                      className={styles['match-invite-btn']}
                      onClick={() => handleOpenInviteModal(match.brand._id, match.brand.brandName)}
                    >
                      Invite
                    </button>
                    <button 
                      className={styles['match-profile-btn']}
                      onClick={() => navigate(`/influencer/brand_profile/${match.brand._id}`)}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ExploreFilters
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          categories={categories}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onSearch={handleApplyFilters}
          onClear={handleClearFilters}
        />
        <ResultsInfo
          brandCount={brands.length}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
        />
        <ViewToggle viewMode={viewMode} onToggle={handleToggleView} />
        <BrandList
          brands={brands}
          viewMode={viewMode}
          getBrandLogo={getBrandLogo}
          onLogoError={handleLogoError}
          onInvite={handleOpenInviteModal}
        />
      </div>

      <InviteModal
        isOpen={inviteModalOpen}
        selectedBrand={selectedBrand}
        formData={inviteFormData}
        setFormData={setInviteFormData}
        onClose={handleCloseInviteModal}
        onChannelChange={handleChannelChange}
        onSubmit={handleSendInvite}
      />
    </div>
  );
};

export default Explore;
