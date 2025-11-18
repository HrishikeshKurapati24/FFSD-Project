import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../../styles/influencer_dashboard.module.css';
import { API_BASE_URL } from '../../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Dashboard data state
  const [influencer, setInfluencer] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeCollaborations, setActiveCollaborations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [brandInvites, setBrandInvites] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [recentCampaignHistory, setRecentCampaignHistory] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionLimits, setSubscriptionLimits] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');

  // Modal states
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [currentCampaignId, setCurrentCampaignId] = useState(null);
  const [currentCollabId, setCurrentCollabId] = useState(null);
  const [campaignProducts, setCampaignProducts] = useState([]);

  // Progress form state
  const [progressForm, setProgressForm] = useState({
    progress: 0,
    reach: 0,
    clicks: 0,
    performance_score: 0,
    conversions: 0,
    engagement_rate: 0,
    impressions: 0,
    revenue: 0,
    roi: 0
  });

  // Content creation form state
  const [contentForm, setContentForm] = useState({
    campaignId: '',
    media_files: null,
    description: '',
    content_type: '',
    platforms: [],
    campaign_product: '',
    special_instructions: '',
    publish_date: ''
  });

  // Verify authentication
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.status === 401) {
          navigate('/signin');
          return;
        }

        const data = await response.json();
        if (data.authenticated) {
          setAuthenticated(true);
          fetchDashboardData();
        } else {
          navigate('/signin');
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        navigate('/signin');
      }
    };

    verifyAuth();
  }, [navigate]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/influencer/home`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.status === 401) {
        navigate('/signin');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      if (data.success) {
        setInfluencer(data.influencer);
        setStats(data.stats);
        setActiveCollaborations(data.activeCollaborations || []);
        setPendingRequests(data.pendingRequests || []);
        setBrandInvites(data.brandInvites || []);
        setSentRequests(data.sentRequests || []);
        setRecentCampaignHistory(data.recentCampaignHistory || []);
        setSubscriptionStatus(data.subscriptionStatus);
        setSubscriptionLimits(data.subscriptionLimits);
        setBaseUrl(data.baseUrl || window.location.origin);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check for approved content on mount
  useEffect(() => {
    if (!authenticated) return;

    const checkApprovedContent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/influencer/content/approved`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.content && data.content.length > 0) {
            for (const content of data.content) {
              const campaignTitle = content.campaignTitle || 'Campaign';
              const brandName = content.brandName || 'the brand';
              const message = `Your content for "${campaignTitle}" has been approved by ${brandName}! You can now post it on social media.`;
              alert(message);
              await updateContentStatus(content._id);
            }
          }
        }
      } catch (error) {
        console.error('Error checking approved content:', error);
      }
    };

    checkApprovedContent();
  }, [authenticated]);

  const updateContentStatus = async (contentId) => {
    try {
      await fetch(`${API_BASE_URL}/influencer/content/${contentId}/publish`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ status: 'published' })
      });
    } catch (error) {
      console.error('Error updating content status:', error);
    }
  };

  // Menu toggle functions
  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);

  // Content creation modal functions
  const openContentCreationModal = async (campaignId, campaignTitle) => {
    setCurrentCampaignId(campaignId);
    setContentForm(prev => ({ ...prev, campaignId }));
    setContentModalOpen(true);
    await loadCampaignProducts(campaignId);
  };

  const closeContentCreationModal = () => {
    setContentModalOpen(false);
    setContentForm({
      campaignId: '',
      media_files: null,
      description: '',
      content_type: '',
      platforms: [],
      campaign_product: '',
      special_instructions: '',
      publish_date: ''
    });
  };

  const loadCampaignProducts = async (campaignId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/influencer/campaigns/${campaignId}/products`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products) {
          setCampaignProducts(data.products);
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  // Handle content form submission
  const handleContentSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('campaignId', contentForm.campaignId);
    formData.append('description', contentForm.description);
    formData.append('content_type', contentForm.content_type);
    formData.append('campaign_product', contentForm.campaign_product);
    formData.append('special_instructions', contentForm.special_instructions || '');
    formData.append('publish_date', contentForm.publish_date || '');
    formData.append('action', 'submit_for_review');

    if (contentForm.media_files) {
      Array.from(contentForm.media_files).forEach(file => {
        formData.append('media_files', file);
      });
    }

    contentForm.platforms.forEach(platform => {
      formData.append('platforms', platform);
    });

    // Validation
    if (!contentForm.campaignId || !contentForm.content_type || !contentForm.description || !contentForm.campaign_product) {
      alert('Please fill in all required fields');
      return;
    }

    if (!contentForm.media_files || contentForm.media_files.length === 0) {
      alert('Please select media files');
      return;
    }

    if (contentForm.platforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/influencer/content/create`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        alert('Content submitted for review successfully!');
        closeContentCreationModal();
        fetchDashboardData();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while submitting content: ' + error.message);
    }
  };

  // Update progress modal functions
  const updateCollabProgress = async (collabId) => {
    setCurrentCollabId(collabId);

    // Find current progress from active collaborations
    const collab = activeCollaborations.find(c => c.id === collabId);
    const currentProgress = collab?.progress || 0;

    setProgressForm(prev => ({ ...prev, progress: currentProgress }));

    // Fetch current metrics
    try {
      const response = await fetch(`${API_BASE_URL}/influencer/collab/${collabId}/details`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.collab) {
          setProgressForm({
            progress: data.collab.progress || currentProgress,
            reach: data.collab.reach || 0,
            clicks: data.collab.clicks || 0,
            performance_score: data.collab.performance_score || 0,
            conversions: data.collab.conversions || 0,
            engagement_rate: data.collab.engagement_rate || 0,
            impressions: data.collab.impressions || 0,
            revenue: data.collab.revenue || 0,
            roi: data.collab.roi || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching collab details:', error);
    }

    setProgressModalOpen(true);
  };

  const closeUpdateProgressModal = () => {
    setProgressModalOpen(false);
    setCurrentCollabId(null);
  };

  const handleProgressSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (progressForm.performance_score < 0 || progressForm.performance_score > 100) {
      alert('Performance Score must be between 0 and 100.');
      return;
    }

    if (progressForm.engagement_rate < 0 || progressForm.engagement_rate > 100) {
      alert('Engagement Rate must be between 0 and 100.');
      return;
    }

    if (progressForm.roi < 0) {
      alert('ROI must be 0 or greater.');
      return;
    }

    if (!currentCollabId) {
      alert('No collaboration selected');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/influencer/collab/${currentCollabId}/update-progress`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(progressForm)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        alert('Failed to update progress: ' + errorData.message);
        return;
      }

      const data = await response.json();
      if (data.success) {
        alert('Progress and metrics updated successfully!');
        closeUpdateProgressModal();
        fetchDashboardData();
      } else {
        alert('Failed to update progress: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('An error occurred while updating progress');
    }
  };

  // Brand invite functions
  const acceptBrandInvite = async (inviteId, campaignTitle) => {
    if (!confirm(`Accept invitation for "${campaignTitle}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/influencer/brand-invites/${inviteId}/accept`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('Invitation accepted successfully!');
        fetchDashboardData();
      } else {
        alert('Failed to accept invitation: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      alert('An error occurred while accepting the invitation. Please try again.');
    }
  };

  const declineBrandInvite = async (inviteId, campaignTitle) => {
    if (!confirm(`Decline invitation for "${campaignTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/influencer/brand-invites/${inviteId}/decline`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('Invitation declined.');
        fetchDashboardData();
      } else {
        alert('Failed to decline invitation: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error declining invite:', error);
      alert('An error occurred while declining the invitation. Please try again.');
    }
  };

  // Cancel sent request
  const cancelSentRequest = async (requestId, campaignTitle) => {
    if (!confirm(`Cancel your request for "${campaignTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/influencer/sent-requests/${requestId}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('Request cancelled successfully.');
        fetchDashboardData();
      } else {
        alert('Failed to cancel request: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert('An error occurred while cancelling the request. Please try again.');
    }
  };

  // Copy shop URL
  const copyShopUrl = async (campaignId) => {
    const url = `${baseUrl}/customer/campaign/${campaignId}/shop`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Shop URL copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy URL:', error);
      alert('Failed to copy URL');
    }
  };

  if (loading) {
    return (
      <div className={styles['dashboard-page']}>
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading dashboard...</div>
      </div>
    );
  }

  if (!influencer || !stats) {
    return (
      <div className={styles['dashboard-page']}>
        <div style={{ padding: '20px', textAlign: 'center' }}>No data available</div>
      </div>
    );
  }

  return (
    <div className={styles['dashboard-page']}>
      {/* Header */}
      <header>
        <div className={styles['header-container']}>
          <div className={styles['logo']}>CollabSync</div>
          <nav>
            <ul>
              <li><Link to="/influencer/home">Home</Link></li>
              <li><Link to="/influencer/explore">Explore Brands</Link></li>
              <li><Link to="/influencer/profile">My Profile</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <button className={styles['toggle-btn']} onClick={openMenu}>☰</button>
      <div className={styles['menu']} style={{ width: menuOpen ? '250px' : '0' }}>
        <span className={styles['close-btn']} onClick={closeMenu}>&times;</span>
        <Link to="/influencer/campaigns" onClick={closeMenu}>Collabs</Link>
        <Link to="/influencer/signout" onClick={closeMenu}>Sign Out</Link>
      </div>

      {/* Main Content */}
      <div className={styles['container']}>
        {/* Intro Section */}
        <div className={styles['intro']}>
          <h1>Welcome, {influencer.name}</h1>
          <p>Discover how CollabSync empowers influencers with seamless brand collaborations.</p>

          <div className={styles['performance-metrics']}>
            <div className={styles['metric-item']}>
              <div className={styles['metric-value']}>
                {influencer.avgEngagementRate}%
              </div>
              <div className={styles['metric-label']}>Avg Engagement Rate</div>
            </div>
            <div className={styles['metric-item']}>
              <div className={styles['metric-value']}>
                {influencer.totalAudience?.toLocaleString()}
              </div>
              <div className={styles['metric-label']}>Total Audience</div>
            </div>
            <div className={styles['metric-item']}>
              <div className={styles['metric-value']}>
                ${influencer.monthlyEarnings?.toLocaleString()}
              </div>
              <div className={styles['metric-label']}>Monthly Earnings</div>
            </div>

            {/* Subscription Plan Card */}
            {subscriptionStatus && subscriptionStatus.subscription && (
              <div className={styles['metric-item']}>
                <div className={styles['metric-value']}>
                  {subscriptionStatus.subscription.planId?.name || 'Free'}
                </div>
                <div className={styles['metric-label']}>Current Plan</div>
                <div style={{ marginTop: '5px' }}>
                  <Link to="/subscription/manage" style={{ color: '#4285f4', fontSize: '0.85em', textDecoration: 'none' }}>
                    <i className="fas fa-crown"></i> Manage Plan
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Renewal Alert */}
        {subscriptionStatus && (subscriptionStatus.expired || subscriptionStatus.needsRenewal) && (
          <div className={`${styles['alert']} ${subscriptionStatus.expired ? styles['alert-danger'] : styles['alert-warning']} ${styles['alert-dismissible']} ${styles['fade']} ${styles['show']}`}
            role="alert"
            style={{ margin: '20px 0', borderLeft: `4px solid ${subscriptionStatus.expired ? '#ea4335' : '#ffc107'}` }}>
            <h4 className={styles['alert-heading']}>
              <i className={`fas ${subscriptionStatus.expired ? 'fa-exclamation-triangle' : 'fa-clock'}`}></i>
              {subscriptionStatus.expired ? 'Subscription Expired' : 'Subscription Renewal Required'}
            </h4>
            <p>{subscriptionStatus.message}</p>
            {subscriptionStatus.expired && (
              <>
                <p><strong>You are now on the Free plan with limited features:</strong></p>
                <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                  <li>Maximum 2 brand collaborations</li>
                  <li>Basic analytics only</li>
                </ul>
              </>
            )}
            <hr />
            <Link to="/subscription/manage" className={styles['btn']} style={{ backgroundColor: '#007BFF', color: '#fff', padding: '8px 16px', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }}>
              <i className="fas fa-credit-card"></i>
              {subscriptionStatus.expired ? 'Upgrade Now' : 'Renew Subscription'}
            </Link>
          </div>
        )}

        {/* Dashboard Overview */}
        <section className={styles['dashboard']}>
          <h2>Dashboard Overview</h2>
          <div className={styles['dashboard-items']}>
            <div className={styles['dashboard-item']}>
              <h3>Active Collaborations</h3>
              <p className={styles['active-collabs-count']}>
                {stats.activeCollaborations}
              </p>
              <div className={styles['progress-bar']}>
                <div className={styles['progress']} style={{ '--progress': `${stats.completionPercentage}%` }}></div>
              </div>
              <small>
                {stats.nearingCompletion} nearing completion
              </small>
            </div>
            <div className={styles['dashboard-item']}>
              <h3>Performance Score</h3>
              <p className={styles['performance-score']}>
                {stats.performanceScore ? stats.performanceScore.toFixed(1) : '0.0'}
              </p>
              <div className={styles['rating-stars']}>
                {[...Array(5)].map((_, i) => (
                  <i key={i} className={`fas fa-star ${i < Math.floor(stats.avgRating || 0) ? styles['active'] : ''}`}></i>
                ))}
              </div>
              <small>Average Rating: {stats.avgRating ? stats.avgRating.toFixed(1) : '0.0'}</small>
            </div>
            <div className={styles['dashboard-item']}>
              <h3>Earnings Overview</h3>
              <p className={styles['earnings-amount']}>
                ${stats.monthlyEarnings?.toLocaleString()}
              </p>
              <small className={stats.earningsChange >= 0 ? styles['positive'] : styles['negative']}>
                {stats.earningsChange >= 0 ? '+' : ''}{stats.earningsChange}% from last month
              </small>
              <div className={styles['total-earnings']}>
                <span>Total Earnings:</span>
                <span>${stats.totalEarnings?.toLocaleString()}</span>
              </div>
            </div>
            <div className={styles['dashboard-item']}>
              <h3>Audience & Engagement</h3>
              <p className={styles['audience-count']}>
                {stats.totalFollowers?.toLocaleString()}
              </p>
              <small>Total Followers</small>
              <div className={styles['engagement-rate']}>
                <span>Avg. Engagement:</span>
                <span>{stats.avgEngagementRate}%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Active Collaborations Section */}
        <section className={styles['active-collaborations']}>
          <h2>Active Collaborations</h2>
          <div className={styles['collaborations-grid']}>
            {activeCollaborations && activeCollaborations.length > 0 ? (
              activeCollaborations.map(collab => (
                <div key={collab.id} className={styles['collab-card']} data-collab-id={collab.id}>
                  <div className={styles['collab-header']}>
                    <img src={collab.brand_logo} alt={collab.brand_name} className={styles['brand-logo']} />
                    <div className={styles['collab-title']}>
                      <h3>{collab.campaign_name}</h3>
                      <p className={styles['brand-name']}>{collab.brand_name}</p>
                    </div>
                  </div>

                  <div className={styles['collab-progress']}>
                    <div className={styles['progress-info']}>
                      <span>Progress</span>
                      <span>{collab.progress}%</span>
                    </div>
                    <div className={styles['progress-bar']}>
                      <div className={styles['progress']} style={{ '--progress': `${collab.progress}%` }}></div>
                    </div>
                  </div>

                  <div className={styles['collab-metrics']}>
                    <div className={styles['metric']}>
                      <span className={styles['label']}>Duration</span>
                      <span className={styles['value']}>{collab.duration} days</span>
                    </div>
                    <div className={styles['metric']}>
                      <span className={styles['label']}>Budget</span>
                      <span className={styles['value']}>${collab.budget?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className={styles['collab-analytics']}>
                    <h4>Performance Analytics</h4>
                    <div className={styles['analytics-grid']}>
                      <div className={styles['analytics-item']}>
                        <span className={styles['label']}>Reach</span>
                        <span className={styles['value']}>{collab.reach?.toLocaleString()}</span>
                      </div>
                      <div className={styles['analytics-item']}>
                        <span className={styles['label']}>Clicks</span>
                        <span className={styles['value']}>{collab.clicks?.toLocaleString()}</span>
                      </div>
                      <div className={styles['analytics-item']}>
                        <span className={styles['label']}>Conversions</span>
                        <span className={styles['value']}>{collab.conversions?.toLocaleString()}</span>
                      </div>
                      <div className={styles['analytics-item']}>
                        <span className={styles['label']}>Performance Score</span>
                        <span className={styles['value']}>{collab.performance_score}</span>
                      </div>
                      <div className={styles['analytics-item']}>
                        <span className={styles['label']}>Engagement</span>
                        <span className={styles['value']}>{collab.engagement_rate}</span>
                      </div>
                      <div className={styles['analytics-item']}>
                        <span className={styles['label']}>Impressions</span>
                        <span className={styles['value']}>{collab.impressions?.toLocaleString()}</span>
                      </div>
                      <div className={styles['analytics-item']}>
                        <span className={styles['label']}>Revenue</span>
                        <span className={styles['value']}>{collab.revenue}</span>
                      </div>
                      <div className={styles['analytics-item']}>
                        <span className={styles['label']}>ROI</span>
                        <span className={styles['value']}>{collab.roi}</span>
                      </div>
                      <div className={styles['analytics-item']}>
                        <span className={styles['label']}>Conversion Rate</span>
                        <span className={styles['value']}>{collab.engagement_rate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Shop URL Section */}
                  <div className={styles['shop-url-section']}>
                    <div className={styles['shop-url-header']}>
                      <i className="fas fa-shopping-cart"></i>
                      <span className={styles['shop-url-label']}>Customer Shop Link</span>
                    </div>
                    <div className={styles['shop-url-container']}>
                      <input
                        type="text"
                        className={styles['shop-url-input']}
                        id={`shopUrl_${collab.campaign_id}`}
                        value={`${baseUrl}/customer/campaign/${collab.campaign_id}/shop`}
                        readOnly
                      />
                      <button
                        className={`${styles['btn']} ${styles['btn-copy']}`}
                        onClick={() => copyShopUrl(collab.campaign_id)}
                        title="Copy to clipboard"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                    <div className={styles['shop-url-note']}>
                      <i className="fas fa-info-circle"></i>
                      <span>Include this link in every post for this campaign</span>
                    </div>
                  </div>

                  <div className={styles['collab-actions']}>
                    <button
                      className={styles['update-progress-btn']}
                      onClick={() => updateCollabProgress(collab.id)}
                    >
                      <i className="fas fa-chart-line"></i>
                      Update Progress
                    </button>
                  </div>

                  <div className={styles['post-content-label']}
                    style={{ fontWeight: 'bold', color: '#2d6cdf', fontSize: '1.08rem', marginTop: '18px', marginBottom: '7px', display: 'flex', alignItems: 'center' }}>
                    <i className="fas fa-edit" style={{ marginTop: '8px', color: '#4683ea', fontSize: '1.1em' }}></i>
                    Post content for this campaign
                  </div>
                  <div className={styles['collab-actions']}>
                    <button
                      className={styles['update-progress-btn']}
                      onClick={() => openContentCreationModal(collab.campaign_id, collab.campaign_name)}
                    >
                      <i className="fas fa-chart-line"></i> Create Content
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles['no-collaborations']}>
                <p>No active collaborations at the moment</p>
                <Link to="/influencer/explore" className={styles['explore-btn']}>Explore Opportunities</Link>
              </div>
            )}
          </div>
        </section>

        {/* Brand Invites Section */}
        <section className={styles['brand-invites']}>
          <h2>Brand Invitations</h2>
          <div className={styles['invites-grid']}>
            {brandInvites && brandInvites.length > 0 ? (
              brandInvites.map(invite => (
                <div key={invite._id} className={styles['invite-card']}>
                  <span className={styles['invite-badge']}>New Invite</span>
                  <div className={styles['invite-header']}>
                    <img
                      src={invite.brand_logo || '/images/default-brand.png'}
                      alt={invite.brand_name}
                      className={styles['brand-logo']}
                    />
                    <div className={styles['invite-info']}>
                      <h3>{invite.campaign_title}</h3>
                      <p className={styles['brand-name']}>{invite.brand_name}</p>
                      {invite.brand_location && (
                        <p className={styles['brand-location']}>
                          <i className="fas fa-map-marker-alt"></i>
                          {invite.brand_location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={styles['invite-description']}>
                    <p>{invite.campaign_description || 'No description provided'}</p>
                  </div>
                  <div className={styles['invite-details']}>
                    <div className={styles['detail-row']}>
                      <div className={styles['detail-item']}>
                        <i className="fas fa-dollar-sign"></i>
                        <span className={styles['label']}>Budget:</span>
                        <span className={styles['value']}>${(invite.campaign_budget || 0).toLocaleString()}</span>
                      </div>
                      <div className={styles['detail-item']}>
                        <i className="fas fa-calendar-alt"></i>
                        <span className={styles['label']}>Duration:</span>
                        <span className={styles['value']}>{invite.campaign_duration} days</span>
                      </div>
                    </div>
                    {invite.campaign_id?.required_channels && invite.campaign_id.required_channels.length > 0 && (
                      <div className={styles['detail-row']}>
                        <div className={`${styles['detail-item']} ${styles['full-width']}`}>
                          <i className="fas fa-share-alt"></i>
                          <span className={styles['label']}>Required Channels:</span>
                          <div className={styles['channel-badges']}>
                            {invite.campaign_id.required_channels.map((channel, idx) => (
                              <span key={idx} className={styles['channel-badge']}>{channel}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {invite.campaign_start_date && invite.campaign_end_date && (
                      <div className={styles['detail-row']}>
                        <div className={styles['detail-item']}>
                          <i className="fas fa-calendar-check"></i>
                          <span className={styles['label']}>Start:</span>
                          <span className={styles['value']}>
                            {new Date(invite.campaign_start_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={styles['detail-item']}>
                          <i className="fas fa-calendar-times"></i>
                          <span className={styles['label']}>End:</span>
                          <span className={styles['value']}>
                            {new Date(invite.campaign_end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={styles['invite-actions']}>
                    <button
                      className={styles['btn-accept']}
                      onClick={() => acceptBrandInvite(invite._id, invite.campaign_title)}
                    >
                      <i className="fas fa-check"></i> Accept Invitation
                    </button>
                    <button
                      className={styles['btn-decline']}
                      onClick={() => declineBrandInvite(invite._id, invite.campaign_title)}
                    >
                      <i className="fas fa-times"></i> Decline
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles['no-invites']}>
                <i className="fas fa-envelope-open"></i>
                <h3>No Brand Invitations</h3>
                <p>You don't have any brand invitations at the moment.</p>
              </div>
            )}
          </div>
        </section>

        {/* Sent Requests Section */}
        <section className={styles['sent-requests']}>
          <h2>Sent Requests</h2>
          <div className={styles['sent-requests-grid']}>
            {sentRequests && sentRequests.length > 0 ? (
              sentRequests.map(request => (
                <div key={request._id} className={styles['sent-request-card']}>
                  <span className={styles['sent-badge']}>Awaiting Response</span>
                  <div className={styles['sent-request-header']}>
                    <img
                      src={request.brand_logo || '/images/default-brand.png'}
                      alt={request.brand_name}
                      className={styles['brand-logo']}
                    />
                    <div className={styles['sent-request-info']}>
                      <h3>{request.campaign_title}</h3>
                      <p className={styles['brand-name']}>{request.brand_name}</p>
                      {request.brand_location && (
                        <p className={styles['brand-location']}>
                          <i className="fas fa-map-marker-alt"></i>
                          {request.brand_location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={styles['sent-request-description']}>
                    <p>{request.campaign_description || 'No description provided'}</p>
                  </div>
                  <div className={styles['sent-request-details']}>
                    <div className={styles['detail-row']}>
                      <div className={styles['detail-item']}>
                        <i className="fas fa-dollar-sign"></i>
                        <span className={styles['label']}>Budget:</span>
                        <span className={styles['value']}>${(request.campaign_budget || 0).toLocaleString()}</span>
                      </div>
                      <div className={styles['detail-item']}>
                        <i className="fas fa-calendar-alt"></i>
                        <span className={styles['label']}>Duration:</span>
                        <span className={styles['value']}>{request.campaign_duration} days</span>
                      </div>
                    </div>
                    {request.required_channels && request.required_channels.length > 0 && (
                      <div className={styles['detail-row']}>
                        <div className={`${styles['detail-item']} ${styles['full-width']}`}>
                          <i className="fas fa-share-alt"></i>
                          <span className={styles['label']}>Required Channels:</span>
                          <div className={styles['channel-badges']}>
                            {request.required_channels.map((channel, idx) => (
                              <span key={idx} className={styles['channel-badge']}>{channel}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {request.campaign_start_date && request.campaign_end_date && (
                      <div className={styles['detail-row']}>
                        <div className={styles['detail-item']}>
                          <i className="fas fa-calendar-check"></i>
                          <span className={styles['label']}>Start:</span>
                          <span className={styles['value']}>
                            {new Date(request.campaign_start_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={styles['detail-item']}>
                          <i className="fas fa-calendar-times"></i>
                          <span className={styles['label']}>End:</span>
                          <span className={styles['value']}>
                            {new Date(request.campaign_end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={styles['sent-request-actions']}>
                    <button
                      className={styles['btn-cancel-request']}
                      onClick={() => cancelSentRequest(request._id, request.campaign_title)}
                    >
                      <i className="fas fa-times-circle"></i> Cancel Request
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles['no-sent-requests']}>
                <i className="fas fa-paper-plane"></i>
                <h3>No Sent Requests</h3>
                <p>You haven't sent any collaboration requests yet. Explore campaigns to get started!</p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Campaign History Section */}
        <section className={styles['campaign-history-section']} style={{ marginTop: '2rem' }}>
          <h2>Recent Campaign History</h2>
          {recentCampaignHistory && recentCampaignHistory.length > 0 ? (
            <div className={styles['campaigns-grid']}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '10px' }}>
              {recentCampaignHistory.map((campaign, idx) => (
                <div key={idx} className={styles['campaign-card']}
                  style={{ background: '#fff', borderRadius: '10px', padding: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.08)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span className={styles['campaign-status']}
                    style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', background: '#e6f4ea', color: '#34a853' }}>
                    {campaign.status}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {campaign.brand_logo && (
                      <img
                        src={campaign.brand_logo}
                        alt={campaign.brand_name}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: '18px', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {campaign.title}
                      </h3>
                      {campaign.brand_name && (
                        <div style={{ fontSize: '12px', color: '#6c757d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {campaign.brand_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: 0, color: '#666' }}>
                    {(campaign.description || '').substring(0, 120)}...
                  </p>
                  <div className={styles['campaign-metrics']}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '8px 0', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div className={styles['metric']} style={{ textAlign: 'center' }}>
                      <div className={styles['metric-value']} style={{ fontWeight: 600, color: '#4285f4' }}>
                        {campaign.performance_score?.toFixed(1)}
                      </div>
                      <div className={styles['metric-label']} style={{ fontSize: '12px', color: '#666' }}>Performance</div>
                    </div>
                    <div className={styles['metric']} style={{ textAlign: 'center' }}>
                      <div className={styles['metric-value']} style={{ fontWeight: 600, color: '#4285f4' }}>
                        {campaign.engagement_rate?.toFixed(1)}%
                      </div>
                      <div className={styles['metric-label']} style={{ fontSize: '12px', color: '#666' }}>Engagement</div>
                    </div>
                    <div className={styles['metric']} style={{ textAlign: 'center' }}>
                      <div className={styles['metric-value']} style={{ fontWeight: 600, color: '#4285f4' }}>
                        {campaign.reach?.toLocaleString()}
                      </div>
                      <div className={styles['metric-label']} style={{ fontSize: '12px', color: '#666' }}>Reach</div>
                    </div>
                  </div>
                  <div className={styles['campaign-details']}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                    <div className={styles['detail-item']} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '12px' }}>
                      <i className="far fa-calendar" style={{ color: '#4285f4' }}></i>
                      <span>
                        {new Date(campaign.start_date || campaign.end_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={styles['detail-item']} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '12px' }}>
                      <i className="fas fa-clock" style={{ color: '#4285f4' }}></i>
                      <span>{campaign.duration || 0} days</span>
                    </div>
                    <div className={styles['detail-item']} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '12px' }}>
                      <i className="fas fa-tag" style={{ color: '#4285f4' }}></i>
                      <span>{(campaign.budget || 0).toLocaleString()} budget</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <div className={styles['view-history']} style={{ marginTop: '12px' }}>
            <Link to="/influencer/campaign-history" className={styles['view-campaigns-btn']}
              style={{ display: 'inline-block', background: '#007BFF', color: '#fff', padding: '8px 14px', borderRadius: '8px', textDecoration: 'none' }}>
              View All Campaigns
            </Link>
          </div>
        </section>
      </div>

      {/* Content Creation Modal */}
      {contentModalOpen && (
        <div id="contentCreationModal" className={styles['modal']} style={{ display: 'block' }}>
          <div className={styles['modal-content']}>
            <span className={styles['close']} onClick={closeContentCreationModal}>&times;</span>
            <h2><i className="fas fa-video"></i> Create Content</h2>
            <div className={styles['modal-body']}>
              <form id="contentCreationForm" onSubmit={handleContentSubmit} encType="multipart/form-data">
                <div className={styles['form-group']}>
                  <label htmlFor="contentMedia">Post(Video/ Picture) <span className={styles['required']}>*</span></label>
                  <input
                    type="file"
                    id="contentMedia"
                    name="media_files"
                    className={styles['form-control']}
                    multiple
                    accept="image/*,video/*"
                    required
                    onChange={(e) => setContentForm(prev => ({ ...prev, media_files: e.target.files }))}
                  />
                  <small className={styles['form-text']}>Upload images or videos for your content</small>
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="contentDescription">Content Caption <span className={styles['required']}>*</span></label>
                  <textarea
                    id="contentDescription"
                    name="description"
                    className={styles['form-control']}
                    placeholder="Write your caption here..."
                    rows="4"
                    required
                    value={contentForm.description}
                    onChange={(e) => setContentForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="contentType">Content Type <span className={styles['required']}>*</span></label>
                  <select
                    id="contentType"
                    name="content_type"
                    className={styles['form-control']}
                    required
                    value={contentForm.content_type}
                    onChange={(e) => setContentForm(prev => ({ ...prev, content_type: e.target.value }))}
                  >
                    <option value="">Select content type</option>
                    <option value="post">Social Media Post</option>
                    <option value="story">Story</option>
                    <option value="reel">Reel/Video</option>
                    <option value="review">Product Review</option>
                    <option value="unboxing">Unboxing</option>
                    <option value="tutorial">Tutorial</option>
                  </select>
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="platforms">Platforms <span className={styles['required']}>*</span></label>
                  <div className={styles['checkbox-group']}>
                    {['instagram', 'youtube', 'tiktok', 'facebook'].map(platform => (
                      <label key={platform} className={styles['checkbox-item']}>
                        <input
                          type="checkbox"
                          name="platforms"
                          value={platform}
                          checked={contentForm.platforms.includes(platform)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setContentForm(prev => ({ ...prev, platforms: [...prev.platforms, platform] }));
                            } else {
                              setContentForm(prev => ({ ...prev, platforms: prev.platforms.filter(p => p !== platform) }));
                            }
                          }}
                        />
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="campaignProduct">Campaign Product <span className={styles['required']}>*</span></label>
                  <select
                    id="campaignProduct"
                    name="campaign_product"
                    className={styles['form-control']}
                    required
                    value={contentForm.campaign_product}
                    onChange={(e) => setContentForm(prev => ({ ...prev, campaign_product: e.target.value }))}
                  >
                    <option value="">Select a product to promote</option>
                    {campaignProducts.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} - ${product.campaign_price}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="specialInstructions">Special Instructions</label>
                  <textarea
                    id="specialInstructions"
                    name="special_instructions"
                    className={styles['form-control']}
                    placeholder="Any special instructions or requirements"
                    rows="3"
                    value={contentForm.special_instructions}
                    onChange={(e) => setContentForm(prev => ({ ...prev, special_instructions: e.target.value }))}
                  />
                </div>

                <div className={styles['form-group']}>
                  <label htmlFor="publishDate">Planned Publish Date</label>
                  <input
                    type="datetime-local"
                    id="publishDate"
                    name="publish_date"
                    className={styles['form-control']}
                    value={contentForm.publish_date}
                    onChange={(e) => setContentForm(prev => ({ ...prev, publish_date: e.target.value }))}
                  />
                </div>

                <div className={styles['form-actions']}>
                  <button type="button" className={`${styles['btn']} ${styles['btn-secondary']}`} onClick={closeContentCreationModal}>
                    Cancel
                  </button>
                  <button type="submit" className={`${styles['btn']} ${styles['btn-success']}`}>
                    <i className="fas fa-paper-plane"></i> Submit for Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Progress Modal */}
      {progressModalOpen && (
        <div id="updateProgressModal" className={styles['modal']} style={{ display: 'block' }}>
          <div className={styles['modal-content']}>
            <span className={styles['close']} onClick={closeUpdateProgressModal}>&times;</span>
            <h2>Update Progress & Metrics</h2>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: '10px 0' }}>
              Note: Progress can only be increased, not decreased.
            </p>

            <form id="updateMetricsForm" onSubmit={handleProgressSubmit}>
              <div className={styles['progress-input']}>
                <label htmlFor="progressSlider">Campaign Progress:</label>
                <input
                  type="range"
                  id="progressSlider"
                  min={activeCollaborations.find(c => c.id === currentCollabId)?.progress || 0}
                  max="100"
                  value={progressForm.progress}
                  onChange={(e) => setProgressForm(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                />
                <span id="progressValue">{progressForm.progress}%</span>
              </div>

              <div className={styles['metrics-grid']}>
                <div className={styles['metric-group']}>
                  <label htmlFor="reachInput">Reach:</label>
                  <input
                    type="number"
                    id="reachInput"
                    name="reach"
                    min="0"
                    placeholder="0"
                    value={progressForm.reach}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, reach: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className={styles['metric-group']}>
                  <label htmlFor="clicksInput">Clicks:</label>
                  <input
                    type="number"
                    id="clicksInput"
                    name="clicks"
                    min="0"
                    placeholder="0"
                    value={progressForm.clicks}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, clicks: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className={styles['metric-group']}>
                  <label htmlFor="performanceScoreInput">Performance Score (%):</label>
                  <input
                    type="number"
                    id="performanceScoreInput"
                    name="performance_score"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0"
                    value={progressForm.performance_score}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, performance_score: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className={styles['metric-group']}>
                  <label htmlFor="conversionsInput">Conversions:</label>
                  <input
                    type="number"
                    id="conversionsInput"
                    name="conversions"
                    min="0"
                    placeholder="0"
                    value={progressForm.conversions}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, conversions: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className={styles['metric-group']}>
                  <label htmlFor="engagementRateInput">Engagement Rate (%):</label>
                  <input
                    type="number"
                    id="engagementRateInput"
                    name="engagement_rate"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0"
                    value={progressForm.engagement_rate}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, engagement_rate: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className={styles['metric-group']}>
                  <label htmlFor="impressionsInput">Impressions:</label>
                  <input
                    type="number"
                    id="impressionsInput"
                    name="impressions"
                    min="0"
                    placeholder="0"
                    value={progressForm.impressions}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, impressions: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className={styles['metric-group']}>
                  <label htmlFor="revenueInput">Revenue ($):</label>
                  <input
                    type="number"
                    id="revenueInput"
                    name="revenue"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={progressForm.revenue}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, revenue: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className={styles['metric-group']}>
                  <label htmlFor="roiInput">ROI (%):</label>
                  <input
                    type="number"
                    id="roiInput"
                    name="roi"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={progressForm.roi}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, roi: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className={styles['form-actions']}>
                <button type="button" className={styles['btn-secondary']} onClick={closeUpdateProgressModal}>Cancel</button>
                <button type="submit" className={styles['btn-primary']}>Save Progress & Metrics</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;