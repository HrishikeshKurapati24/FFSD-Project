import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import styles from '../../styles/influencer_brand_profile.module.css';
import { API_BASE_URL } from '../../services/api';

const BrandProfileView = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [brand, setBrand] = useState(null);

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
                    fetchBrandProfile();
                } else {
                    navigate('/signin');
                }
            } catch (error) {
                console.error('Auth verification error:', error);
                navigate('/signin');
            }
        };

        verifyAuth();
    }, [navigate, id]);

    // Fetch brand profile
    const fetchBrandProfile = async () => {
        try {
            setLoading(true);
            // Try both routes
            let response = await fetch(`${API_BASE_URL}/influencer/brand_profile/${id}`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.status === 404) {
                // Try alternative route
                response = await fetch(`${API_BASE_URL}/influencer/I_brand_profile/${id}`, {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
            }

            if (response.status === 401) {
                navigate('/signin');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch brand profile');
            }

            const data = await response.json();
            if (data.success) {
                setBrand(data.brand);
            }
        } catch (error) {
            console.error('Error fetching brand profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = (e) => {
        e.preventDefault();
        navigate(-1);
    };

    if (loading) {
        return (
            <div className={styles['brand-profile-page']}>
                <div style={{ padding: '20px', textAlign: 'center' }}>Loading brand profile...</div>
            </div>
        );
    }

    if (!brand) {
        return (
            <div className={styles['brand-profile-page']}>
                <div style={{ padding: '20px', textAlign: 'center' }}>Brand profile not found</div>
            </div>
        );
    }

    return (
        <div className={styles['brand-profile-page']}>
            <div className={styles['profile-header']}>
                <div className={styles['profile-content']}>
                    <a href="#" className={styles['back-button']} onClick={handleBack} aria-label="Go back to explore brands">
                        <i className="fas fa-arrow-left"></i> Go Back
                    </a>
                    <div className={styles['profile-header-content']}>
                        <img 
                            src={brand.profilePicUrl || '/images/default-avatar.jpg'} 
                            alt={brand.displayName || brand.fullName || 'Brand'} 
                            className={styles['profile-pic']}
                        />
                        <div className={styles['profile-info']}>
                            <h1 className={styles['profile-name']}>
                                {brand.displayName || brand.fullName || 'Unknown Brand'}
                                {brand.verified && (
                                    <i className={`fas fa-check-circle ${styles['verified-badge']}`}></i>
                                )}
                            </h1>
                            <p className={styles['profile-username']}>@{brand.username || 'unknown'}</p>
                            <p className={styles['profile-bio']}>
                                {brand.bio || 'No description available'}
                            </p>
                            <div className={styles['profile-stats']}>
                                <div className={styles['stat-item']}>
                                    <div className={styles['stat-value']}>
                                        {(brand.totalFollowers || 0).toLocaleString()}
                                    </div>
                                    <div className={styles['stat-label']}>Total Audience</div>
                                </div>
                                <div className={styles['stat-item']}>
                                    <div className={styles['stat-value']}>
                                        {(brand.avgEngagementRate || 0).toFixed(1)}%
                                    </div>
                                    <div className={styles['stat-label']}>Avg. Engagement</div>
                                </div>
                                <div className={styles['stat-item']}>
                                    <div className={styles['stat-value']}>
                                        {brand.completedCollabs || 0}
                                    </div>
                                    <div className={styles['stat-label']}>Campaigns</div>
                                </div>
                                <div className={styles['stat-item']}>
                                    <div className={styles['stat-value']}>
                                        {(brand.rating || 0).toFixed(1)}⭐
                                    </div>
                                    <div className={styles['stat-label']}>Rating</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles['profile-content']}>
                <div className={styles['profile-details']}>
                    <div className={styles['main-content']}>
                        <div className={styles['detail-card']}>
                            <h2 className={styles['card-title']}>Social Media Platforms</h2>
                            <div className={styles['social-platforms']}>
                                {brand.socials && brand.socials.length > 0 ? (
                                    brand.socials.map((social, idx) => (
                                        <div key={idx} className={styles['platform-card']}>
                                            <div className={styles['platform-header']}>
                                                <div className={`${styles['platform-icon']} ${styles[`${(social.platform || 'default').toLowerCase()}-bg`]}`}>
                                                    <i className={`fab fa-${social.icon || 'link'}`}></i>
                                                </div>
                                                <div className={styles['platform-name']}>
                                                    {social.name || social.platform || 'Unknown Platform'}
                                                </div>
                                            </div>
                                            <div className={styles['platform-stats']}>
                                                <div className={styles['stat-box']}>
                                                    <div className={styles['stat-box-value']}>
                                                        {(social.followers || 0).toLocaleString()}
                                                    </div>
                                                    <div className={styles['stat-box-label']}>Followers</div>
                                                </div>
                                                <div className={styles['stat-box']}>
                                                    <div className={styles['stat-box-value']}>
                                                        {(social.avgLikes || 0).toLocaleString()}
                                                    </div>
                                                    <div className={styles['stat-box-label']}>Avg. Likes</div>
                                                </div>
                                                <div className={styles['stat-box']}>
                                                    <div className={styles['stat-box-value']}>
                                                        {(social.avgComments || 0).toLocaleString()}
                                                    </div>
                                                    <div className={styles['stat-box-label']}>Avg. Comments</div>
                                                </div>
                                                <div className={styles['stat-box']}>
                                                    <div className={styles['stat-box-value']}>
                                                        {(social.avgViews || 0).toLocaleString()}
                                                    </div>
                                                    <div className={styles['stat-box-label']}>Avg. Views</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>No social media platforms connected</p>
                                )}
                            </div>
                        </div>

                        <div className={styles['detail-card']}>
                            <h2 className={styles['card-title']}>Top Campaigns</h2>
                            <div className={styles['best-posts']}>
                                {brand.bestPosts && brand.bestPosts.length > 0 ? (
                                    brand.bestPosts.map((post, idx) => (
                                        <div key={idx} className={styles['post-card']}>
                                            <img 
                                                src={post.thumbnail || '/images/default-campaign.jpg'}
                                                alt="Campaign thumbnail" 
                                                className={styles['post-image']}
                                            />
                                            <div className={styles['post-details']}>
                                                <div className={styles['post-platform']}>
                                                    <i className={`fab fa-${(post.platform || 'link').toLowerCase()}`}></i>
                                                    {post.title}
                                                </div>
                                                <div className={styles['post-stats']}>
                                                    <span>
                                                        <i className="fas fa-heart"></i>
                                                        {(post.likes || 0).toLocaleString()}
                                                    </span>
                                                    <span>
                                                        <i className="fas fa-comment"></i>
                                                        {(post.comments || 0).toLocaleString()}
                                                    </span>
                                                    {post.views && (
                                                        <span>
                                                            <i className="fas fa-eye"></i>
                                                            {(post.views || 0).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>No campaigns available to display</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles['side-content']}>
                        <div className={styles['detail-card']}>
                            <h2 className={styles['card-title']}>Brand Information</h2>
                            <div className={styles['brand-info-section']}>
                                {brand.location && (
                                    <div className={styles['info-item']}>
                                        <div className={styles['info-icon']}>
                                            <i className="fas fa-map-marker-alt"></i>
                                        </div>
                                        <div className={styles['info-content']}>
                                            <div className={styles['info-label']}>Location</div>
                                            <div className={styles['info-value']}>{brand.location}</div>
                                        </div>
                                    </div>
                                )}

                                {brand.website && (
                                    <div className={styles['info-item']}>
                                        <div className={styles['info-icon']}>
                                            <i className="fas fa-globe"></i>
                                        </div>
                                        <div className={styles['info-content']}>
                                            <div className={styles['info-label']}>Website</div>
                                            <div className={styles['info-value']}>
                                                <a 
                                                    href={brand.website} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className={styles['website-link']}
                                                >
                                                    {brand.website.replace(/^https?:\/\//, '')}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {brand.mission && brand.mission !== brand.bio && (
                                    <div className={styles['info-item']}>
                                        <div className={styles['info-icon']}>
                                            <i className="fas fa-bullseye"></i>
                                        </div>
                                        <div className={styles['info-content']}>
                                            <div className={styles['info-label']}>Mission</div>
                                            <div className={styles['info-value']}>{brand.mission}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles['audience-section']}>
                                <h3>Target Audience</h3>
                                <div className={styles['audience-stats']}>
                                    <div className={styles['audience-stat']}>
                                        <div className={styles['audience-stat-value']}>
                                            {brand.audienceDemographics?.gender || 'Mixed'}
                                        </div>
                                        <div className={styles['audience-stat-label']}>Primary Gender</div>
                                    </div>
                                    <div className={styles['audience-stat']}>
                                        <div className={styles['audience-stat-value']}>
                                            {brand.audienceDemographics?.ageRange || '18-45'}
                                        </div>
                                        <div className={styles['audience-stat-label']}>Age Range</div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles['performance-metrics']}>
                                <h3>Performance Metrics</h3>
                                <div className={styles['metric-grid']}>
                                    <div className={styles['metric-card']}>
                                        <div className={styles['metric-value']}>
                                            {(brand.performanceMetrics?.reach || 0).toLocaleString()}
                                        </div>
                                        <div className={styles['metric-label']}>Reach</div>
                                    </div>
                                    <div className={styles['metric-card']}>
                                        <div className={styles['metric-value']}>
                                            {(brand.performanceMetrics?.impressions || 0).toLocaleString()}
                                        </div>
                                        <div className={styles['metric-label']}>Impressions</div>
                                    </div>
                                    <div className={styles['metric-card']}>
                                        <div className={styles['metric-value']}>
                                            {(brand.performanceMetrics?.engagement || 0).toLocaleString()}
                                        </div>
                                        <div className={styles['metric-label']}>Engagement</div>
                                    </div>
                                    <div className={styles['metric-card']}>
                                        <div className={styles['metric-value']}>
                                            {(brand.performanceMetrics?.conversionRate || 0).toFixed(1)}%
                                        </div>
                                        <div className={styles['metric-label']}>Conversion Rate</div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles['categories-section']}>
                                <h3>Brand Categories</h3>
                                <div className={styles['category-tags']}>
                                    {brand.categories && brand.categories.length > 0 ? (
                                        brand.categories.map((category, idx) => (
                                            <span key={idx} className={styles['category-tag']}>
                                                {category}
                                            </span>
                                        ))
                                    ) : (
                                        <p>No categories specified</p>
                                    )}
                                </div>
                            </div>

                            <div className={styles['languages-section']}>
                                <h3>Languages</h3>
                                <div className={styles['language-tags']}>
                                    {brand.languages && brand.languages.length > 0 ? (
                                        brand.languages.map((language, idx) => (
                                            <span key={idx} className={styles['language-tag']}>
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

export default BrandProfileView;
