import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/brand/dashboard.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import { useBrand } from '../../contexts/BrandContext';
import BrandNavigation from '../../components/brand/BrandNavigation';
import NotificationModal from '../../components/brand/NotificationModal';
import {
  activateCampaign,
  loadCampaignContent,
  viewCampaignDetails,
  endCampaign,
  reviewContent
} from '../../utils/BrandDashboard';
import SuccessMessage from '../../components/brand/dashboard/SuccessMessage';
import CompletedProgressAlert from '../../components/brand/dashboard/CompletedProgressAlert';
import SubscriptionAlert from '../../components/brand/dashboard/SubscriptionAlert';
import IntroSection from '../../components/brand/dashboard/IntroSection';
import ActiveCampaignsSection from '../../components/brand/dashboard/ActiveCampaignsSection';
import CampaignRequestsSection from '../../components/brand/dashboard/CampaignRequestsSection';
import RecentCampaignHistory from '../../components/brand/dashboard/RecentCampaignHistory';
import CampaignDetailsModal from '../../components/brand/dashboard/CampaignDetailsModal';
import ContentReviewModal from '../../components/brand/dashboard/ContentReviewModal';
import InfluencersListModal from '../../components/brand/dashboard/InfluencersListModal';
import InfluencerContributionModal from '../../components/brand/dashboard/InfluencerContributionModal';

const EXTERNAL_ASSETS = {
  styles: [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css'
  ],
  scripts: [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/apexcharts'
  ]
};

