import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '../../styles/influencer/brand_profile.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import InfluencerNavigation from '../../components/influencer/InfluencerNavigation';
import BrandProfileHeader from '../../components/influencer/brandProfile/BrandProfileHeader';

import BrandInfoPanel from '../../components/influencer/brandProfile/BrandInfoPanel';

const EXTERNAL_ASSETS = {
    styles: ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'],
    scripts: []
};

const formatNumber = (value) => {
    if (value === null || value === undefined) {
        return '0';
    }
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return Number(value).toLocaleString();
};

const sanitizeWebsite = (url = '') => url.replace(/^https?:\/\//i, '').replace(/\/$/, '');

const formatDecimal = (value, digits = 1) => Number(value ?? 0).toFixed(digits);



const BrandProfileView = () => {
    useExternalAssets(EXTERNAL_ASSETS);
    const { id } = useParams();
    const navigate = useNavigate();
    const [brand, setBrand] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBrandProfile = useCallback(async () => {
        if (!id) {
            setError('Brand ID is missing.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/influencer/brand_profile/${id}`, {
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
                throw new Error('Failed to load brand profile.');
            }

            const data = await response.json();
            if (data.success) {
                setBrand(data.brand || null);
            } else {
                setError(data.message || 'Unable to load brand profile.');
            }
        } catch (err) {
            console.error('Error fetching brand profile:', err);
            setError('Something went wrong while loading the brand profile.');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchBrandProfile();
    }, [fetchBrandProfile]);

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
            console.error('Error signing out:', signOutError);
        }
        window.location.href = '/signin';
    };

    const handleBack = useCallback(
        (event) => {
            event?.preventDefault();
            navigate('/influencer/explore', { replace: true });
        },
        [navigate]
    );

    const rootClassName = `${styles['brand-profile-page']} brand-profile-page`;

    if (loading) {
        return (
            <div className={rootClassName}>
                <div className="loading-state">Loading brand profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={rootClassName}>
                <div className="error-state">{error}</div>
            </div>
        );
    }

    if (!brand) {
        return (
            <div className={rootClassName}>
                <div className="error-state">Brand profile not found.</div>
            </div>
        );
    }

    const socials = Array.isArray(brand.socials) ? brand.socials : [];
    const bestPosts = Array.isArray(brand.bestPosts) ? brand.bestPosts : [];
    const previousCollaborations = Array.isArray(brand.previousCollaborations) ? brand.previousCollaborations : [];
    const currentPartnerships = Array.isArray(brand.currentPartnerships) ? brand.currentPartnerships : [];
    const categories = Array.isArray(brand.categories) ? brand.categories : [];
    const languages = Array.isArray(brand.languages) ? brand.languages : [];
    const performanceMetrics = brand.performanceMetrics || {};
    const audience = brand.audienceDemographics || {};

    return (
        <div className={rootClassName}>
            <InfluencerNavigation onSignOut={handleSignOut} />

            <BrandProfileHeader
                brand={brand}
                formatNumber={formatNumber}
                formatDecimal={formatDecimal}
                onBack={handleBack}
            />

            <section className="profile-content">
                <div className="profile-details">
                    <div className="main-content">
                        <div className="detail-card">
                            <h2 className="card-title">Previous Collaborations</h2>
                            <div className="collaboration-list">
                                {previousCollaborations.length > 0 ? (
                                    previousCollaborations.map((collab, index) => (
                                        <div key={index} className="collab-card">
                                            <div className="collab-header">
                                                <h3 className="collab-title">{collab.title}</h3>
                                                <span className="collab-brand"></span>
                                                <span className="completion-date">
                                                    Ended: {collab.end_date ? new Date(collab.end_date).toLocaleDateString() : 'Unknown'}
                                                </span>
                                            </div>
                                            <div className="collab-metrics-grid">
                                                <div className="collab-metric">
                                                    <span className="metric-value">{formatDecimal(collab.roi)}%</span>
                                                    <span className="metric-label">ROI</span>
                                                </div>
                                                <div className="collab-metric">
                                                    <span className="metric-value">{formatNumber(collab.budget)}</span>
                                                    <span className="metric-label">Budget</span>
                                                </div>
                                                <div className="collab-metric">
                                                    <span className="metric-value">{collab.influencersCount || 0}</span>
                                                    <span className="metric-label">Influencers</span>
                                                </div>
                                            </div>
                                            {collab.influencers && collab.influencers.length > 0 && (
                                                <div className="influencers-section">
                                                    {collab.influencers.map((influencer, idx) => (
                                                        <div key={idx} className="influencer-details">
                                                            <div className="partnership-row">
                                                                <span className="detail-label">Influencer:</span>
                                                                <div className="influencer-info-compact">
                                                                    <img
                                                                        src={influencer.profilePicUrl || '/images/default-avatar.jpg'}
                                                                        alt={influencer.name}
                                                                        className="influencer-avatar-small"
                                                                    />
                                                                    <span className="influencer-name">
                                                                        {influencer.name}
                                                                        {influencer.verified && <span className="verified-badge">✓</span>}
                                                                        {influencer.username && <span className="influencer-username"> @{influencer.username}</span>}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="collab-metrics-grid">
                                                                <div className="collab-metric">
                                                                    <span className="metric-value">{influencer.performance_score || 0}</span>
                                                                    <span className="metric-label">Performance Score</span>
                                                                </div>
                                                                <div className="collab-metric">
                                                                    <span className="metric-value">{formatDecimal(influencer.engagement_rate)}%</span>
                                                                    <span className="metric-label">Engagement Rate</span>
                                                                </div>
                                                                <div className="collab-metric">
                                                                    <span className="metric-value">{formatNumber(influencer.reach)}</span>
                                                                    <span className="metric-label">Reach</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="empty-state">No previous collaborations found.</p>
                                )}
                            </div>
                        </div>

                        <div className="detail-card" style={{ marginTop: '2rem' }}>
                            <h2 className="card-title">Current Partnerships</h2>
                            <div className="partnership-list">
                                {currentPartnerships.length > 0 ? (
                                    currentPartnerships.map((collab, index) => (
                                        <div key={index} className="partnership-card">
                                            <div className="partnership-header">
                                                <h3 className="partnership-title">{collab.title}</h3>
                                                <span className="partnership-brand"></span>
                                            </div>
                                            <div className="partnership-details">
                                                <div className="partnership-row">
                                                    <span className="detail-label" style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>Started:</span>
                                                    <span className="detail-value">
                                                        {collab.start_date ? new Date(collab.start_date).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="partnership-row">
                                                    <span className="detail-label" style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>Budget:</span>
                                                    <span className="detail-value">
                                                        {formatNumber(collab.budget)}
                                                    </span>
                                                </div>
                                                <div className="partnership-row">
                                                    <span className="detail-label" style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>Channels:</span>
                                                    <div className="channel-tags">
                                                        {collab.required_channels && collab.required_channels.map((channel, i) => (
                                                            <span key={i} className="channel-tag">{channel}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                {collab.products && collab.products.filter((product, index, self) =>
                                                    product.name && product.name.trim() !== '' &&
                                                    product.category && product.category.trim() !== '' &&
                                                    product.category !== '()' &&
                                                    index === self.findIndex(p => p.name === product.name && p.category === product.category)
                                                ).length > 0 ? (
                                                    collab.products.filter((product, index, self) =>
                                                        product.name && product.name.trim() !== '' &&
                                                        product.category && product.category.trim() !== '' &&
                                                        product.category !== '()' &&
                                                        index === self.findIndex(p => p.name === product.name && p.category === product.category)
                                                    ).map((product, i) => (
                                                        <div key={i}>
                                                            <div className="partnership-row">
                                                                <span className="detail-label">Product:</span>
                                                                <span className="detail-value">{product.name} ({product.category})</span>
                                                            </div>
                                                            {product.description && (
                                                                <div className="partnership-row">
                                                                    <span className="detail-label">Description:</span>
                                                                    <span className="detail-value">{product.description}</span>
                                                                </div>
                                                            )}
                                                            {(product.campaignPrice || product.originalPrice) && (
                                                                <div className="partnership-row">
                                                                    <span className="detail-label">Pricing:</span>
                                                                    <span className="detail-value">
                                                                        {product.campaignPrice && product.campaignPrice > 0 ? (
                                                                            <>
                                                                                <span className="campaign-price">${formatNumber(product.campaignPrice)}</span>
                                                                                {product.originalPrice && product.originalPrice > product.campaignPrice && (
                                                                                    <span className="original-price"> (${formatNumber(product.originalPrice)})</span>
                                                                                )}
                                                                            </>
                                                                        ) : product.originalPrice ? (
                                                                            <span className="original-price">${formatNumber(product.originalPrice)}</span>
                                                                        ) : null}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {product.tags && product.tags.length > 0 && (
                                                                <div className="partnership-row">
                                                                    <span className="detail-label">Tags:</span>
                                                                    <div className="product-tags">
                                                                        {product.tags.map((tag, tagIndex) => (
                                                                            <span key={tagIndex} className="product-tag-badge">
                                                                                {tag}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="partnership-row">
                                                        <span className="detail-label" style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>Products:</span>
                                                        <span className="detail-value">No products listed</span>
                                                    </div>
                                                )}
                                            </div>
                                            {collab.influencers && collab.influencers.length > 0 && (
                                                <div className="influencers-section">
                                                    {collab.influencers.map((influencer, idx) => (
                                                        <div key={idx} className="influencer-details">
                                                            <div className="partnership-row">
                                                                <span className="detail-label" style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>Influencer:</span>
                                                                <div className="influencer-info-compact">
                                                                    <img
                                                                        src={influencer.profilePicUrl || '/images/default-avatar.jpg'}
                                                                        alt={influencer.name}
                                                                        className="influencer-avatar-small"
                                                                    />
                                                                    <span className="influencer-name">
                                                                        {influencer.name}
                                                                        {influencer.verified && <span className="verified-badge">✓</span>}
                                                                        {influencer.username && <span className="influencer-username"> @{influencer.username}</span>}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="collab-metrics-grid">
                                                                <div className="collab-metric">
                                                                    <span className="metric-value">{formatDecimal(influencer.progress)}%</span>
                                                                    <span className="metric-label">Progress</span>
                                                                </div>
                                                                <div className="collab-metric">
                                                                    <span className="metric-value">{influencer.status}</span>
                                                                    <span className="metric-label">Status</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="empty-state">No active partnerships.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="side-content">
                        <BrandInfoPanel
                            brand={brand}
                            audience={audience}
                            performanceMetrics={performanceMetrics}
                            categories={categories}
                            languages={languages}
                            sanitizeWebsite={sanitizeWebsite}
                            formatNumber={formatNumber}
                            formatDecimal={formatDecimal}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default BrandProfileView;