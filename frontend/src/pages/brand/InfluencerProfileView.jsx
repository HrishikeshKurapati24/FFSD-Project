import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '../../styles/brand/influencer_details.module.css';
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

const formatDecimal = (value, digits = 1) => Number(value ?? 0).toFixed(digits);

const getPlatformBackground = (platform = '') => {
    const normalized = platform.toLowerCase();
    return normalized ? `${normalized}-bg` : 'default-bg';
};

const InfluencerProfileView = () => {
    useExternalAssets(EXTERNAL_ASSETS);
    const { influencerId } = useParams();
    const navigate = useNavigate();
    const [influencer, setInfluencer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchInfluencerProfile = useCallback(async () => {
        if (!influencerId) {
            setError('Influencer ID is missing.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/brand/influencer_profile/${influencerId}`, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.status === 401) {
                navigate('/signin');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to load influencer profile.');
            }

            const data = await response.json();
            if (data.success) {
                setInfluencer(data.influencer || null);
            } else {
                setError(data.message || 'Unable to load influencer profile.');
            }
        } catch (err) {
            console.error('Error fetching influencer profile:', err);
            setError('Something went wrong while loading the influencer profile.');
        } finally {
            setLoading(false);
        }
    }, [influencerId, navigate]);

    useEffect(() => {
        fetchInfluencerProfile();
    }, [fetchInfluencerProfile]);

    const handleSignOut = async (event) => {
        event?.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/brand/signout`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = '/signin';
            } else {
                window.location.href = '/signin';
            }
        } catch (signOutError) {
            console.error('Error signing out:', signOutError);
            window.location.href = '/signin';
        }
    };

    const handleBack = useCallback(
        (event) => {
            event?.preventDefault();
            navigate('/brand/explore', { replace: true });
        },
        [navigate]
    );

    if (loading) {
        return (
            <div className={styles.influencerDetailsPage}>
                <BrandNavigation onSignOut={handleSignOut} />
                <div className={styles.loadingState}>Loading influencer profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.influencerDetailsPage}>
                <BrandNavigation onSignOut={handleSignOut} />
                <div className={styles.errorState}>{error}</div>
            </div>
        );
    }

    if (!influencer) {
        return (
            <div className={styles.influencerDetailsPage}>
                <BrandNavigation onSignOut={handleSignOut} />
                <div className={styles.errorState}>Influencer profile not found.</div>
            </div>
        );
    }

    const socials = Array.isArray(influencer.socials) ? influencer.socials : [];
    const bestPosts = Array.isArray(influencer.bestPosts) ? influencer.bestPosts : [];
    const categories = Array.isArray(influencer.categories) ? influencer.categories : [];
    const languages = Array.isArray(influencer.languages) ? influencer.languages : [];
    const performanceMetrics = influencer.performanceMetrics || {};
    const audienceDemographics = influencer.audienceDemographics || {};

    return (
        <div className={styles.influencerDetailsPage}>
            <BrandNavigation onSignOut={handleSignOut} />

            <div className={styles.profileHeader}>
                <div className={styles.profileContent}>
                    <button
                        type="button"
                        className={styles.backButton}
                        onClick={handleBack}
                        aria-label="Go back to previous page"
                    >
                        <i className="fas fa-arrow-left" aria-hidden="true"></i> Go Back
                    </button>
                    <div className={styles.profileHeaderContent}>
                        <img
                            src={influencer.profilePicUrl || '/images/default-avatar.jpg'}
                            alt={influencer.displayName || influencer.fullName || 'Influencer'}
                            className={styles.profilePic}
                            onError={(e) => {
                                e.currentTarget.src = '/images/default-avatar.jpg';
                            }}
                        />
                        <div className={styles.profileInfo}>
                            <h1 className={styles.profileName}>
                                {influencer.displayName || influencer.fullName || 'Unknown Influencer'}
                                {influencer.verified && (
                                    <i className="fas fa-check-circle" style={{ color: '#1DA1F2', marginLeft: '8px' }} aria-label="Verified influencer"></i>
                                )}
                            </h1>
                            {influencer.username && <p className={styles.profileUsername}>@{influencer.username}</p>}
                            {influencer.bio && <p className={styles.profileBio}>{influencer.bio}</p>}
                            <div className={styles.profileStats}>
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>
                                        {formatNumber(influencer.totalFollowers || 0)}
                                    </div>
                                    <div className={styles.statLabel}>Total Followers</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>
                                        {formatDecimal(influencer.avgEngagementRate || 0)}%
                                    </div>
                                    <div className={styles.statLabel}>Avg. Engagement</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>
                                        {influencer.completedCollabs || 0}
                                    </div>
                                    <div className={styles.statLabel}>Completed Collabs</div>
                                </div>
                                <div className={styles.statItem}>
                                    <div className={styles.statValue}>
                                        {formatDecimal(influencer.rating || 0)}
                                    </div>
                                    <div className={styles.statLabel}>Rating</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.profileContent}>
                <div className={styles.profileDetails}>
                    <div className={styles.mainContent}>
                        <div className={styles.detailCard}>
                            <h2 className={styles.cardTitle}>Social Media Platforms</h2>
                            <div className={styles.socialPlatforms}>
                                {socials.length > 0 ? (
                                    socials.map((social, index) => (
                                        <div key={index} className={styles.platformCard}>
                                            <div className={styles.platformHeader}>
                                                <div className={`${styles.platformIcon} ${getPlatformBackground(social.platform)}`}>
                                                    <i className={`fab fa-${social.icon || 'link'}`} aria-hidden="true"></i>
                                                </div>
                                                <div className={styles.platformName}>
                                                    {social.name || social.platform || 'Unknown Platform'}
                                                </div>
                                            </div>
                                            <div className={styles.platformStats}>
                                                <div className={styles.statBox}>
                                                    <div className={styles.statBoxValue}>
                                                        {formatNumber(social.followers || 0)}
                                                    </div>
                                                    <div className={styles.statBoxLabel}>Followers</div>
                                                </div>
                                                <div className={styles.statBox}>
                                                    <div className={styles.statBoxValue}>
                                                        {formatNumber(social.avgLikes || 0)}
                                                    </div>
                                                    <div className={styles.statBoxLabel}>Avg. Likes</div>
                                                </div>
                                                <div className={styles.statBox}>
                                                    <div className={styles.statBoxValue}>
                                                        {formatNumber(social.avgComments || 0)}
                                                    </div>
                                                    <div className={styles.statBoxLabel}>Avg. Comments</div>
                                                </div>
                                                <div className={styles.statBox}>
                                                    <div className={styles.statBoxValue}>
                                                        {formatNumber(social.avgViews || 0)}
                                                    </div>
                                                    <div className={styles.statBoxLabel}>Avg. Views</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>No social media platforms connected</p>
                                )}
                            </div>
                        </div>

                        <div className={styles.detailCard}>
                            <h2 className={styles.cardTitle}>Current Partnerships</h2>
                            <div className={styles.partnershipList}>
                                {influencer.currentPartnerships && influencer.currentPartnerships.length > 0 ? (
                                    influencer.currentPartnerships.map((collab, index) => (
                                        <div key={index} className={styles.partnershipCard}>
                                            <div className={styles.partnershipHeader}>
                                                <h3 className={styles.partnershipTitle}>{collab.title}</h3>
                                                <span className={styles.partnershipBrand}>with {collab.brandName}</span>
                                            </div>
                                            <div className={styles.partnershipDetails}>
                                                <div className={styles.partnershipRow}>
                                                    <span className={styles.detailLabel}>Duration:</span>
                                                    <span className={styles.detailValue}>
                                                        {collab.startDate ? new Date(collab.startDate).toLocaleDateString() : 'N/A'} -
                                                        {collab.endDate ? new Date(collab.endDate).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className={styles.partnershipRow}>
                                                    <span className={styles.detailLabel}>Progress:</span>
                                                    <div className={styles.progressBarContainer}>
                                                        <div
                                                            className={styles.progressBar}
                                                            style={{ width: `${collab.progress || 0}%` }}
                                                            aria-valuenow={collab.progress || 0}
                                                            aria-valuemin="0"
                                                            aria-valuemax="100"
                                                        ></div>
                                                    </div>
                                                    <span className={styles.progressValue}>{collab.progress || 0}%</span>
                                                </div>
                                                <div className={styles.partnershipRow}>
                                                    <span className={styles.detailLabel}>Channels:</span>
                                                    <div className={styles.channelTags}>
                                                        {collab.channels && collab.channels.map((channel, i) => (
                                                            <span key={i} className={styles.channelTag}>{channel}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>No current partnerships</p>
                                )}
                            </div>
                        </div>

                        <div className={styles.detailCard}>
                            <h2 className={styles.cardTitle}>Past Collaborations</h2>
                            <div className={styles.collaborationList}>
                                {influencer.pastCollaborations && influencer.pastCollaborations.length > 0 ? (
                                    influencer.pastCollaborations.map((collab, index) => (
                                        <div key={index} className={styles.collabCard}>
                                            <div className={styles.collabHeader}>
                                                <h3 className={styles.collabTitle}>{collab.title}</h3>
                                                <span className={styles.collabBrand}>with {collab.brandName}</span>
                                                <span className={styles.completionDate}>
                                                    Completed: {collab.completionDate ? new Date(collab.completionDate).toLocaleDateString() : 'Unknown'}
                                                </span>
                                            </div>
                                            <div className={styles.collabMetricsGrid}>
                                                <div className={styles.collabMetric}>
                                                    <span className={styles.metricValue}>{formatDecimal(collab.engagementRate)}%</span>
                                                    <span className={styles.metricLabel}>Engagement</span>
                                                </div>
                                                <div className={styles.collabMetric}>
                                                    <span className={styles.metricValue}>{formatNumber(collab.reach)}</span>
                                                    <span className={styles.metricLabel}>Reach</span>
                                                </div>
                                                <div className={styles.collabMetric}>
                                                    <span className={styles.metricValue}>{formatNumber(collab.clicks)}</span>
                                                    <span className={styles.metricLabel}>Clicks</span>
                                                </div>
                                                <div className={styles.collabMetric}>
                                                    <span className={styles.metricValue}>{formatNumber(collab.conversions)}</span>
                                                    <span className={styles.metricLabel}>Conversions</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>No past collaborations</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.sideContent}>
                        <div className={styles.detailCard}>
                            <h2 className={styles.cardTitle}>Audience Demographics</h2>
                            <div className={styles.audienceSection}>
                                <div className={styles.audienceStats}>
                                    <div className={styles.audienceStat}>
                                        <div className={styles.audienceStatValue}>
                                            {audienceDemographics.gender || 'Not specified'}
                                        </div>
                                        <div className={styles.audienceStatLabel}>Primary Gender</div>
                                    </div>
                                    <div className={styles.audienceStat}>
                                        <div className={styles.audienceStatValue}>
                                            {audienceDemographics.ageRange || 'Not specified'}
                                        </div>
                                        <div className={styles.audienceStatLabel}>Age Range</div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.categoriesSection}>
                                <h3>Geographic Insights</h3>
                                <div className={styles.geographicInfo}>
                                    <div className={styles.geoItem}>
                                        <span className={styles.geoLabel}>Base Location</span>
                                        <span className={styles.geoValue}>
                                            <i className="fas fa-map-marker-alt" style={{ marginRight: '6px', color: '#ea4335' }}></i>
                                            {influencer.location || 'Not specified'}
                                        </span>
                                    </div>
                                    <div className={styles.geoItem}>
                                        <span className={styles.geoLabel}>Primary Market</span>
                                        <span className={styles.geoValue}>
                                            <i className="fas fa-globe" style={{ marginRight: '6px', color: '#4285f4' }}></i>
                                            {influencer.influenceRegions || 'Global'}
                                        </span>
                                    </div>
                                    <div className={styles.geoItem}>
                                        <span className={styles.geoLabel}>Top Audience Locations</span>
                                        <div className={styles.locationTags}>
                                            {audienceDemographics.topLocations && audienceDemographics.topLocations.length > 0 ? (
                                                audienceDemographics.topLocations.map((location, index) => (
                                                    <span key={index} className={styles.locationTag}>
                                                        {location}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className={styles.noData}>Global Audience</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.categoriesSection}>
                                <h3>Categories</h3>
                                <div className={styles.categoryTags}>
                                    {categories.length > 0 ? (
                                        categories.map((category, index) => (
                                            <span key={index} className={styles.categoryTag}>
                                                {category}
                                            </span>
                                        ))
                                    ) : (
                                        <p>No categories specified</p>
                                    )}
                                </div>
                            </div>

                            <div className={styles.languagesSection}>
                                <h3>Languages</h3>
                                <div className={styles.languageTags}>
                                    {languages.length > 0 ? (
                                        languages.map((language, index) => (
                                            <span key={index} className={styles.languageTag}>
                                                {language}
                                            </span>
                                        ))
                                    ) : (
                                        <p>No languages specified</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfluencerProfileView;

