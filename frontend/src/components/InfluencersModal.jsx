import React, { useState, useEffect } from 'react';
import { useInfluencers } from '../hooks/useInfluencers';
import styles from '../styles/landing/modal.module.css';

const InfluencersModal = ({ isOpen, onClose }) => {
    const { influencers, loading, error, fetchInfluencers } = useInfluencers();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchInfluencers();
        }
    }, [isOpen]);

    const filteredInfluencers = influencers.filter(influencer =>
        influencer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        influencer.niche.toLowerCase().includes(searchTerm.toLowerCase()) ||
        influencer.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!isOpen) {
        return null;
    }

    return (
        <div className={styles.modal} onClick={onClose}>
            <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
                <div className={styles['modal-header']}>
                    <h2>All Registered Influencers</h2>
                    <span className={styles.close} onClick={onClose}>&times;</span>
                </div>
                <div className={styles['modal-body']}>
                    <div className={styles['search-container']}>
                        <input
                            type="text"
                            placeholder="Search influencers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles['search-input']}
                        />
                    </div>
                    <div className={styles['grid-container']}>
                        {loading && (
                            <div className={styles.loading}>
                                <i className="fas fa-spinner fa-spin"></i> Loading influencers...
                            </div>
                        )}
                        {error && (
                            <div className={`${styles['text-center']} ${styles['py-4']}`}>
                                <p>Error loading influencers. Please try again.</p>
                            </div>
                        )}
                        {!loading && !error && filteredInfluencers.length === 0 && (
                            <div className={`${styles['text-center']} ${styles['py-4']}`}>
                                <p>No influencers found.</p>
                            </div>
                        )}
                        {filteredInfluencers.map(influencer => (
                            <InfluencerCard key={influencer._id} influencer={influencer} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfluencerCard = ({ influencer }) => {
    const platformIcons = {
        'instagram': 'fab fa-instagram',
        'youtube': 'fab fa-youtube',
        'tiktok': 'fab fa-tiktok',
        'facebook': 'fab fa-facebook',
        'twitter': 'fab fa-twitter',
        'linkedin': 'fab fa-linkedin'
    };

    const socialPlatforms = influencer.socialPlatforms || [];

    return (
        <div className={styles['influencer-card']}>
            <div className={styles['influencer-header']}>
                <img
                    src={influencer.profilePicUrl || '/images/default-avatar.jpg'}
                    alt={influencer.fullName}
                    className={styles['influencer-avatar']}
                    onError={(e) => {
                        e.currentTarget.src = '/images/default-avatar.jpg';
                    }}
                />
                <div className={styles['influencer-info']}>
                    <h3 className={styles['influencer-name']}>{influencer.fullName}</h3>
                    <p className={styles['influencer-niche']}>{influencer.niche || 'General'}</p>
                </div>
            </div>

            <div className={styles['stats-grid']}>
                <div className={styles['stat-item']}>
                    <span className={styles['stat-number']}>{influencer.totalFollowers.toLocaleString()}</span>
                    <div className={styles['stat-label']}>Total Followers</div>
                </div>
                <div className={styles['stat-item']}>
                    <span className={styles['stat-number']}>{influencer.completedCollabs}</span>
                    <div className={styles['stat-label']}>Completed Collaborations</div>
                </div>
                <div className={styles['stat-item']}>
                    <span className={styles['stat-number']}>{influencer.avgRating.toFixed(1)}</span>
                    <div className={styles['stat-label']}>Rating</div>
                </div>
                <div className={styles['stat-item']}>
                    <span className={styles['stat-number']}>{influencer.avgEngagementRate.toFixed(1)}%</span>
                    <div className={styles['stat-label']}>Engagement</div>
                </div>
            </div>

            <div className={styles.categories}>
                <strong>Categories:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                    {influencer.categories.map(cat => (
                        <span key={cat} className={styles['category-tag']}>{cat}</span>
                    ))}
                </div>
            </div>

            {socialPlatforms.length > 0 && (
                <div className={styles.categories}>
                    <strong>Social Platforms:</strong>
                    <div className={styles['social-platforms']}>
                        {socialPlatforms.map(platform => {
                            const platformClass = `platform-${platform}`;
                            return (
                                <div key={platform} className={`${styles['platform-icon']} ${styles[platformClass] || ''}`} title={platform}>
                                    <i className={platformIcons[platform] || 'fas fa-globe'}></i>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InfluencersModal;
