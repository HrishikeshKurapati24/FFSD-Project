import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../../styles/influencer_campaign_history.module.css';
import { API_BASE_URL } from '../../services/api';

const CampaignHistory = () => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [campaigns, setCampaigns] = useState([]);

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
                    fetchCampaignHistory();
                } else {
                    navigate('/signin');
                }
            } catch (error) {
                console.error('Auth verification error:', error);
                navigate('/signin');
            }
        };

        verifyAuth();
    }, [navigate]);

    // Fetch campaign history
    const fetchCampaignHistory = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/influencer/campaign-history`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.status === 401) {
                navigate('/signin');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch campaign history');
            }

            const data = await response.json();
            if (data.success) {
                setCampaigns(data.campaigns || []);
            }
        } catch (error) {
            console.error('Error fetching campaign history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles['campaign-history-page']}>
                <div style={{ padding: '20px', textAlign: 'center' }}>Loading campaign history...</div>
            </div>
        );
    }

    return (
        <div className={styles['campaign-history-page']}>
            {/* Header */}
            <header>
                <div className={styles['header-container']}>
                    <div className={styles['logo']}>CollabSync</div>
                    <nav>
                        <ul>
                            <li><Link to="/influencer/home">Home</Link></li>
                            <li><Link to="/influencer/explore">Explore Brands</Link></li>
                            <li><Link to="/influencer/profile">My Profile</Link></li>
                        </ul>
                    </nav>
                </div>
            </header>

            {/* Sidebar Navigation */}
            <button className={styles['toggle-btn']} onClick={() => setMenuOpen(true)}>☰</button>
            <div className={styles['menu']} style={{ width: menuOpen ? '250px' : '0' }}>
                <span className={styles['close-btn']} onClick={() => setMenuOpen(false)}>&times;</span>
                <Link to="/influencer/campaigns" onClick={() => setMenuOpen(false)}>Campaigns</Link>
                <Link to="/influencer/signout" onClick={() => setMenuOpen(false)}>Sign Out</Link>
            </div>

            {/* Main Content */}
            <div className={styles['container']}>
                <div className={styles['campaigns-header']}>
                    <h1>Campaign History</h1>
                    <p>View and analyze your past campaign performances</p>
                </div>

                {/* Campaigns Grid */}
                <div className={styles['campaigns-grid']}>
                    {campaigns && campaigns.length > 0 ? (
                        campaigns.map((campaign, idx) => (
                            <div key={idx} className={styles['campaign-card']}>
                                <span className={`${styles['campaign-status']} ${styles['status-completed']}`}>
                                    {campaign.status}
                                </span>
                                <div className={styles['brand-info']}>
                                    <Link 
                                        to={`/influencer/I_brand_profile/${campaign.brand_id}`} 
                                        className={styles['brand-link']}
                                    >
                                        <img 
                                            src={campaign.brand_logo || '/images/default-brand.png'}
                                            alt={campaign.brand_name} 
                                            className={styles['brand-logo']} 
                                        />
                                        <span className={styles['brand-name']}>
                                            {campaign.brand_name}
                                        </span>
                                    </Link>
                                </div>
                                <h3>{campaign.title}</h3>
                                <p>{campaign.description}</p>

                                <div className={styles['campaign-metrics']}>
                                    <div className={styles['metric']}>
                                        <span className={styles['metric-value']}>
                                            {campaign.performance_score?.toFixed(1)}
                                        </span>
                                        <span className={styles['metric-label']}>Performance</span>
                                    </div>
                                    <div className={styles['metric']}>
                                        <span className={styles['metric-value']}>
                                            {campaign.engagement_rate?.toFixed(1)}%
                                        </span>
                                        <span className={styles['metric-label']}>Engagement</span>
                                    </div>
                                    <div className={styles['metric']}>
                                        <span className={styles['metric-value']}>
                                            {campaign.reach?.toLocaleString()}
                                        </span>
                                        <span className={styles['metric-label']}>Reach</span>
                                    </div>
                                </div>

                                <div className={styles['campaign-details']}>
                                    <div className={styles['detail-item']}>
                                        <i className="far fa-calendar"></i>
                                        <span>Ended {new Date(campaign.end_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className={styles['detail-item']}>
                                        <i className="fas fa-users"></i>
                                        <span>
                                            {campaign.influencers_count} influencers(excluding you)
                                        </span>
                                    </div>
                                    <div className={styles['detail-item']}>
                                        <i className="fas fa-tag"></i>
                                        <span>
                                            {campaign.budget?.toLocaleString()} budget
                                        </span>
                                    </div>
                                    <div className={styles['detail-item']}>
                                        <i className="fas fa-chart-line"></i>
                                        <span>
                                            {campaign.conversion_rate}% conversion
                                        </span>
                                    </div>
                                </div>

                                {campaign.influencers && campaign.influencers.length > 0 && (
                                    <div className={styles['campaign-influencers']}>
                                        <h4>Other Influencers in this Campaign</h4>
                                        <div className={styles['influencer-list']}>
                                            {campaign.influencers.map((influencer, infIdx) => (
                                                <a 
                                                    key={infIdx}
                                                    className={styles['influencer-tag']} 
                                                    href={`/brand/influencer_details/${influencer.id}`}
                                                >
                                                    <img 
                                                        src={influencer.profilePicUrl || '/images/default-avatar.jpg'}
                                                        alt={influencer.name}
                                                    />
                                                    <span>{influencer.name}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className={styles['no-campaigns']}>
                            <i className="fas fa-history"></i>
                            <h3>No Campaign History</h3>
                            <p>You haven't completed any campaigns yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CampaignHistory;