const Dashboard = () => {
  useExternalAssets(EXTERNAL_ASSETS);
  const navigate = useNavigate();
  const { brand: contextBrand, loading: brandLoading, error: brandError, subscriptionStatus: contextSubscriptionStatus, subscriptionLimits: contextSubscriptionLimits, cacheDashboardData } = useBrand();

  // Dashboard-specific loading/error states (for campaigns, stats, etc.)
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [successVisible, setSuccessVisible] = useState(true);

  // Combine loading states
  const loading = brandLoading || dashboardLoading;
  const error = brandError || dashboardError;

  // Dashboard data (dynamic data only)
  const [stats, setStats] = useState(null);
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [campaignRequests, setCampaignRequests] = useState([]);
  const [recentCompletedCampaigns, setRecentCompletedCampaigns] = useState([]);
  const [completedProgressCampaigns, setCompletedProgressCampaigns] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);

  // Use subscription data from context if available, otherwise from dashboard response
  const subscriptionStatus = contextSubscriptionStatus || null;
  const subscriptionLimits = contextSubscriptionLimits || null;

  // Modal states
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentModalData, setContentModalData] = useState({ campaignId: null, campaignName: '', content: [], loading: false });
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsModalData, setDetailsModalData] = useState({ loading: false, details: null });
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  // Bootstrap modal refs
  const contentModalRef = useRef(null);
  const detailsModalRef = useRef(null);
  const detailsModalInstanceRef = useRef(null);
  const contentModalInstanceRef = useRef(null);

  // New state for influencer drill-down
  const [influencerListOpen, setInfluencerListOpen] = useState(false);
  const [influencerListData, setInfluencerListData] = useState({ campaignId: null, campaignName: '', influencers: [], loading: false });
  const [contributionOpen, setContributionOpen] = useState(false);
  const [contributionData, setContributionData] = useState({ data: null, loading: false });

  const influencerListModalRef = useRef(null);
  const contributionModalRef = useRef(null);
  const influencerListInstanceRef = useRef(null);
  const contributionInstanceRef = useRef(null);

  // Fetch dashboard data function (only dynamic data)
  const fetchDashboardData = async () => {
    try {
      setDashboardLoading(true);
      setDashboardError(null);
      const response = await fetch(`${API_BASE_URL}/brand/home`, {
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
        throw new Error('Failed to load dashboard');
      }

      const data = await response.json();
      if (data.success) {
        // Use brand from context, not from API response
        // Only fetch dynamic data: stats, campaigns, requests
        setStats(data.stats);
        setActiveCampaigns(data.activeCampaigns || []);
        setCampaignRequests(data.campaignRequests || []);
        setRecentCompletedCampaigns(data.recentCompletedCampaigns || []);
        setCompletedProgressCampaigns(data.completedProgressCampaigns || []);
        setSuccessMessage(data.successMessage);
        setSuccessVisible(true);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Initialize Bootstrap modals (wait for Bootstrap to load)
  useEffect(() => {
    const initModals = () => {
      if (typeof window !== 'undefined' && window.bootstrap && window.bootstrap.Modal) {
        // Initialize content modal
        if (contentModalRef.current && !contentModalInstanceRef.current) {
          try {
            contentModalInstanceRef.current = new window.bootstrap.Modal(contentModalRef.current, {
              backdrop: true,
              keyboard: true,
              focus: true
            });

            // Handle modal hidden event to clean up state
            const handleContentModalHidden = () => {
              setContentModalOpen(false);
              // Remove focus from modal
              if (document.activeElement && contentModalRef.current?.contains(document.activeElement)) {
                document.body.focus();
              }
            };

            contentModalRef.current.addEventListener('hidden.bs.modal', handleContentModalHidden);
          } catch (error) {
            console.error('Error initializing content modal:', error);
          }
        }

        // Initialize details modal
        if (detailsModalRef.current && !detailsModalInstanceRef.current) {
          try {
            detailsModalInstanceRef.current = new window.bootstrap.Modal(detailsModalRef.current, {
              backdrop: true,
              keyboard: true,
              focus: true
            });

            // Handle modal hidden event to clean up state
            const handleDetailsModalHidden = () => {
              setDetailsModalOpen(false);
              // Remove focus from modal
              if (document.activeElement && detailsModalRef.current?.contains(document.activeElement)) {
                document.body.focus();
              }
            };

            detailsModalRef.current.addEventListener('hidden.bs.modal', handleDetailsModalHidden);
          } catch (error) {
            console.error('Error initializing details modal:', error);
          }
        }
      }
    };

    // Initialize New Modals
    const initNewModals = () => {
      if (typeof window !== 'undefined' && window.bootstrap && window.bootstrap.Modal) {
        // List Modal
        if (influencerListModalRef.current && !influencerListInstanceRef.current) {
          influencerListInstanceRef.current = new window.bootstrap.Modal(influencerListModalRef.current, { backdrop: true, keyboard: true });
          influencerListModalRef.current.addEventListener('hidden.bs.modal', () => setInfluencerListOpen(false));
        }
        // Contribution Modal
        if (contributionModalRef.current && !contributionInstanceRef.current) {
          contributionInstanceRef.current = new window.bootstrap.Modal(contributionModalRef.current, { backdrop: true, keyboard: true });
          contributionModalRef.current.addEventListener('hidden.bs.modal', () => setContributionOpen(false));
        }
      }
    };

    // Try to initialize immediately
    initModals();
    initNewModals();

    // If Bootstrap isn't loaded yet, wait for it
    if (typeof window !== 'undefined' && !window.bootstrap) {
      const checkBootstrap = setInterval(() => {
        if (window.bootstrap) {
          clearInterval(checkBootstrap);
          initModals();
          initNewModals();
        }
      }, 100);

      // Cleanup interval after 5 seconds
      setTimeout(() => clearInterval(checkBootstrap), 5000);
    }

    // Cleanup on unmount
    return () => {
      if (contentModalInstanceRef.current) contentModalInstanceRef.current.dispose();
      if (detailsModalInstanceRef.current) detailsModalInstanceRef.current.dispose();
      if (influencerListInstanceRef.current) influencerListInstanceRef.current.dispose();
      if (contributionInstanceRef.current) contributionInstanceRef.current.dispose();
    };
  }, []); // Run only once on mount

  // Show/hide modals based on state
  useEffect(() => {
    if (contentModalInstanceRef.current) {
      if (contentModalOpen) {
        contentModalInstanceRef.current.show();
      } else {
        contentModalInstanceRef.current.hide();
      }
    }
  }, [contentModalOpen]);

  useEffect(() => {
    if (detailsModalInstanceRef.current) {
      detailsModalOpen ? detailsModalInstanceRef.current.show() : detailsModalInstanceRef.current.hide();
    }
  }, [detailsModalOpen]);

  useEffect(() => {
    if (influencerListInstanceRef.current) {
      influencerListOpen ? influencerListInstanceRef.current.show() : influencerListInstanceRef.current.hide();
    }
  }, [influencerListOpen]);

  useEffect(() => {
    if (contributionInstanceRef.current) {
      contributionOpen ? contributionInstanceRef.current.show() : contributionInstanceRef.current.hide();
    }
  }, [contributionOpen]);

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

  const handleActivateCampaign = async (campaignId) => {
    if (!campaignId) {
      alert('Campaign ID is missing. Cannot activate campaign.');
      return;
    }

    try {
      console.log('Activating campaign:', campaignId);
      const result = await activateCampaign(campaignId);
      if (result.success) {
        // Show success message
        setSuccessMessage(result.message || 'Campaign activated successfully!');
        setSuccessVisible(true);
        // Refetch dashboard data to reflect changes
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error in handleActivateCampaign:', error);
      // Use alert for action errors to avoid replacing the dashboard
      alert(error.message || 'Failed to activate campaign. Please try again.');
    }
  };

  const handleOpenContentModal = async (campaignId, campaignName) => {
    try {
      setContentModalData({ campaignId, campaignName, content: [], loading: true });
      setContentModalOpen(true);
      const result = await loadCampaignContent(campaignId);
      if (result.success) {
        setContentModalData({
          campaignId,
          campaignName: result.campaignName || campaignName,
          content: result.content || [],
          loading: false
        });
      }
    } catch (error) {
      alert(error.message || 'Failed to load campaign content');
      setContentModalData({ campaignId, campaignName, content: [], loading: false });
    }
  };

  const handleReviewContent = async (contentId, action) => {
    const feedback = prompt(`Please provide feedback for ${action === 'approve' ? 'approving' : 'rejecting'} this content:`);
    if (feedback === null) return;

    try {
      const result = await reviewContent(contentId, action, feedback);
      if (result.success) {
        // Update content status in UI immediately
        setContentModalData(prev => ({
          ...prev,
          content: prev.content.map(item =>
            item._id === contentId
              ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' }
              : item
          )
        }));
        // Show success message
        setSuccessMessage(result.message || `Content ${action}d successfully!`);
        setSuccessVisible(true);
        // Refetch content to get updated data from server
        if (contentModalData.campaignId) {
          const updatedResult = await loadCampaignContent(contentModalData.campaignId);
          if (updatedResult.success) {
            setContentModalData(prev => ({
              ...prev,
              content: updatedResult.content || []
            }));
          }
        }
      }
    } catch (error) {
      // Use alert for action errors to avoid replacing the dashboard
      alert(error.message || 'An error occurred while reviewing the content. Please try again.');
    }
  };

  const handleViewDetails = async (campaignId) => {
    try {
      // Ensure modal instance is initialized
      if (detailsModalRef.current && !detailsModalInstanceRef.current && typeof window !== 'undefined' && window.bootstrap) {
        detailsModalInstanceRef.current = new window.bootstrap.Modal(detailsModalRef.current, {
          backdrop: true,
          keyboard: true,
          focus: true
        });

        // Handle modal hidden event to clean up state
        const handleDetailsModalHidden = () => {
          setDetailsModalOpen(false);
          // Remove focus from modal
          if (document.activeElement && detailsModalRef.current?.contains(document.activeElement)) {
            document.body.focus();
          }
        };

        detailsModalRef.current.addEventListener('hidden.bs.modal', handleDetailsModalHidden);
      }

      setDetailsModalData({ loading: true, details: null });
      setDetailsModalOpen(true);
      const details = await viewCampaignDetails(campaignId);
      setDetailsModalData({ loading: false, details });
    } catch (error) {
      alert(error.message || 'Failed to load campaign details. Please try again.');
      setDetailsModalData({ loading: false, details: null });
      setDetailsModalOpen(false);
    }
  };

  const handleEndCampaign = async (campaignId, campaignTitle) => {
    if (!confirm(`Are you sure you want to end the campaign "${campaignTitle}"?\n\nThis will mark it as completed and move it to campaign history.`)) {
      return;
    }

    try {
      const result = await endCampaign(campaignId);
      if (result.success) {
        // Show success message
        setSuccessMessage(result.message || 'Campaign ended successfully!');
        setSuccessVisible(true);
        // Close content modal if open
        setContentModalOpen(false);
        // Refetch dashboard data to reflect changes (campaign moved to history)
        await fetchDashboardData();
      }
    } catch (error) {
      // Use alert for action errors to avoid replacing the dashboard
      alert(error.message || 'An error occurred while ending the campaign. Please try again.');
    }
  };

  // --- New Handlers for Drill-down ---

  const handleViewInfluencers = async (campaignId, campaignName) => {
    setInfluencerListData({ campaignId, campaignName, influencers: [], loading: true });
    setInfluencerListOpen(true);

    try {
      const response = await fetch(`${API_BASE_URL}/brand/campaigns/${campaignId}/influencers`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setInfluencerListData(prev => ({ ...prev, influencers: data.influencers, loading: false }));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching influencers:', error);
      alert('Failed to load influencers');
      setInfluencerListData(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSelectInfluencer = async (influencerId) => {
    // Hide list modal temporarily (or keep open below, but standard bootstrap modals don't stack well without config)
    // We'll stacking logic: Close list, open contribution. Back follows reverse.
    setInfluencerListOpen(false);
    setContributionData({ data: null, loading: true });
    setContributionOpen(true);

    const campaignId = influencerListData.campaignId;

    try {
      const response = await fetch(`${API_BASE_URL}/brand/campaigns/${campaignId}/influencers/${influencerId}/contribution`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setContributionData({ data: data, loading: false });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching contribution:', error);
      alert('Failed to load contribution details');
      setContributionData(prev => ({ ...prev, loading: false }));
      // Reopen list if failed
      setContributionOpen(false);
      setInfluencerListOpen(true);
    }
  };

  const handleBackToInfluencers = () => {
    setContributionOpen(false);
    setInfluencerListOpen(true);
  };

  if (loading) {
    return (
      <div className={styles.brandDashboardPage}>
        <div className="loadingMessage">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.brandDashboardPage}>
        <div className="errorAlert">{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.brandDashboardPage}>
      <BrandNavigation
        onSignOut={handleSignOut}
        onNotificationClick={() => setNotificationModalOpen(true)}
        showNotification={true}
      />

      <NotificationModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
      />

      <SuccessMessage
        message={successMessage}
        visible={successVisible}
        onClose={() => setSuccessVisible(false)}
      />

      {/* Main Content */}
      <div className="container">
        <CompletedProgressAlert campaigns={completedProgressCampaigns} />
        <SubscriptionAlert subscriptionStatus={subscriptionStatus} />

        <IntroSection
          brand={contextBrand}
          stats={stats}
          subscriptionStatus={subscriptionStatus}
          subscriptionLimits={subscriptionLimits}
        />

        <ActiveCampaignsSection
          campaigns={activeCampaigns}
          onReviewContent={handleOpenContentModal}
          onEndCampaign={handleEndCampaign}
          onViewInfluencers={handleViewInfluencers}
        />

        <CampaignRequestsSection
          requests={campaignRequests}
          onActivate={handleActivateCampaign}
          onViewDetails={handleViewDetails}
        />

        <RecentCampaignHistory campaigns={recentCompletedCampaigns} />
      </div>

      <CampaignDetailsModal
        modalRef={detailsModalRef}
        modalInstanceRef={detailsModalInstanceRef}
        isOpen={detailsModalOpen}
        details={detailsModalData.details}
        loading={detailsModalData.loading}
        onClose={() => {
          if (detailsModalInstanceRef.current) {
            detailsModalInstanceRef.current.hide();
          } else {
            setDetailsModalOpen(false);
          }
        }}
      />

      <ContentReviewModal
        modalRef={contentModalRef}
        modalInstanceRef={contentModalInstanceRef}
        isOpen={contentModalOpen}
        campaignName={contentModalData.campaignName}
        content={contentModalData.content}
        loading={contentModalData.loading}
        onClose={() => {
          if (contentModalInstanceRef.current) {
            contentModalInstanceRef.current.hide();
          } else {
            setContentModalOpen(false);
          }
        }}
        onReview={handleReviewContent}
      />

      {/* New Modals */}
      <InfluencersListModal
        modalRef={influencerListModalRef}
        isOpen={influencerListOpen}
        onClose={() => setInfluencerListOpen(false)}
        campaignName={influencerListData.campaignName}
        influencers={influencerListData.influencers}
        loading={influencerListData.loading}
        onSelectInfluencer={handleSelectInfluencer}
      />

      <InfluencerContributionModal
        modalRef={contributionModalRef}
        isOpen={contributionOpen}
        onClose={() => setContributionOpen(false)}
        data={contributionData.data}
        loading={contributionData.loading}
        onBack={handleBackToInfluencers}
      />
    </div>
  );
};

export default Dashboard;
