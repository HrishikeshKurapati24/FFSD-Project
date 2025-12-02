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
                            <h2 className={styles.cardTitle}>Best Posts</h2>
                            <div className={styles.bestPosts}>
                                {bestPosts.length > 0 ? (
                                    bestPosts.map((post, index) => (
                                        <div key={index} className={styles.postCard}>
                                            <div className={styles.postDetails}>
                                                <div className={styles.postPlatform}>
                                                    <i className={`fab fa-${(post.platform || 'link').toLowerCase()}`} aria-hidden="true"></i>
                                                    {post.platform || 'Unknown Platform'}
                                                </div>
                                                <div className={styles.postStats}>
                                                    <span>
                                                        <i className="fas fa-heart" aria-hidden="true"></i>
                                                        {formatNumber(post.likes || 0)}
                                                    </span>
                                                    <span>
                                                        <i className="fas fa-comment" aria-hidden="true"></i>
                                                        {formatNumber(post.comments || 0)}
                                                    </span>
                                                    {post.views && (
                                                        <span>
                                                            <i className="fas fa-eye" aria-hidden="true"></i>
                                                            {formatNumber(post.views || 0)}
                                                        </span>
                                                    )}
                                                </div>
                                                {post.url && (
                                                    <a
                                                        href={post.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={styles.postLink}
                                                    >
                                                        View Post
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>No best posts available</p>
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

                            <div className={styles.performanceMetrics}>
                                <h3>Performance Metrics</h3>
                                <div className={styles.metricGrid}>
                                    <div className={styles.metricCard}>
                                        <div className={styles.metricValue}>
                                            {formatNumber(performanceMetrics.reach || 0)}
                                        </div>
                                        <div className={styles.metricLabel}>Reach</div>
                                    </div>
                                    <div className={styles.metricCard}>
                                        <div className={styles.metricValue}>
                                            {formatNumber(performanceMetrics.impressions || 0)}
                                        </div>
                                        <div className={styles.metricLabel}>Impressions</div>
                                    </div>
                                    <div className={styles.metricCard}>
                                        <div className={styles.metricValue}>
                                            {formatNumber(performanceMetrics.engagement || 0)}
                                        </div>
                                        <div className={styles.metricLabel}>Engagement</div>
                                    </div>
                                    <div className={styles.metricCard}>
                                        <div className={styles.metricValue}>
                                            {formatDecimal(performanceMetrics.conversionRate || 0)}%
                                        </div>
                                        <div className={styles.metricLabel}>Conversion Rate</div>
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

