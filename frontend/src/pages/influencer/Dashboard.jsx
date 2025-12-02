import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfluencer } from '../../contexts/InfluencerContext';
import InfluencerNavigation from '../../components/influencer/InfluencerNavigation';
import IntroSection from '../../components/influencer/dashboard/IntroSection';
import SubscriptionAlert from '../../components/influencer/dashboard/SubscriptionAlert';
import DashboardOverview from '../../components/influencer/dashboard/DashboardOverview';
import ActiveCollaborations from '../../components/influencer/dashboard/ActiveCollaborations';
import BrandInvitations from '../../components/influencer/dashboard/BrandInvitations';
import SentRequests from '../../components/influencer/dashboard/SentRequests';
import RecentCampaignHistory from '../../components/influencer/dashboard/RecentCampaignHistory';
import ContentCreationModal from '../../components/influencer/dashboard/ContentCreationModal';
import ProgressModal from '../../components/influencer/dashboard/ProgressModal';
import styles from '../../styles/influencer/dashboard.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import {
  getCollabDetails,
  updateCollabProgress,
  loadCampaignProducts,
  createContent,
  acceptBrandInvite,
  declineBrandInvite,
  cancelSentRequest,
  copyToClipboard,
  checkApprovedContent,
  updateContentStatus
} from '../../utils/InfluencerDashboard';

const EXTERNAL_ASSETS = {
  styles: [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
  ],
  scripts: []
};

