import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../../styles/brand/received_requests.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import BrandNavigation from '../../components/brand/BrandNavigation';

const EXTERNAL_ASSETS = {
  styles: [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css'
  ],
  scripts: [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js'
  ]
};

const ReceivedRequests = () => {
  useExternalAssets(EXTERNAL_ASSETS);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch received requests
  const fetchReceivedRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/brand/recievedRequests`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/SignIn');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load received requests');
      }

      const data = await response.json();
      if (data.success && data.requests) {
        setRequests(data.requests);
        setFilteredRequests(data.requests);
      } else if (data.requests) {
        // Handle case where requests array is directly in response
        setRequests(data.requests);
        setFilteredRequests(data.requests);
      }
    } catch (err) {
      console.error('Error fetching received requests:', err);
      setError(err.message || 'Failed to load received requests');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchReceivedRequests();
  }, []);

  // Filter requests based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRequests(requests);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = requests.filter(request => {
      const title = request.collab?.title?.toLowerCase() || '';
      return title.includes(query);
    });
    setFilteredRequests(filtered);
  }, [searchQuery, requests]);

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

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

  // Handle search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle decline request
  const handleDeclineRequest = async (requestId1, requestId2) => {
    if (!window.confirm('Are you sure you want to decline this request?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/brand/requests/${requestId1}/${requestId2}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/SignIn');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(data.message || 'Request declined successfully');
        // Remove the declined request from the list
        setRequests(prev => prev.filter(req => req._cid !== requestId1 || req._iid !== requestId2));
      } else {
        throw new Error(data.message || 'Failed to decline request');
      }
    } catch (error) {
      console.error('Error declining request:', error);
      alert(error.message || 'An error occurred while declining the request');
    }
  };

  // Get channel icon class
  const getChannelIcon = (channel) => {
    const channelLower = channel.toLowerCase();
    const iconMap = {
      instagram: 'fa-instagram',
      youtube: 'fa-youtube',
      tiktok: 'fa-tiktok',
      facebook: 'fa-facebook',
      twitter: 'fa-twitter',
      linkedin: 'fa-linkedin'
    };
    return iconMap[channelLower] || 'fa-share-alt';
  };

  if (loading) {
    return (
      <div className={styles.receivedRequestsPageWrapper}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.receivedRequestsPageWrapper}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: 'red' }}>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.receivedRequestsPageWrapper}>
      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {/* Header */}
      <BrandNavigation onSignOut={handleSignOut} showNotification={false} />

      {/* Main Content */}
      <div className="container">
        <input
          type="text"
          className="search-bar"
          placeholder="Search for collabs..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <div className="collab-list">
          {filteredRequests && filteredRequests.length > 0 ? (
            filteredRequests.map((request, index) => (
              <div key={`${request._cid}-${request._iid}-${index}`} className="collab-box" data-title={request.collab?.title?.toLowerCase() || ''}>
                <div className="collab-header">
                  <h2 className="collab-title">{request.collab?.title || 'Untitled Campaign'}</h2>
                  <span className="tag-badge">{request.tag || 'Request'}</span>
                  <p className="collab-description">{request.collab?.description || 'No description provided.'}</p>
                </div>
                <div className="bottom-row">
                  {/* Left Column: Influencer Details */}
                  <div className="left-col">
                    <div className="blue-box">
                      <h3><i className="fas fa-user-circle"></i> Influencer Details</h3>
                      <div className="influencer-profile">
                        <img
                          src={request.influencer?.profile_pic ? (request.influencer.profile_pic.startsWith('http') ? request.influencer.profile_pic : `${API_BASE_URL}${request.influencer.profile_pic}`) : '/images/default-avatar.jpg'}
                          alt={request.influencer?.name || 'Influencer'}
                          className="influencer-avatar"
                          onError={(e) => {
                            e.target.src = '/images/default-avatar.jpg';
                          }}
                        />
                        <div className="influencer-info">
                          <h4>{request.influencer?.name || 'Unknown'}</h4>
                          <p className="influencer-username">@{request.influencer?.username || 'unknown'}</p>
                        </div>
                      </div>
                      <div className="influencer-stats">
                        <div className="stat-item">
                          <i className="fas fa-users"></i>
                          <span className="attr">Total Followers:</span>
                          <span className="value">{(request.influencer?.followers || 0).toLocaleString()}</span>
                        </div>
                        <div className="stat-item">
                          <i className="fas fa-chart-line"></i>
                          <span className="attr">Engagement Rate:</span>
                          <span className="value">{request.influencer?.engagement_rate ? `${request.influencer.engagement_rate.toFixed(1)}%` : '0%'}</span>
                        </div>
                        <div className="stat-item">
                          <i className="fas fa-map-marker-alt"></i>
                          <span className="attr">Location:</span>
                          <span className="value">{request.influencer?.location || 'Not specified'}</span>
                        </div>
                        <div className="stat-item">
                          <i className="fas fa-tags"></i>
                          <span className="attr">Categories:</span>
                          <span className="value">
                            {request.influencer?.categories && request.influencer.categories.length > 0
                              ? request.influencer.categories.join(', ')
                              : 'Not specified'}
                          </span>
                        </div>
                      </div>
                      <div className="social-channels">
                        <h4><i className="fas fa-share-alt"></i> Social Channels</h4>
                        <div className="channels-grid">
                          {request.influencer?.channels && request.influencer.channels.length > 0 ? (
                            request.influencer.channels.map((channel, idx) => (
                              <div key={idx} className="channel-item">
                                <i className={`fab ${getChannelIcon(channel)}`}></i>
                                <span>{channel}</span>
                              </div>
                            ))
                          ) : (
                            <p className="no-channels">No channels specified</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Collab Requirements */}
                  <div className="red-col">
                    <div className="collab-requirements">
                      <h3><i className="fas fa-clipboard-list"></i> Campaign Requirements</h3>
                      <div className="requirements-grid">
                        <div className="requirement-item">
                          <i className="fas fa-calendar-alt"></i>
                          <span className="attr">Duration:</span>
                          <span className="value">{request.collab?.duration || 0} days</span>
                        </div>
                        <div className="requirement-item">
                          <i className="fas fa-dollar-sign"></i>
                          <span className="attr">Budget:</span>
                          <span className="value">${(request.collab?.budget || 0).toLocaleString()}</span>
                        </div>
                        <div className="requirement-item">
                          <i className="fas fa-users"></i>
                          <span className="attr">Min Followers:</span>
                          <span className="value">{(request.collab?.min_followers || 0).toLocaleString()}</span>
                        </div>
                        <div className="requirement-item">
                          <i className="fas fa-bullseye"></i>
                          <span className="attr">Target Audience:</span>
                          <span className="value">{request.collab?.target_audience || 'Not specified'}</span>
                        </div>
                      </div>
                      <div className="channels-section">
                        <h4><i className="fas fa-share-alt"></i> Required Channels</h4>
                        <div className="channels-list">
                          {request.collab?.required_channels && request.collab.required_channels.length > 0 ? (
                            request.collab.required_channels.map((channel, idx) => (
                              <span key={idx} className="channel-badge">{channel}</span>
                            ))
                          ) : (
                            <p className="no-channels">No channels required</p>
                          )}
                          {request.message && (
                            <div className="influencer-message-bar">
                              <strong>Message from influencer:</strong>
                              <div className="message-text">{request.message}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Campaign Products Section */}
                      {request.collab?.products && request.collab.products.length > 0 && (
                        <div className="products-section">
                          <h4><i className="fas fa-shopping-bag"></i> Campaign Products</h4>
                          <div className="products-grid">
                            {request.collab.products.map((product, idx) => (
                              <div key={idx} className="product-item">
                                <div className="product-image">
                                  {product.image_url ? (
                                    <img
                                      src={product.image_url.startsWith('http') ? product.image_url : `${API_BASE_URL}${product.image_url}`}
                                      alt={product.name || 'Product'}
                                      className="product-img"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                  ) : (
                                    <div className="product-placeholder">
                                      <i className="fas fa-image"></i>
                                    </div>
                                  )}
                                </div>
                                <div className="product-details">
                                  <h5 className="product-name">{product.name || 'Product'}</h5>
                                  <div className="product-pricing">
                                    <span className="campaign-price">${(product.campaign_price || 0).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="action-buttons">
                        <Link to={`/brand/${request._cid}/${request._iid}/transaction`} className="accept-btn">
                          <i className="fas fa-check"></i> Accept and Proceed
                        </Link>
                        <button
                          className="decline-btn"
                          onClick={() => handleDeclineRequest(request._cid, request._iid)}
                        >
                          <i className="fas fa-times"></i> Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-requests-message">
              <div className="no-requests-icon">
                <i className="fas fa-inbox"></i>
              </div>
              <h3>No Requests Yet</h3>
              <p>You haven't received any collaboration requests at the moment.</p>
              <p>Create campaigns and invite influencers to start receiving requests!</p>
              <Link to="/brand/create_campaign" className="create-campaign-btn">
                <i className="fas fa-plus"></i> Create New Campaign
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceivedRequests;
