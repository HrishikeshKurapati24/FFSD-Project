import React, { useState, useEffect } from 'react';
import { useInfluencers } from '../hooks/useInfluencers';
import '../styles/modal.css';

const InfluencersModal = ({ isOpen, onClose }) => {
    const { influencers, loading, error, fetchInfluencers } = useInfluencers();
    const [searchTerm, setSearchTerm] = useState('');

    console.log('InfluencersModal render - isOpen:', isOpen, 'influencers:', influencers, 'loading:', loading, 'error:', error);

    useEffect(() => {
        console.log('InfluencersModal useEffect - isOpen:', isOpen);
        if (isOpen) {
            console.log('Fetching influencers...');
            fetchInfluencers();
        }
    }, [isOpen]);

    const filteredInfluencers = influencers.filter(influencer =>
        influencer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        influencer.niche.toLowerCase().includes(searchTerm.toLowerCase()) ||
        influencer.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!isOpen) {
        console.log('InfluencersModal not open, returning null');
        return null;
    }

    console.log('Rendering InfluencersModal with filteredInfluencers:', filteredInfluencers.length);

    return (
        <div className="modal" onClick={onClose} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                maxWidth: '800px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto'
            }}>
                <div className="modal-header">
                    <h2>All Registered Influencers</h2>
                    <span className="close" onClick={onClose}>&times;</span>
                </div>
                <div className="modal-body">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search influencers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="grid-container">
                        {loading && (
                            <div className="loading">
                                <i className="fas fa-spinner fa-spin"></i> Loading influencers...
                            </div>
                        )}
                        {error && (
                            <div className="text-center py-4">
                                <p>Error loading influencers. Please try again.</p>
                            </div>
                        )}
                        {!loading && !error && filteredInfluencers.length === 0 && (
                            <div className="text-center py-4">
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
        <div className="influencer-card">
            <div className="influencer-header">
                <img
                    src={influencer.profilePicUrl || '/images/default-avatar.jpg'}
                    alt={influencer.fullName}
                    className="influencer-avatar"
                    onError={(e) => {
                        e.currentTarget.src = '/images/default-avatar.jpg';
                    }}
                />
                <div className="influencer-info">
                    <h3 className="influencer-name">{influencer.fullName}</h3>
                    <p className="influencer-niche">{influencer.niche || 'General'}</p>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-item">
                    <span className="stat-number">{influencer.totalFollowers.toLocaleString()}</span>
                    <div className="stat-label">Total Followers</div>
                </div>
                <div className="stat-item">
                    <span className="stat-number">{influencer.completedCollabs}</span>
                    <div className="stat-label">Completed Collaborations</div>
                </div>
                <div className="stat-item">
                    <span className="stat-number">{influencer.avgRating.toFixed(1)}</span>
                    <div className="stat-label">Rating</div>
                </div>
                <div className="stat-item">
                    <span className="stat-number">{influencer.avgEngagementRate.toFixed(1)}%</span>
                    <div className="stat-label">Engagement</div>
                </div>
            </div>

            <div className="categories">
                <strong>Categories:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                    {influencer.categories.map(cat => (
                        <span key={cat} className="category-tag">{cat}</span>
                    ))}
                </div>
            </div>

            {socialPlatforms.length > 0 && (
                <div className="categories">
                    <strong>Social Platforms:</strong>
                    <div className="social-platforms">
                        {socialPlatforms.map(platform => (
                            <div key={platform} className={`platform-icon platform-${platform}`} title={platform}>
                                <i className={platformIcons[platform] || 'fas fa-globe'}></i>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InfluencersModal;
