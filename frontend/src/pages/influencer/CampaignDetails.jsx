import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import styles from '../../styles/influencer_collaboration_details.module.css';
import { API_BASE_URL } from '../../services/api';

// Product Card Component
const ProductCard = ({ product, imageUrl, styles }) => {
    const [imageError, setImageError] = useState(false);

    return (
        <div className={styles['product-card']}>
            <div className={styles['product-image']}>
                {imageUrl && imageUrl.trim() !== '' ? (
                    <>
                        <img 
                            src={imageUrl} 
                            alt={product.name} 
                            className={styles['product-img']}
                            onError={() => setImageError(true)}
                            style={{ display: imageError ? 'none' : 'block' }}
                        />
                        {imageError && (
                            <div className={styles['product-placeholder']} style={{ display: 'flex' }}>
                                <i className="fas fa-box"></i>
                                <span>Image Failed to Load</span>
                                <small style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.7rem', color: '#999' }}>
                                    URL: {imageUrl}
                                </small>
                            </div>
                        )}
                    </>
                ) : (
                    <div className={styles['product-placeholder']}>
                        <i className="fas fa-box"></i>
                        <span>No Image</span>
                    </div>
                )}
            </div>
            <div className={styles['product-details']}>
                <h4 className={styles['product-name']}>{product.name}</h4>
                <div className={styles['product-category']}>
                    <span className={styles['category-badge']}>
                        {product.category}
                    </span>
                </div>
                <div className={styles['product-pricing']}>
                    <div className={styles['price-row']}>
                        <span className={styles['price-label']}>Original Price:</span>
                        <span className={styles['original-price']}>${product.original_price}</span>
                    </div>
                    <div className={styles['price-row']}>
                        <span className={styles['price-label']}>Campaign Price:</span>
                        <span className={styles['campaign-price']}>${product.campaign_price}</span>
                    </div>
                    {product.discount_percentage && (
                        <div className={styles['discount-badge']}>
                            {product.discount_percentage}% OFF
                        </div>
                    )}
                </div>
                <div className={styles['product-description']}>
                    <p>{product.description}</p>
                </div>
                {product.special_instructions && (
                    <div className={styles['special-instructions']}>
                        <h5>Special Instructions:</h5>
                        <p>{product.special_instructions}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const CampaignDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    
    const [collab, setCollab] = useState(null);
    const [applicationStatus, setApplicationStatus] = useState(null);
    const [isEligible, setIsEligible] = useState(true);
    const [unmetRequirements, setUnmetRequirements] = useState([]);
    const [specialMessage, setSpecialMessage] = useState('');
    const [applying, setApplying] = useState(false);

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
                    fetchCampaignDetails();
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

    // Fetch campaign details
    const fetchCampaignDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/influencer/collab/${id}`, {
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
                throw new Error('Failed to fetch campaign details');
            }

            const data = await response.json();
            if (data.success) {
                setCollab(data.collab);
                setApplicationStatus(data.applicationStatus);
                setIsEligible(data.isEligible);
                setUnmetRequirements(data.unmetRequirements || []);
            }
        } catch (error) {
            console.error('Error fetching campaign details:', error);
        } finally {
            setLoading(false);
        }
    };

    // Apply for campaign
    const applyForCampaign = async () => {
        if (!isEligible) {
            alert('You do not meet the requirements for this campaign.');
            return;
        }

        setApplying(true);
        try {
            const response = await fetch(`${API_BASE_URL}/influencer/apply/${id}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ message: specialMessage })
                });

                const data = await response.json();
                if (data.success) {
                    alert('Application submitted successfully!');
                fetchCampaignDetails(); // Refresh to update status
                } else {
                    // Check if subscription is expired
                    if (data.expired && data.redirectUrl) {
                        if (confirm(data.message + '\n\nWould you like to renew your subscription now?')) {
                        const redirectPath = data.redirectUrl.startsWith('http')
                            ? new URL(data.redirectUrl).pathname + new URL(data.redirectUrl).search
                            : data.redirectUrl;
                        navigate(redirectPath);
                        }
                    } else {
                        alert('Failed to submit application: ' + data.message);
                    }
                }
            } catch (error) {
                console.error('Error submitting application:', error);
                alert('An error occurred while submitting the application');
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className={styles['campaign-details-page']}>
                <div style={{ padding: '20px', textAlign: 'center' }}>Loading campaign details...</div>
            </div>
        );
    }

    if (!collab) {
        return (
            <div className={styles['campaign-details-page']}>
                <div style={{ padding: '20px', textAlign: 'center' }}>Campaign not found</div>
            </div>
        );
    }

    return (
        <div className={styles['campaign-details-page']}>
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

                {/* Sidebar Navigation */}
                <button className={styles['toggle-btn']} onClick={() => setMenuOpen(true)}>☰</button>
                <div className={styles['menu']} style={{ width: menuOpen ? '250px' : '0' }}>
                    <span className={styles['close-btn']} onClick={() => setMenuOpen(false)}>&times;</span>
                    <Link to="/influencer/campaigns" onClick={() => setMenuOpen(false)}>Campaigns</Link>
                    <Link to="/influencer/signout" onClick={() => setMenuOpen(false)}>Sign Out</Link>
        </div>
    </header>

            {/* Main Content */}
            <div className={styles['container']}>
                <div className={styles['campaign-details']}>
                    <div className={styles['campaign-header']}>
                        <div className={styles['brand-info']}>
                            <img src={collab.brand_logo} alt={collab.brand_name} className={styles['brand-logo']} />
                            <div className={styles['brand-details']}>
                                <h1>{collab.title}</h1>
                                <p className={styles['brand-name']}>{collab.brand_name}</p>
                    </div>
                </div>
                        <div className={`${styles['status-badge']} ${styles[collab.status]}`}>
                            {collab.status}
                </div>
            </div>

                    <div className={styles['campaign-grid']}>
                        <div className={styles['detail-section']}>
                    <h3>Campaign Overview</h3>
                            <div className={styles['detail-item']}>
                                <span className={styles['label']}>Description:</span>
                                <span className={styles['value']}>{collab.description}</span>
                    </div>
                            <div className={styles['detail-item']}>
                                <span className={styles['label']}>Objectives:</span>
                                <span className={styles['value']}>{collab.objectives}</span>
                    </div>
                            <div className={styles['detail-item']}>
                                <span className={styles['label']}>Target Audience:</span>
                                <span className={styles['value']}>{collab.target_audience}</span>
                    </div>
                </div>

                        <div className={styles['detail-section']}>
                    <h3>Campaign Details</h3>
                            <div className={styles['detail-item']}>
                                <span className={styles['label']}>Duration:</span>
                                <span className={styles['value']}>{collab.duration} days</span>
                    </div>
                            <div className={styles['detail-item']}>
                                <span className={styles['label']}>Budget:</span>
                                <span className={styles['value']}>
                                    {collab.budget?.toLocaleString()} Rupees
                        </span>
                    </div>
                            <div className={styles['detail-item']}>
                                <span className={styles['label']}>Start Date:</span>
                                <span className={styles['value']}>
                                    {new Date(collab.start_date).toLocaleDateString()}
                        </span>
                    </div>
                            <div className={styles['detail-item']}>
                                <span className={styles['label']}>End Date:</span>
                                <span className={styles['value']}>
                                    {new Date(collab.end_date).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                        <div className={styles['detail-section']}>
                    <h3>Requirements</h3>
                            <div className={styles['detail-item']}>
                                <span className={styles['label']}>Minimum Followers:</span>
                                <span className={styles['value']}>
                                    {collab.min_followers?.toLocaleString()}
                                </span>
                            </div>
                            <div className={styles['detail-item']}>
                                <span className={styles['label']}>Required Channels:</span>
                                <div className={styles['channels-list']}>
                                    {collab.required_channels && collab.required_channels.map((channel, idx) => (
                                        <span key={idx} className={styles['channel-badge']}>
                                            {channel}
                                        </span>
                                    ))}
                        </div>
                    </div>
                            {!isEligible && unmetRequirements.length > 0 && (
                                <div className={`${styles['detail-item']} ${styles['unmet-requirements']}`}>
                                    <span className={`${styles['label']} ${styles['unmet-label']}`}>Unmet Requirements:</span>
                                    <ul className={styles['unmet-list']}>
                                        {unmetRequirements.map((msg, idx) => (
                                            <li key={idx}>{msg}</li>
                                        ))}
                            </ul>
                        </div>
                            )}
                </div>

                        {/* Products Section */}
                        {collab.products && collab.products.length > 0 && (
                            <div className={`${styles['detail-section']} ${styles['products-section']}`}>
                        <h3>Campaign Products</h3>
                                <div className={styles['products-intro']}>
                                    <p>
                                        <i className="fas fa-info-circle"></i> <strong>These are the products you will be promoting
                                        in this campaign. A sample will be sent to you after approval of request.</strong>
                                    </p>
                        </div>
                                <div className={styles['products-grid']}>
                                    {collab.products.map((product, idx) => {
                                        const productImage = product.images && product.images.length > 0
                                            ? (product.images.find(img => img.is_primary) || product.images[0])
                                            : null;
                                            const imageUrl = productImage ? productImage.url : null;

                                        return (
                                            <ProductCard 
                                                key={idx} 
                                                product={product} 
                                                imageUrl={imageUrl}
                                                styles={styles}
                                            />
                                        );
                                    })}
                                </div>
                        </div>
                        )}
            </div>

                    <div className={styles['action-buttons']}>
                        {applicationStatus === 'request' ? (
                            <button className={`${styles['btn']} ${styles['btn-secondary']}`} disabled>
                                <i className="fas fa-check"></i> Applied for Campaign
                    </button>
                        ) : applicationStatus === 'active' ? (
                            <button className={`${styles['btn']} ${styles['btn-secondary']}`} disabled>
                                <i className="fas fa-check"></i> Application already accepted
                        </button>
                        ) : (
                            <div className={styles['action-input-group']}>
                                <input 
                                    type="text" 
                                    id="specialMessage" 
                                    placeholder="Add a message to brand (optional)" 
                                    className={styles['message-input']}
                                    value={specialMessage}
                                    onChange={(e) => setSpecialMessage(e.target.value)}
                                />
                                <button 
                                    className={`${styles['btn']} ${styles['btn-primary']}`}
                                    onClick={applyForCampaign}
                                    disabled={!isEligible || applying}
                                >
                                    <i className="fas fa-check"></i> {applying ? 'Applying...' : 'Apply For Campaign'}
                                </button>
                            </div>
                        )}
            </div>
        </div>
    </div>

            {/* Footer */}
            <footer className={styles['footer']}>
                <div className={styles['footer-content']}>
                    <div className={styles['footer-section']}>
                <h3>CollabSync</h3>
                <p>Connecting brands with influencers for successful collaborations.</p>
            </div>
                    <div className={styles['footer-section']}>
                <h3>Quick Links</h3>
                <ul>
                            <li><Link to="/influencer/home">Home</Link></li>
                            <li><Link to="/influencer/explore">Explore Brands</Link></li>
                            <li><Link to="/influencer/profile">My Profile</Link></li>
                </ul>
            </div>
                    <div className={styles['footer-section']}>
                <h3>Support</h3>
                <ul>
                    <li><a href="#">Help Center</a></li>
                    <li><a href="#">Contact Us</a></li>
                    <li><a href="#">Privacy Policy</a></li>
                </ul>
            </div>
        </div>
                <div className={styles['footer-bottom']}>
            <p>&copy; 2025 CollabSync. All rights reserved.</p>
        </div>
    </footer>
        </div>
    );
};

export default CampaignDetails;
