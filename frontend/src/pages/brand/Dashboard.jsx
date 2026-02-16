
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
import InfluencerContributionModal from '../../components/brand/dashboard/InfluencerContributionModal';
import InfluencerRankingsSection from '../../components/brand/dashboard/InfluencerRankingsSection';
import BrandProductsSection from '../../components/brand/dashboard/BrandProductsSection';
import InfluencersListModal from '../../components/brand/dashboard/InfluencersListModal';
import DeliverablesSection from '../../components/brand/createCampaign/DeliverablesSection';

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
  const [influencerRankings, setInfluencerRankings] = useState([]);
  const [brandProducts, setBrandProducts] = useState([]);
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

  // Deliverables review modal state
  const [deliverablesModalOpen, setDeliverablesModalOpen] = useState(false);
  const [deliverablesData, setDeliverablesData] = useState({ campaignId: null, campaignName: '', items: [], loading: false, errors: {} });
  const deliverablesModalRef = useRef(null);
  const deliverablesModalInstanceRef = useRef(null);

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
        setInfluencerRankings(data.influencerRankings || []);
        setBrandProducts(data.brandProducts || []);
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

    // Initialize Deliverables Modal
    const initDeliverablesModal = () => {
      if (typeof window !== 'undefined' && window.bootstrap && window.bootstrap.Modal) {
        if (deliverablesModalRef.current && !deliverablesModalInstanceRef.current) {
          try {
            deliverablesModalInstanceRef.current = new window.bootstrap.Modal(deliverablesModalRef.current, {
              backdrop: true,
              keyboard: true,
              focus: true
            });
            deliverablesModalRef.current.addEventListener('hidden.bs.modal', () => setDeliverablesModalOpen(false));
          } catch (error) {
            console.error('Error initializing deliverables modal:', error);
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
    initDeliverablesModal();

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

  useEffect(() => {
    if (deliverablesModalInstanceRef.current) {
      deliverablesModalOpen ? deliverablesModalInstanceRef.current.show() : deliverablesModalInstanceRef.current.hide();
    }
  }, [deliverablesModalOpen]);

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

      const res = await fetch(`${API_BASE_URL}/brand/campaigns/${campaignId}/pending-content`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to load campaign content');
      }

      const data = await res.json();
      const content = Array.isArray(data?.items) ? data.items : (data?.content || data || []);
      const name = data?.campaignName || campaignName;

      setContentModalData({
        campaignId,
        campaignName: name,
        content,
        loading: false
      });
    } catch (error) {
      alert(error.message || 'Failed to load campaign content');
      setContentModalData({ campaignId, campaignName, content: [], loading: false });
    }
  };
  // New: open DeliverablesSection modal on Review button
  const handleOpenDeliverablesModal = async (campaignId, campaignName) => {
    try {
      console.log('[handleOpenDeliverablesModal] ========== START ==========');
      console.log('[handleOpenDeliverablesModal] Campaign ID:', campaignId);
      console.log('[handleOpenDeliverablesModal] Campaign Name:', campaignName);
      
      setDeliverablesData({ 
        campaignId, 
        campaignName, 
        items: [], 
        loading: true, 
        errors: {},
        error: null,
        debug: null
      });
      setDeliverablesModalOpen(true);

      const url = `${API_BASE_URL}/brand/campaigns/${campaignId}/deliverables`;
      console.log('[handleOpenDeliverablesModal] Fetching from:', url);
      
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      
      console.log('[handleOpenDeliverablesModal] Response status:', res.status);
      console.log('[handleOpenDeliverablesModal] Response headers:', Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (e) {
          errorData = { message: await res.text() };
        }
        console.error('[handleOpenDeliverablesModal] Error data:', errorData);
        
        setDeliverablesData(prev => ({ 
          ...prev, 
          loading: false,
          error: errorData.message || `HTTP ${res.status}: Failed to load deliverables`,
          debug: errorData.debug || { status: res.status, campaignId }
        }));
        return;
      }
      
      const data = await res.json();
      console.log('[handleOpenDeliverablesModal] Received data:', data);
      console.log('[handleOpenDeliverablesModal] Success:', data.success);
      console.log('[handleOpenDeliverablesModal] Items count:', data.items?.length || 0);
      
      if (!data.success) {
        setDeliverablesData(prev => ({ 
          ...prev, 
          loading: false,
          error: data.message || 'Failed to load deliverables',
          debug: data.debug || {}
        }));
        return;
      }
      
      const items = Array.isArray(data.items) ? data.items : [];
      console.log('[handleOpenDeliverablesModal] Processing', items.length, 'items');
      
      // Log first item structure for debugging
      if (items.length > 0) {
        console.log('[handleOpenDeliverablesModal] First item sample:', JSON.stringify(items[0], null, 2));
      }
      
      setDeliverablesData({ 
        campaignId, 
        campaignName: data?.campaign?.title || campaignName, 
        items, 
        loading: false, 
        errors: {},
        error: null,
        debug: data.debug || null
      });
      
      console.log('[handleOpenDeliverablesModal] ========== SUCCESS ==========');
    } catch (err) {
      console.error('[handleOpenDeliverablesModal] ========== EXCEPTION ==========');
      console.error('[handleOpenDeliverablesModal] Error:', err);
      console.error('[handleOpenDeliverablesModal] Stack:', err.stack);
      
      setDeliverablesData(prev => ({ 
        ...prev, 
        loading: false,
        error: err.message || 'An unexpected error occurred',
        debug: { 
          error: err.message,
          campaignId,
          timestamp: new Date().toISOString()
        }
      }));
    }
  };

  const handleDeliverableChange = (collabId, index, field, value) => {
    setDeliverablesData(prev => {
      const items = prev.items.map(item => {
        if (item.collab_id !== collabId) return item;
        const updated = { ...item };
        const list = Array.isArray(updated.deliverables) ? [...updated.deliverables] : [];
        list[index] = { ...list[index], [field]: value };
        updated.deliverables = list;
        return updated;
      });
      return { ...prev, items };
    });
  };

  const handleAddDeliverable = (collabId) => {
    setDeliverablesData(prev => {
      const items = prev.items.map(item => {
        if (item.collab_id !== collabId) return item;
        const list = Array.isArray(item.deliverables) ? [...item.deliverables] : [];
        list.push({ title: '', description: '', status: 'pending', due_date: new Date().toISOString().slice(0,10) });
        return { ...item, deliverables: list };
      });
      return { ...prev, items };
    });
  };

  const handleRemoveDeliverable = (collabId, index) => {
    setDeliverablesData(prev => {
      const items = prev.items.map(item => {
        if (item.collab_id !== collabId) return item;
        const list = Array.isArray(item.deliverables) ? [...item.deliverables] : [];
        list.splice(index, 1);
        return { ...item, deliverables: list };
      });
      return { ...prev, items };
    });
  };

  const handleSaveDeliverables = async () => {
    try {
      const updates = deliverablesData.items.map(it => ({ collab_id: it.collab_id, deliverables: it.deliverables }));
      const res = await fetch(`${API_BASE_URL}/brand/campaigns/${deliverablesData.campaignId}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save deliverables');

      setSuccessMessage('Deliverables updated successfully');
      setSuccessVisible(true);
      setDeliverablesModalOpen(false);
      // Refresh dashboard to reflect updated progress
      await fetchDashboardData();
    } catch (err) {
      console.error('Error saving deliverables:', err);
      alert(err.message || 'Failed to save deliverables');
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
          onReviewContent={handleOpenDeliverablesModal}
          onEndCampaign={handleEndCampaign}
          onViewInfluencers={handleViewInfluencers}
        />

        <CampaignRequestsSection
          requests={campaignRequests}
          onActivate={handleActivateCampaign}
          onViewDetails={handleViewDetails}
        />

        <InfluencerRankingsSection rankings={influencerRankings} />

        <BrandProductsSection products={brandProducts} />

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

      {/* Deliverables Review Modal */}
      <div className="modal fade" tabIndex="-1" ref={deliverablesModalRef} aria-hidden={!deliverablesModalOpen}>
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Review Deliverables {deliverablesData.campaignName ? `- ${deliverablesData.campaignName}` : ''}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => {
                if (deliverablesModalInstanceRef.current) {
                  deliverablesModalInstanceRef.current.hide();
                } else {
                  setDeliverablesModalOpen(false);
                }
              }}></button>
            </div>
            <div className="modal-body">
              {deliverablesData.loading ? (
                <div className="alert alert-info">
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  Loading deliverables...
                </div>
              ) : deliverablesData.error ? (
                <div className="alert alert-danger">
                  <h6><i className="fas fa-exclamation-triangle me-2"></i>Error Loading Deliverables</h6>
                  <p>{deliverablesData.error}</p>
                  {deliverablesData.debug && (
                    <details className="mt-2">
                      <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Debug Info</summary>
                      <pre style={{ fontSize: 12, background: '#f8f9fa', padding: 10, borderRadius: 4, marginTop: 8 }}>
                        {JSON.stringify(deliverablesData.debug, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <>
                  {deliverablesData.items.length === 0 ? (
                    <div className="alert alert-warning">
                      <h6><i className="fas fa-info-circle me-2"></i>No Deliverables Found</h6>
                      <p>This campaign has no active or completed influencers with deliverables yet.</p>
                      <p className="mb-0"><small>Deliverables are created when you accept influencer requests or complete campaign setup.</small></p>
                    </div>
                  ) : (
                    deliverablesData.items.map(item => (
                      <div key={item.collab_id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <img src={item.influencer?.profilePicUrl || '/images/default-profile.jpg'} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                          <div style={{ fontWeight: 600 }}>{item.influencer?.name || item.influencer?.username || 'Influencer'}</div>
                          <div style={{ marginLeft: 'auto' }}>Progress: {item.progress || 0}%</div>
                        </div>
                        <DeliverablesSection
                          title=""
                          deliverables={item.deliverables}
                          deliverableErrors={deliverablesData.errors[item.collab_id] || {}}
                          onDeliverableChange={(_, field, value) => {}}
                          onRemoveDeliverable={(index) => handleRemoveDeliverable(item.collab_id, index)}
                          onAddDeliverable={() => handleAddDeliverable(item.collab_id)}
                          onItemFieldChange={(index, field, value) => handleDeliverableChange(item.collab_id, index, field, value)}
                          mode="edit"
                        />
                        {/* Inline controls tied to this influencer's deliverables */}
                        <div className="d-flex gap-2 justify-content-end mt-2">
                          <button className="btn btn-outline-secondary" onClick={() => handleAddDeliverable(item.collab_id)}>
                            Add Deliverable
                          </button>
                        </div>
                        {/* Custom field wiring below to edit the embedded list using our change handler */}
                        <div style={{ display: 'none' }}>{/* placeholder for future per-field wiring if needed */}</div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => {
                if (deliverablesModalInstanceRef.current) {
                  deliverablesModalInstanceRef.current.hide();
                } else {
                  setDeliverablesModalOpen(false);
                }
              }}>Close</button>
              <button className="btn btn-primary" onClick={handleSaveDeliverables} disabled={deliverablesData.loading}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

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