const Dashboard = () => {
  useExternalAssets(EXTERNAL_ASSETS);
  const navigate = useNavigate();
  const { influencer: contextInfluencer, loading: influencerLoading, error: influencerError, subscriptionStatus: contextSubscriptionStatus, subscriptionLimits: contextSubscriptionLimits, cacheDashboardData } = useInfluencer();

  // Dashboard-specific loading/error states (for campaigns, stats, etc.)
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  // Combine loading states
  const loading = influencerLoading || dashboardLoading;
  const error = influencerError || dashboardError;

  // Dashboard data (dynamic data only)
  const [stats, setStats] = useState(null);
  const [activeCollaborations, setActiveCollaborations] = useState([]);
  const [brandInvites, setBrandInvites] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [recentCampaignHistory, setRecentCampaignHistory] = useState([]);
  const [baseUrl, setBaseUrl] = useState('');

  // Use subscription data from context if available, otherwise from dashboard response
  const subscriptionStatus = contextSubscriptionStatus || null;
  const subscriptionLimits = contextSubscriptionLimits || null;

  // Modal states
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentModalData, setContentModalData] = useState({
    campaignId: null,
    campaignName: '',
    products: [],
    loading: false
  });
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressModalData, setProgressModalData] = useState({
    collabId: null,
    currentProgress: 0,
    metrics: {
      reach: 0,
      clicks: 0,
      performanceScore: 0,
      conversions: 0,
      engagementRate: 0,
      impressions: 0,
      revenue: 0,
      roi: 0
    },
    loading: false
  });
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsModalData, setDetailsModalData] = useState({ loading: false, details: null });

  // Form states
  const [contentFormData, setContentFormData] = useState({
    campaignId: '',
    description: '',
    contentType: '',
    platforms: [],
    campaignProduct: '',
    specialInstructions: '',
    publishDate: '',
    mediaFiles: null
  });
  const [progressFormData, setProgressFormData] = useState({
    progress: 0,
    reach: 0,
    clicks: 0,
    performanceScore: 0,
    conversions: 0,
    engagementRate: 0,
    impressions: 0,
    revenue: 0,
    roi: 0
  });

  const progressSliderRef = useRef(null);
  const progressValueRef = useRef(null);

  // Fetch dashboard data function (only dynamic data)
  const fetchDashboardData = async () => {
    try {
      setDashboardLoading(true);
      setDashboardError(null);
      const response = await fetch(`${API_BASE_URL}/influencer/home`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/signin');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load dashboard');
      }

      const data = await response.json();
      if (data.success) {
        // Use influencer from context, not from API response
        // Only fetch dynamic data: stats, collaborations, invites, requests
        setStats(data.stats);
        setActiveCollaborations(data.activeCollaborations || []);
        setBrandInvites(data.brandInvites || []);
        setSentRequests(data.sentRequests || []);
        setRecentCampaignHistory(data.recentCampaignHistory || []);
        setBaseUrl(data.baseUrl || window.location.origin);

        // Cache subscription data in context if available
        if (data.subscriptionStatus || data.subscriptionLimits) {
          cacheDashboardData({
            subscriptionStatus: data.subscriptionStatus,
            subscriptionLimits: data.subscriptionLimits
          });
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setDashboardError(err.message || 'Failed to load dashboard');
    } finally {
      setDashboardLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchDashboardData();

    // Check for approved content on mount
    checkApprovedContent().then(data => {
      if (data.success && data.content && data.content.length > 0) {
        data.content.forEach(async (content) => {
          const campaignTitle = content.campaignTitle || 'Campaign';
          const brandName = content.brandName || 'the brand';
          const message = `Your content for "${campaignTitle}" has been approved by ${brandName}! You can now post it on social media.`;
          alert(message);

          // Update content status to published
          try {
            await updateContentStatus(content._id);
          } catch (error) {
            console.error('Error updating content status:', error);
          }
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle menu toggle

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

  // Handle copy shop URL
  const handleCopyShopUrl = async (campaignId) => {
    const url = `${baseUrl}/customer/campaign/${campaignId}/shop`;
    try {
      await copyToClipboard(url);
      // Visual feedback could be added here
    } catch (error) {
      alert('Failed to copy URL. Please copy it manually.');
    }
  };

  // Handle open content creation modal
  const handleOpenContentModal = async (campaignId, campaignTitle) => {
    setContentModalData({
      campaignId,
      campaignName: campaignTitle,
      products: [],
      loading: true
    });
    setContentFormData(prev => ({
      ...prev,
      campaignId,
      description: '',
      contentType: '',
      platforms: [],
      campaignProduct: '',
      specialInstructions: '',
      publishDate: '',
      mediaFiles: null
    }));
    setContentModalOpen(true);

    // Load campaign products
    try {
      const data = await loadCampaignProducts(campaignId);
      if (data.success && data.products) {
        setContentModalData(prev => ({
          ...prev,
          products: data.products,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setContentModalData(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCloseContentModal = () => {
    setContentModalOpen(false);
    setContentFormData({
      campaignId: '',
      description: '',
      contentType: '',
      platforms: [],
      campaignProduct: '',
      specialInstructions: '',
      publishDate: '',
      mediaFiles: null
    });
  };

  // Handle content form submission
  const handleContentSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!contentFormData.description || !contentFormData.contentType ||
      contentFormData.platforms.length === 0 || !contentFormData.campaignProduct ||
      !contentFormData.mediaFiles || contentFormData.mediaFiles.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('campaignId', contentFormData.campaignId);
      formData.append('description', contentFormData.description);
      formData.append('content_type', contentFormData.contentType);
      contentFormData.platforms.forEach(platform => {
        formData.append('platforms', platform);
      });
      formData.append('campaign_product', contentFormData.campaignProduct);
      if (contentFormData.specialInstructions) {
        formData.append('special_instructions', contentFormData.specialInstructions);
      }
      if (contentFormData.publishDate) {
        formData.append('publish_date', contentFormData.publishDate);
      }
      Array.from(contentFormData.mediaFiles).forEach(file => {
        formData.append('media_files', file);
      });

      const result = await createContent(formData);
      if (result.success) {
        alert('Content submitted for review successfully!');
        handleCloseContentModal();
        await fetchDashboardData();
      }
    } catch (error) {
      alert('Error: ' + (error.message || 'Failed to create content'));
    }
  };

  // Handle open progress modal
  const handleOpenProgressModal = async (collabId) => {
    const collab = activeCollaborations.find(c => c.id === collabId);
    if (!collab) return;

    setProgressModalData({
      collabId,
      currentProgress: collab.progress || 0,
      metrics: {
        reach: collab.reach || 0,
        clicks: collab.clicks || 0,
        performanceScore: collab.performance_score || 0,
        conversions: collab.conversions || 0,
        engagementRate: collab.engagement_rate || 0,
        impressions: collab.impressions || 0,
        revenue: collab.revenue || 0,
        roi: collab.roi || 0
      },
      loading: false
    });

    setProgressFormData({
      progress: collab.progress || 0,
      reach: collab.reach || 0,
      clicks: collab.clicks || 0,
      performanceScore: collab.performance_score || 0,
      conversions: collab.conversions || 0,
      engagementRate: collab.engagement_rate || 0,
      impressions: collab.impressions || 0,
      revenue: collab.revenue || 0,
      roi: collab.roi || 0
    });

    setProgressModalOpen(true);
  };

  const handleCloseProgressModal = () => {
    setProgressModalOpen(false);
  };

  // Handle progress form submission
  const handleProgressSubmit = async (e) => {
    e.preventDefault();

    // Validate percentage fields
    if (progressFormData.performanceScore < 0 || progressFormData.performanceScore > 100 ||
      progressFormData.engagementRate < 0 || progressFormData.engagementRate > 100) {
      alert('Performance Score and Engagement Rate must be between 0 and 100.');
      return;
    }

    if (progressFormData.roi < 0) {
      alert('ROI must be 0 or greater.');
      return;
    }

    if (progressFormData.progress < progressModalData.currentProgress) {
      alert('Progress can only be increased, not decreased.');
      return;
    }

    try {
      const result = await updateCollabProgress({
        collabId: progressModalData.collabId,
        progress: progressFormData.progress,
        reach: progressFormData.reach,
        clicks: progressFormData.clicks,
        performanceScore: progressFormData.performanceScore,
        conversions: progressFormData.conversions,
        engagementRate: progressFormData.engagementRate,
        impressions: progressFormData.impressions,
        revenue: progressFormData.revenue,
        roi: progressFormData.roi
      });

      if (result.success) {
        alert('Progress and metrics updated successfully!');
        handleCloseProgressModal();
        await fetchDashboardData();
      }
    } catch (error) {
      alert('Failed to update progress: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle progress slider change
  useEffect(() => {
    if (progressSliderRef.current && progressValueRef.current) {
      const slider = progressSliderRef.current;
      const valueDisplay = progressValueRef.current;

      const handleInput = (e) => {
        const minValue = parseInt(slider.min) || 0;
        const currentValue = parseInt(e.target.value);

        if (currentValue < minValue) {
          slider.value = minValue;
          setProgressFormData(prev => ({ ...prev, progress: minValue }));
        } else {
          setProgressFormData(prev => ({ ...prev, progress: currentValue }));
        }

        if (valueDisplay) {
          valueDisplay.textContent = `${slider.value}%`;
        }
      };

      slider.addEventListener('input', handleInput);
      return () => slider.removeEventListener('input', handleInput);
    }
  }, [progressModalOpen]);

  // Handle accept brand invite
  const handleAcceptInvite = async (inviteId, campaignTitle) => {
    if (!confirm(`Accept invitation for "${campaignTitle}"?`)) {
      return;
    }

    try {
      const result = await acceptBrandInvite(inviteId);
      if (result.success) {
        alert('Invitation accepted successfully!');
        await fetchDashboardData();
      }
    } catch (error) {
      alert('Failed to accept invitation: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle decline brand invite
  const handleDeclineInvite = async (inviteId, campaignTitle) => {
    if (!confirm(`Decline invitation for "${campaignTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const result = await declineBrandInvite(inviteId);
      if (result.success) {
        alert('Invitation declined.');
        await fetchDashboardData();
      }
    } catch (error) {
      alert('Failed to decline invitation: ' + (error.message || 'Unknown error'));
    }
  };

  // Handle cancel sent request
  const handleCancelRequest = async (requestId, campaignTitle) => {
    if (!confirm(`Cancel your request for "${campaignTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const result = await cancelSentRequest(requestId);
      if (result.success) {
        alert('Request cancelled successfully.');
        await fetchDashboardData();
      }
    } catch (error) {
      alert('Failed to cancel request: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className={styles['dashboard-page']}>
        <div className="loading-message">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['dashboard-page']}>
        <div className="error-alert">{error}</div>
      </div>
    );
  }

  return (
    <div className={styles['dashboard-page']}>
      {/* Header */}
      <InfluencerNavigation onSignOut={handleSignOut} showNotification={true} />

      {/* Main Content */}
      <div className="container">
        <IntroSection 
          influencer={contextInfluencer} 
          subscriptionStatus={subscriptionStatus} 
          stats={stats}
        />
        <SubscriptionAlert subscriptionStatus={subscriptionStatus} />
        <DashboardOverview stats={stats} />
        <ActiveCollaborations
          collaborations={activeCollaborations}
          baseUrl={baseUrl}
          onCopyShopUrl={handleCopyShopUrl}
          onOpenProgressModal={handleOpenProgressModal}
          onOpenContentModal={handleOpenContentModal}
        />
        <BrandInvitations
          invites={brandInvites}
          onAccept={handleAcceptInvite}
          onDecline={handleDeclineInvite}
        />
        <SentRequests requests={sentRequests} onCancel={handleCancelRequest} />
        <RecentCampaignHistory campaigns={recentCampaignHistory} />
        </div>

      <ContentCreationModal
        isOpen={contentModalOpen}
        formData={contentFormData}
        modalData={contentModalData}
        onClose={handleCloseContentModal}
        onSubmit={handleContentSubmit}
        setFormData={setContentFormData}
      />

      <ProgressModal
        isOpen={progressModalOpen}
        formData={progressFormData}
        modalData={progressModalData}
        onClose={handleCloseProgressModal}
        onSubmit={handleProgressSubmit}
        sliderRef={progressSliderRef}
        valueRef={progressValueRef}
        setFormData={setProgressFormData}
      />
    </div>
  );
};

export default Dashboard;
