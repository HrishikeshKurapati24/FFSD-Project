import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../../styles/brand/campaign_history.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import BrandNavigation from '../../components/brand/BrandNavigation';
import CampaignDetailsModal from '../../components/brand/dashboard/CampaignDetailsModal';
import { viewCampaignDetails } from '../../utils/BrandDashboard';

const EXTERNAL_ASSETS = {
    styles: [
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css'
    ],
    scripts: [
        'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js'
    ]
};

const CampaignHistory = () => {
    useExternalAssets(EXTERNAL_ASSETS);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [detailsModalData, setDetailsModalData] = useState({ loading: false, details: null });
    const detailsModalRef = React.useRef(null);
    const detailsModalInstanceRef = React.useRef(null);

    // Fetch campaign history
    const fetchCampaignHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/brand/campaigns/history`, {
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
                throw new Error('Failed to load campaign history');
            }

            const data = await response.json();
            if (data.success && data.campaigns) {
                setCampaigns(data.campaigns.map(campaign => ({
                    ...campaign,
                    performance_score: campaign.performance_score || 0,
                    engagement_rate: campaign.engagement_rate || 0,
                    reach: campaign.reach || 0,
                    conversion_rate: campaign.conversion_rate || 0,
                    influencers_count: campaign.influencers?.length || 0,
                    budget: campaign.budget || 0,
                    end_date: campaign.end_date,
                    status: campaign.status,
                    title: campaign.title,
                    description: campaign.description,
                    influencers: campaign.influencers || []
                })));
            } else if (data.campaigns) {
                // Handle case where campaigns array is directly in response
                setCampaigns(data.campaigns.map(campaign => ({
                    ...campaign,
                    performance_score: campaign.performance_score || 0,
                    engagement_rate: campaign.engagement_rate || 0,
                    reach: campaign.reach || 0,
                    conversion_rate: campaign.conversion_rate || 0,
                    influencers_count: campaign.influencers?.length || 0,
                    budget: campaign.budget || 0,
                    end_date: campaign.end_date,
                    status: campaign.status,
                    title: campaign.title,
                    description: campaign.description,
                    influencers: campaign.influencers || []
                })));
            }
        } catch (err) {
            console.error('Error fetching campaign history:', err);
            setError(err.message || 'Failed to load campaign history');
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch on mount
    useEffect(() => {
        fetchCampaignHistory();

        // Initialize Bootstrap modal
        const initModal = () => {
            if (typeof window !== 'undefined' && window.bootstrap && window.bootstrap.Modal) {
                if (detailsModalRef.current && !detailsModalInstanceRef.current) {
                    detailsModalInstanceRef.current = new window.bootstrap.Modal(detailsModalRef.current);
                }
            }
        };

        initModal();
        const checkBootstrap = setInterval(() => {
            if (window.bootstrap) {
                clearInterval(checkBootstrap);
                initModal();
            }
        }, 100);
        setTimeout(() => clearInterval(checkBootstrap), 5000);

        return () => {
            if (detailsModalInstanceRef.current) detailsModalInstanceRef.current.dispose();
        };
    }, []);

    const handleViewDetails = async (campaignId) => {
        setDetailsModalOpen(true);
        setDetailsModalData({ loading: true, details: null });
        if (detailsModalInstanceRef.current) detailsModalInstanceRef.current.show();

        try {
            const details = await viewCampaignDetails(campaignId);
            setDetailsModalData({ loading: false, details });
        } catch (err) {
            console.error('Error loading details:', err);
            setDetailsModalData({ loading: false, details: null });
        }
    };

    const handleCloseModal = () => {
        setDetailsModalOpen(false);
        if (detailsModalInstanceRef.current) detailsModalInstanceRef.current.hide();
    };

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

    if (loading) {
        return (
            <div className={styles.campaignHistoryPageWrapper}>
                <div className="loadingMessage">Loading campaign history...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.campaignHistoryPageWrapper}>
                <div className="errorMessage">{error}</div>
            </div>
        );
    }

    return (
        <div className={styles.campaignHistoryPageWrapper}>
            <BrandNavigation onSignOut={handleSignOut} />

            {/* Main Content */}
            <div className={styles.container}>
                <div className={styles.campaignsHeader}>
                    <h1>Campaign History</h1>
                    <p>View and analyze your past campaign performances</p>
                </div>

                {/* Campaigns Grid */}
                <div className={styles.campaignsGrid}>
                    {campaigns && campaigns.length > 0 ? (
                        campaigns.map((campaign, index) => (
                            <div key={campaign._id || campaign.id || index} className={styles.campaignCard}>
                                <span className={`${styles.campaignStatus} ${styles.statusCompleted}`}>
                                    {campaign.status || 'completed'}
                                </span>
                                <h3>{campaign.title || 'Untitled Campaign'}</h3>
                                <p>{campaign.description || 'No description available'}</p>

                                <div className={styles.campaignMetrics}>
                                    <div className={styles.metric}>
                                        <span className={styles.metricValue}>
                                            {(campaign.performance_score || 0).toFixed(1)}
                                        </span>
                                        <span className={styles.metricLabel}>Performance</span>
                                    </div>
                                    <div className={styles.metric}>
                                        <span className={styles.metricValue}>
                                            {(campaign.engagement_rate || 0).toFixed(1)}%
                                        </span>
                                        <span className={styles.metricLabel}>Engagement</span>
                                    </div>
                                    <div className={styles.metric}>
                                        <span className={styles.metricValue}>
                                            {(campaign.reach || 0).toLocaleString()}
                                        </span>
                                        <span className={styles.metricLabel}>Reach</span>
                                    </div>
                                </div>

                                <div className={styles.campaignDetails}>
                                    <div className={styles.detailItem}>
                                        <i className="far fa-calendar"></i>
                                        <span>Ended {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <i className="fas fa-users"></i>
                                        <span>{campaign.influencers_count || 0} influencers</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <i className="fas fa-tag"></i>
                                        <span>{(campaign.budget || 0).toLocaleString()} budget</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <i className="fas fa-chart-line"></i>
                                        <span>{(campaign.conversion_rate || 0).toFixed(1)}% conversion</span>
                                    </div>
                                </div>

                                {campaign.influencers && campaign.influencers.length > 0 && (
                                    <div className={styles.campaignInfluencers}>
                                        <h4>Influencers</h4>
                                        <div className={styles.influencerList}>
                                            {campaign.influencers.map((influencer, idx) => {
                                                const influencerImage = influencer.profilePicUrl || '/images/default-avatar.jpg';
                                                const fullImageUrl = influencerImage.startsWith('http')
                                                    ? influencerImage
                                                    : `${API_BASE_URL}${influencerImage}`;

                                                return (
                                                    <Link
                                                        key={influencer.id || influencer._id || idx}
                                                        to={`/brand/influencer_details/${influencer.id || influencer._id}`}
                                                        className={styles.influencerTag}
                                                    >
                                                        <img
                                                            src={fullImageUrl}
                                                            alt={influencer.name || 'Influencer'}
                                                            onError={(e) => { e.target.src = '/images/default-avatar.jpg'; }}
                                                        />

                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {campaign.products && campaign.products.length > 0 && (
                                    <div className={styles.campaignProducts} style={{ marginTop: '15px' }}>
                                        <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#666' }}>Associated Products</h4>
                                        <div className="d-flex flex-wrap gap-2">
                                            {campaign.products.map(product => (
                                                <div key={product._id} className="d-flex align-items-center p-1 px-2 border rounded-pill bg-light" style={{ fontSize: '0.8rem' }}>
                                                    <img
                                                        src={product.images?.[0]?.url || '/images/default-product.png'}
                                                        alt={product.name}
                                                        style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '6px', objectFit: 'cover' }}
                                                    />
                                                    <span className="text-truncate" style={{ maxWidth: '100px' }}>{product.name}</span>
                                                    <span className="ms-1 fw-bold text-primary">${product.campaign_price}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-3">
                                    <button
                                        className="btn btn-outline-primary btn-sm w-100"
                                        onClick={() => handleViewDetails(campaign._id || campaign.id)}
                                    >
                                        View Full Details
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.noCampaigns}>
                            <i className="fas fa-history"></i>
                            <h3>No Campaign History</h3>
                            <p>You haven't completed any campaigns yet.</p>
                        </div>
                    )}
                </div>
            </div>

            <CampaignDetailsModal
                modalRef={detailsModalRef}
                modalInstanceRef={detailsModalInstanceRef}
                isOpen={detailsModalOpen}
                details={detailsModalData.details}
                loading={detailsModalData.loading}
                onClose={handleCloseModal}
            />
        </div>
    );
};

export default CampaignHistory;
