import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import styles from '../../styles/brand/explore.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import BrandNavigation from '../../components/brand/BrandNavigation';
import NotificationModal from '../../components/brand/NotificationModal';

const EXTERNAL_ASSETS = {
  styles: [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
  ]
};

export default function Explore() {
  useExternalAssets(EXTERNAL_ASSETS);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState({ id: null, name: null });
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Page data
  const [influencers, setInfluencers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  // Load saved view mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('influencerList:view');
    const fromUrl = searchParams.get('view');
    const initial = fromUrl || saved || 'list';
    setViewMode(initial);
  }, [searchParams]);

  // Fetch influencers data
  const fetchInfluencers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);

      const response = await fetch(`${API_BASE_URL}/brand/explore?${params.toString()}`, {
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
        throw new Error('Failed to load influencers');
      }

      const data = await response.json();
      if (data.success) {
        setInfluencers(data.influencers || []);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching influencers:', err);
      setError(err.message || 'Failed to load influencers');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchInfluencers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSignOut = async (e) => {
    e?.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/brand/signout`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // Handle response - backend may return JSON or redirect
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.success) {
            // Navigate to signin and reload to clear all state
            window.location.href = '/signin';
            return;
          }
        }
      }

      // Fallback: redirect to signin regardless of response
      window.location.href = '/signin';
    } catch (error) {
      console.error('Error during signout:', error);
      // Even on error, redirect to signin page
      window.location.href = '/signin';
    }
  };

  // View toggle handler
  const handleViewToggle = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    localStorage.setItem('influencerList:view', newMode);
  };

  // Filter handlers
  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);

    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSearchParams({});
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  };

  // Invite modal handlers
  const handleOpenInviteModal = async (influencerId, influencerName) => {
    setSelectedInfluencer({ id: influencerId, name: influencerName });
    setInviteModalOpen(true);
    setSelectedCampaignId('');

    // Fetch draft campaigns
    setCampaignsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/brand/campaigns/draft-list`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success && data.campaigns) {
        setCampaigns(data.campaigns);
      } else {
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const handleCloseInviteModal = () => {
    setInviteModalOpen(false);
    setSelectedInfluencer({ id: null, name: null });
    setSelectedCampaignId('');
    setCampaigns([]);
  };

  const handleSendInvite = async () => {
    if (!selectedCampaignId) {
      alert('Please select a campaign first.');
      return;
    }

    if (!selectedInfluencer.id) {
      alert('Influencer not selected.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/brand/invite-influencer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          influencerId: selectedInfluencer.id,
          campaignId: selectedCampaignId
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        alert(`Invitation sent successfully to ${selectedInfluencer.name}!`);
        handleCloseInviteModal();
      } else {
        alert('Failed to send invite: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      alert('An error occurred while sending the invite. Please try again.');
    }
  };

  // Close modal when clicking outside
  const handleModalBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseInviteModal();
    }
  };

  if (loading) {
    return (
      <div className={styles.explorePageWrapper}>
        <div className="loading-message">Loading influencers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.explorePageWrapper}>
        <div className="error-alert">{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.explorePageWrapper}>
      <BrandNavigation
        onSignOut={handleSignOut}
        showNotification={true}
        onNotificationClick={() => setNotificationModalOpen(true)}
      />

      <NotificationModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
      />

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="invite-modal" onClick={handleModalBackdropClick}>
          <div className="invite-modal-content">
            <span className="invite-modal-close" onClick={handleCloseInviteModal}>&times;</span>
            <h2 className="invite-modal-title">Invite Influencer</h2>
            <p className="invite-influencer-name">Inviting: {selectedInfluencer.name}</p>

            <div className="invite-form-group">
              <label htmlFor="campaignSelect" className="invite-label">Select Campaign:</label>
              <select
                id="campaignSelect"
                className="invite-select"
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                disabled={campaignsLoading}
              >
                {campaignsLoading ? (
                  <option value="">Loading campaigns...</option>
                ) : campaigns.length > 0 ? (
                  <>
                    <option value="">-- Select a Campaign --</option>
                    {campaigns.map(campaign => (
                      <option key={campaign._id} value={campaign._id}>
                        {campaign.title} (Budget: ${campaign.budget ? campaign.budget.toLocaleString() : '0'})
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="">No draft campaigns available. Create one first.</option>
                )}
              </select>
            </div>

            <div className="invite-modal-actions">
              <button onClick={handleSendInvite} className="invite-btn-send" disabled={!selectedCampaignId}>
                <i className="fas fa-paper-plane"></i> Send Invite
              </button>
              <button onClick={handleCloseInviteModal} className="invite-btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container">
        <div className="intro">
          <h1>Explore Influencers</h1>
          <p>Connect with top influencers to elevate your brand's presence.</p>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search influencers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              <button type="button" onClick={handleApplyFilters} className="search-btn">
                <i className="fas fa-search"></i>
              </button>
            </div>
            <div className="category-filter">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-actions">
              <button type="button" onClick={handleClearFilters} className="clear-btn">
                <i className="fas fa-times"></i> Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="results-info">
          <p>Found {influencers.length} influencers
            {selectedCategory && selectedCategory !== 'all' && (
              <> in <strong>{selectedCategory}</strong></>
            )}
            {searchQuery && (
              <> matching "<strong>{searchQuery}</strong>"</>
            )}
          </p>
        </div>

        {/* Toggle Button */}
        <div className="toggle-container">
          <button
            type="button"
            className="toggle-button"
            aria-pressed={viewMode === 'grid'}
            aria-controls="influencerList"
            aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            onClick={handleViewToggle}
          >
            {viewMode === 'grid' ? 'List view' : 'Grid view'}
          </button>
          <span className="visually-hidden" aria-live="polite">
            {viewMode === 'grid' ? 'Grid view' : 'List view'}
          </span>
        </div>

        {/* Influencer List */}
        <div className={`influencer-list ${viewMode}`} id="influencerList">
          {influencers && influencers.length > 0 ? (
            influencers.map((influencer) => (
              <div key={influencer._id} className="influencer-item">
                <div className="influencer-content">
                  <img
                    className="influencer-image"
                    loading="lazy"
                    src={influencer.profilePicUrl || '/images/default-profile.jpg'}
                    alt={influencer.displayName}
                  />
                  <div className="influencer-info">
                    <div className="influencer-name">
                      <h2>{influencer.displayName}</h2>
                      {influencer.verified && (
                        <span className="verified-badge">✓</span>
                      )}
                    </div>
                    <div className="influencer-details">
                      <p><strong>Categories:</strong> {influencer.categories.join(', ') || 'Not specified'}</p>
                      <p><strong>Followers:</strong> {influencer.totalFollowers ? influencer.totalFollowers.toLocaleString() : '0'}</p>
                      <p><strong>Engagement Rate:</strong> {influencer.avgEngagementRate ? influencer.avgEngagementRate.toFixed(2) : '0.00'}%</p>
                      {influencer.audienceDemographics && (
                        <p><strong>Audience:</strong> {influencer.audienceDemographics.gender}, {influencer.audienceDemographics.ageRange}</p>
                      )}
                      {influencer.previousCollaborations && influencer.previousCollaborations.length > 0 && (
                        <p><strong>Previously Collaborated:</strong> {influencer.previousCollaborations.map(pc => `${pc.campaignTitle} ($${pc.revenue})`).join(', ')}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="button-group">
                  <button
                    className="invite-button"
                    onClick={() => handleOpenInviteModal(influencer._id, influencer.displayName)}
                  >
                    Invite
                  </button>
                  <Link to={`/brand/influencer_profile/${influencer._id}`} className="profile-button">
                    View Profile
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="no-influencers-message" style={{ textAlign: 'center', padding: '20px' }}>
              <h2>No influencers found</h2>
              <p>There are currently no influencers available for collaboration.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}