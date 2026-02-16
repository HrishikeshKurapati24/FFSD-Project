import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../services/api';
import CustomerNavbar from '../../components/customer/CustomerNavbar';
import styles from '../../styles/customer/cart.module.css'; // Reusing and extending cart styles

const OrderHistory = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [purchasedBrands, setPurchasedBrands] = useState([]);
    const [purchasedInfluencers, setPurchasedInfluencers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Brand profile modal state (reusing logic from Rankings page)
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [brandProfileData, setBrandProfileData] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Influencer profile modal state
    const [selectedInfluencer, setSelectedInfluencer] = useState(null);
    const [influencerProfileData, setInfluencerProfileData] = useState(null);
    const [influencerProfileLoading, setInfluencerProfileLoading] = useState(false);

    useEffect(() => {
        const fetchOrderHistory = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/customer/orders`, {
                    headers: {
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch order history');
                }

                const data = await response.json();
                if (data.success) {
                    setOrders(data.orders || []);
                    setPurchasedBrands(data.purchasedBrands || []);
                    setPurchasedInfluencers(data.purchasedInfluencers || []);
                } else {
                    setError(data.message || 'Failed to load data');
                }
            } catch (err) {
                console.error("Error fetching order history:", err);
                setError('Failed to load order history. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrderHistory();
    }, []);

    // Fetch full brand profile for modal (same backend endpoint as Rankings)
    const fetchBrandProfile = useCallback(async (brandId) => {
        if (!brandId) return;
        try {
            setProfileLoading(true);
            const response = await fetch(`${API_BASE_URL}/customer/brand/${brandId}/profile`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Unable to load brand profile.');
            }

            const data = await response.json();
            setBrandProfileData(data.brand);
        } catch (err) {
            console.error('Error fetching brand profile:', err);
            setBrandProfileData(null);
        } finally {
            setProfileLoading(false);
        }
    }, []);

    const handleBrandVisit = useCallback(
        (brand) => {
            if (!brand) return;
            setSelectedBrand(brand);
            // Use _id if present; fallback to id
            fetchBrandProfile(brand._id || brand.id);
        },
        [fetchBrandProfile]
    );

    const closeBrandModal = useCallback(() => {
        setSelectedBrand(null);
        setBrandProfileData(null);
    }, []);

    const handleCampaignTitleClick = useCallback(
        (campaignId) => {
            if (!campaignId) return;
            navigate(`/customer/campaign/${campaignId}/shop`);
        },
        [navigate]
    );

    // Fetch Influencer profile (same backend endpoint as Rankings)
    const fetchInfluencerProfile = useCallback(async (influencerId) => {
        if (!influencerId) return;
        try {
            setInfluencerProfileLoading(true);
            const response = await fetch(`${API_BASE_URL}/customer/influencer/${influencerId}/profile`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Unable to load influencer profile.');
            }

            const data = await response.json();
            setInfluencerProfileData(data.influencer);
        } catch (err) {
            console.error('Error fetching influencer profile:', err);
            setInfluencerProfileData(null);
        } finally {
            setInfluencerProfileLoading(false);
        }
    }, []);

    const handleInfluencerVisit = useCallback(
        (inf) => {
            if (!inf) return;
            setSelectedInfluencer(inf);
            fetchInfluencerProfile(inf._id || inf.id);
        },
        [fetchInfluencerProfile]
    );

    const closeInfluencerModal = useCallback(() => {
        setSelectedInfluencer(null);
        setInfluencerProfileData(null);
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.cartPage} style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <CustomerNavbar />

            <div className={`container py-5 ${styles.orderHistoryContainer}`}>
                {/* Brand Profile Modal (same data model as Rankings.jsx) */}
                {selectedBrand && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            zIndex: 9999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(2px)'
                        }}
                        onClick={closeBrandModal}
                    >
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 12,
                                maxWidth: 800,
                                width: '90%',
                                padding: 24,
                                maxHeight: '85vh',
                                overflowY: 'auto',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                border: '1px solid #e0e0e0'
                            }}
                            role="dialog"
                            aria-modal="true"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                className="d-flex justify-content-between align-items-center mb-4"
                                style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: 16 }}
                            >
                                <h5
                                    className="m-0"
                                    style={{ fontSize: '1.5rem', fontWeight: 600, color: '#333' }}
                                >
                                    <i
                                        className="fas fa-building me-2"
                                        style={{ color: '#ff6b6b' }}
                                    ></i>
                                    {brandProfileData?.brandName ||
                                        selectedBrand?.brandName ||
                                        selectedBrand?.name ||
                                        'Brand Profile'}
                                </h5>
                                <button
                                    className="btn btn-sm btn-close"
                                    onClick={closeBrandModal}
                                    aria-label="Close"
                                    style={{ fontSize: '1.5rem' }}
                                ></button>
                            </div>

                            {profileLoading ? (
                                <div className="text-center py-5">
                                    <div
                                        className="spinner-border text-primary"
                                        role="status"
                                        aria-label="Loading"
                                    />
                                    <p className="text-muted mt-3">
                                        Loading brand profile...
                                    </p>
                                </div>
                            ) : brandProfileData ? (
                                <div>
                                    <div className="mb-4">
                                        <h6
                                            style={{
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                color: '#555',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            About
                                        </h6>
                                        <p
                                            style={{
                                                color: '#666',
                                                lineHeight: 1.6,
                                                marginTop: 8
                                            }}
                                        >
                                            {brandProfileData?.description ||
                                                brandProfileData?.about ||
                                                'No description available.'}
                                        </p>
                                    </div>

                                    <div className="mb-4">
                                        <h6
                                            style={{
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                color: '#555',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            Brand Details
                                        </h6>
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: 16,
                                                marginTop: 8
                                            }}
                                        >
                                            {brandProfileData?.industry && (
                                                <div>
                                                    <small
                                                        style={{
                                                            color: '#999',
                                                            display: 'block'
                                                        }}
                                                    >
                                                        Industry
                                                    </small>
                                                    <span
                                                        style={{
                                                            color: '#333',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {brandProfileData.industry}
                                                    </span>
                                                </div>
                                            )}
                                            {brandProfileData?.location && (
                                                <div>
                                                    <small
                                                        style={{
                                                            color: '#999',
                                                            display: 'block'
                                                        }}
                                                    >
                                                        Location
                                                    </small>
                                                    <span
                                                        style={{
                                                            color: '#333',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        📍 {brandProfileData.location}
                                                    </span>
                                                </div>
                                            )}
                                            {brandProfileData?.website && (
                                                <div>
                                                    <small
                                                        style={{
                                                            color: '#999',
                                                            display: 'block'
                                                        }}
                                                    >
                                                        Website
                                                    </small>
                                                    <a
                                                        href={brandProfileData.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            color: '#007bff',
                                                            textDecoration: 'none'
                                                        }}
                                                    >
                                                        Visit Site
                                                    </a>
                                                </div>
                                            )}
                                            {brandProfileData?.mission && (
                                                <div>
                                                    <small
                                                        style={{
                                                            color: '#999',
                                                            display: 'block'
                                                        }}
                                                    >
                                                        Mission
                                                    </small>
                                                    <span
                                                        style={{
                                                            color: '#333',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {brandProfileData.mission.substring(
                                                            0,
                                                            50
                                                        )}
                                                        ...
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {Array.isArray(brandProfileData?.categories) &&
                                        brandProfileData.categories.length > 0 && (
                                            <div className="mb-4">
                                                <h6
                                                    style={{
                                                        fontSize: '0.95rem',
                                                        fontWeight: 600,
                                                        color: '#555',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}
                                                >
                                                    Categories
                                                </h6>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        gap: 8,
                                                        flexWrap: 'wrap',
                                                        marginTop: 8
                                                    }}
                                                >
                                                    {brandProfileData.categories.map((cat) => (
                                                        <span
                                                            key={cat}
                                                            className="badge bg-light text-dark"
                                                        >
                                                            {cat}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    <div className="mb-4">
                                        <h6
                                            style={{
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                color: '#555',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            Current Campaigns
                                        </h6>
                                        {Array.isArray(brandProfileData?.currentCampaigns) &&
                                            brandProfileData.currentCampaigns.filter(c => c.status && c.status.toLowerCase() === 'active').length > 0 ? (
                                            <ul
                                                className="list-group mt-3"
                                                style={{ border: 'none' }}
                                            >
                                                {brandProfileData.currentCampaigns.filter(c => c.status && c.status.toLowerCase() === 'active').map((c) => (
                                                    <li
                                                        key={c.id || c._id}
                                                        className="list-group-item d-flex justify-content-between align-items-center"
                                                        style={{
                                                            background: '#fff',
                                                            border: '1px solid #e8e8e8',
                                                            marginBottom: 8,
                                                            borderRadius: 6,
                                                            padding: '12px 16px'
                                                        }}
                                                    >
                                                        <button
                                                            className="btn btn-link p-0"
                                                            onClick={() =>
                                                                handleCampaignTitleClick(
                                                                    c.id || c._id
                                                                )
                                                            }
                                                            style={{
                                                                textDecoration: 'none',
                                                                color: '#000',
                                                                backgroundColor: '#fff',
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            {c.title ||
                                                                c.name ||
                                                                'Untitled Campaign'}
                                                        </button>
                                                        <small
                                                            className="badge bg-success"
                                                            style={{ color: '#fff' }}
                                                        >
                                                            {c.status || 'Active'}
                                                        </small>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div
                                                style={{
                                                    color: '#999',
                                                    fontStyle: 'italic'
                                                }}
                                            >
                                                No active campaigns.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="alert alert-warning" role="alert">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    Unable to load brand profile. Please try again.
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* Influencer Profile Modal */}
                {selectedInfluencer && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            zIndex: 9999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(2px)'
                        }}
                        onClick={closeInfluencerModal}
                    >
                        <div
                            style={{
                                background: '#fff',
                                borderRadius: 12,
                                maxWidth: 800,
                                width: '90%',
                                padding: 24,
                                maxHeight: '85vh',
                                overflowY: 'auto',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                border: '1px solid #e0e0e0'
                            }}
                            role="dialog"
                            aria-modal="true"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div
                                className="d-flex justify-content-between align-items-center mb-4"
                                style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: 16 }}
                            >
                                <h5
                                    className="m-0"
                                    style={{ fontSize: '1.5rem', fontWeight: 600, color: '#333' }}
                                >
                                    <i
                                        className="fas fa-user-circle me-2"
                                        style={{ color: '#4ecdc4' }}
                                    ></i>
                                    {influencerProfileData?.displayName ||
                                        influencerProfileData?.name ||
                                        selectedInfluencer?.displayName ||
                                        selectedInfluencer?.fullName ||
                                        'Influencer Profile'}
                                </h5>
                                <button
                                    className="btn btn-sm btn-close"
                                    onClick={closeInfluencerModal}
                                    aria-label="Close"
                                    style={{ fontSize: '1.5rem' }}
                                ></button>
                            </div>

                            {influencerProfileLoading ? (
                                <div className="text-center py-5">
                                    <div
                                        className="spinner-border text-primary"
                                        role="status"
                                        aria-label="Loading"
                                    />
                                    <p className="text-muted mt-3">
                                        Loading influencer profile...
                                    </p>
                                </div>
                            ) : influencerProfileData ? (
                                <div>
                                    <div className="mb-4">
                                        <h6
                                            style={{
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                color: '#555',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            Bio
                                        </h6>
                                        <p
                                            style={{
                                                color: '#666',
                                                lineHeight: 1.6,
                                                marginTop: 8
                                            }}
                                        >
                                            {influencerProfileData?.bio || 'No bio available.'}
                                        </p>
                                    </div>

                                    <div className="mb-4">
                                        <h6
                                            style={{
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                color: '#555',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            Profile Details
                                        </h6>
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: 16,
                                                marginTop: 8
                                            }}
                                        >
                                            {influencerProfileData?.niche && (
                                                <div>
                                                    <small
                                                        style={{
                                                            color: '#999',
                                                            display: 'block'
                                                        }}
                                                    >
                                                        Niche
                                                    </small>
                                                    <span
                                                        style={{
                                                            color: '#333',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {influencerProfileData.niche}
                                                    </span>
                                                </div>
                                            )}
                                            {influencerProfileData?.location && (
                                                <div>
                                                    <small
                                                        style={{
                                                            color: '#999',
                                                            display: 'block'
                                                        }}
                                                    >
                                                        Location
                                                    </small>
                                                    <span
                                                        style={{
                                                            color: '#333',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        📍 {influencerProfileData.location}
                                                    </span>
                                                </div>
                                            )}
                                            {influencerProfileData?.website && (
                                                <div>
                                                    <small
                                                        style={{
                                                            color: '#999',
                                                            display: 'block'
                                                        }}
                                                    >
                                                        Website
                                                    </small>
                                                    <a
                                                        href={influencerProfileData.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            color: '#007bff',
                                                            textDecoration: 'none'
                                                        }}
                                                    >
                                                        Visit Site
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h6
                                            style={{
                                                fontSize: '0.95rem',
                                                fontWeight: 600,
                                                color: '#555',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            Current Campaigns
                                        </h6>
                                        {Array.isArray(influencerProfileData?.currentCampaigns) &&
                                            influencerProfileData.currentCampaigns.filter(c => c.status && c.status.toLowerCase() === 'active').length > 0 ? (
                                            <ul
                                                className="list-group mt-3"
                                                style={{ border: 'none' }}
                                            >
                                                {influencerProfileData.currentCampaigns.filter(c => c.status && c.status.toLowerCase() === 'active').map((c) => (
                                                    <li
                                                        key={c.id || c._id}
                                                        className="list-group-item d-flex justify-content-between align-items-center"
                                                        style={{
                                                            background: '#fff',
                                                            border: '1px solid #e8e8e8',
                                                            marginBottom: 8,
                                                            borderRadius: 6,
                                                            padding: '12px 16px'
                                                        }}
                                                    >
                                                        <button
                                                            className="btn btn-link p-0"
                                                            onClick={() =>
                                                                handleCampaignTitleClick(
                                                                    c.id || c._id
                                                                )
                                                            }
                                                            style={{
                                                                textDecoration: 'none',
                                                                color: '#000',
                                                                backgroundColor: '#fff',
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                            {c.title ||
                                                                c.name ||
                                                                'Untitled Campaign'}
                                                        </button>
                                                        <small
                                                            className="badge bg-success"
                                                            style={{ color: '#fff' }}
                                                        >
                                                            {c.status || 'Active'}
                                                        </small>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div
                                                style={{
                                                    color: '#999',
                                                    fontStyle: 'italic'
                                                }}
                                            >
                                                No active campaigns.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="alert alert-warning" role="alert">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    Unable to load influencer profile. Please try again.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="row mb-4">
                    <div className="col-12 text-center">
                        <h1 className={styles.orderHistoryTitle}>My Account</h1>
                        <p className={styles.orderHistorySubtitle}>
                            Track your orders and connections
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger text-center">{error}</div>
                ) : (
                    <div className="row">
                        {/* Left Column: Order History */}
                        <div className="col-lg-8">
                            <h3 className="mb-4 pb-2 border-bottom">
                                <i className="fas fa-box-open me-2 text-primary"></i> Order History
                            </h3>

                            {orders.length === 0 ? (
                                <div className="text-center py-5 bg-white rounded shadow-sm">
                                    <i className="fas fa-shopping-basket fa-3x text-muted mb-3"></i>
                                    <h4>No orders yet</h4>
                                    <p className="text-muted">Start shopping from active campaigns!</p>
                                    <Link to="/customer" className="btn btn-primary mt-2">Browse Campaigns</Link>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {orders.map(order => (
                                        <div key={order._id} className={`card ${styles.orderCard}`}>
                                            <div className={`card-header d-flex justify-content-between align-items-center pt-3 ${styles.orderCardHeader}`}>
                                                <div>
                                                    <span className="text-white-50 small">Order #{order._id.toString().slice(-6).toUpperCase()}</span>
                                                    <div className="fw-bold">{formatDate(order.createdAt)}</div>
                                                </div>
                                                <div className="text-end">
                                                    <span className={`badge rounded-pill px-3 py-2 bg-${order.status === 'delivered' ? 'success' : order.status === 'shipped' ? 'info' : 'warning'}`}>
                                                        {order.status || 'Pending'}
                                                    </span>
                                                    <div className="fw-bold mt-1">${order.total_amount}</div>
                                                </div>
                                            </div>
                                            <div className="card-body">
                                                {order.items && order.items.map((item, idx) => (
                                                    <div key={idx} className="d-flex align-items-center mb-2">
                                                        <img
                                                            src={(item.product_id?.images?.[0]?.url) || '/images/default-product.png'}
                                                            alt={item.product_id?.name || 'Product'}
                                                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                                                            className="me-3"
                                                            onError={(e) => { e.target.src = '/images/default-product.png'; }}
                                                        />
                                                        <div>
                                                            <div className="fw-bold">{item.product_id?.name || 'Unknown Product'}</div>
                                                            <div className="small text-muted">Qty: {item.quantity}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right Column: Connections */}
                        <div className={`col-lg-4 mt-4 mt-lg-0 ${styles.connectionsColumn}`}>
                            <h3 className="mb-4 pb-2 border-bottom">
                                <i className="fas fa-link me-2 text-primary"></i> My Connections
                            </h3>

                            {/* Brands */}
                            <h5 className="text-muted mb-3 small text-uppercase fw-bold">Brands You Support</h5>
                            <div className="row g-2 mb-4">
                                {purchasedBrands.length > 0 ? purchasedBrands.map((brand, idx) => (
                                    <div key={idx} className="col-6">
                                        <div className={`card h-100 text-center p-3 ${styles.connectionCard}`}>
                                            <img
                                                src={brand.logoUrl || '/images/default-brand.png'}
                                                alt={brand.brandName}
                                                className={`mx-auto mb-2 rounded-circle ${styles.connectionAvatar}`}
                                                style={{ width: '60px', height: '60px', objectFit: 'cover', border: '2px solid #f8f9fa' }}
                                                onError={(e) => { e.target.src = '/images/default-brand.png'; }}
                                            />
                                            <div className="fw-bold small text-truncate">{brand.brandName}</div>
                                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>{brand.industry || 'Brand'}</small>
                                            <button
                                                type="button"
                                                className={`btn btn-sm btn-outline-secondary mt-2 py-0 ${styles.connectionViewButton}`}
                                                style={{ fontSize: '0.7rem' }}
                                                onClick={() => handleBrandVisit(brand)}
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-12"><p className="text-muted small">No brands connected yet.</p></div>
                                )}
                            </div>

                            {/* Influencers */}
                            <h5 className="text-muted mb-3 small text-uppercase fw-bold">Influencers You Supported</h5>
                            <div className="row g-2">
                                {purchasedInfluencers.length > 0 ? purchasedInfluencers.map((inf, idx) => (
                                    <div key={idx} className="col-6">
                                        <div className={`card h-100 text-center p-3 ${styles.connectionCard}`}>
                                            <img
                                                src={inf.profilePicUrl || '/images/default-avatar.png'}
                                                alt={inf.displayName}
                                                className={`mx-auto mb-2 rounded-circle ${styles.connectionAvatar}`}
                                                style={{ width: '60px', height: '60px', objectFit: 'cover', border: '2px solid #f8f9fa' }}
                                                onError={(e) => { e.target.src = '/images/default-avatar.png'; }}
                                            />
                                            <div className="fw-bold small text-truncate">{inf.displayName || inf.fullName}</div>
                                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>{inf.niche || 'Influencer'}</small>
                                            <button
                                                type="button"
                                                className={`btn btn-sm btn-outline-secondary mt-2 py-0 ${styles.connectionViewButton}`}
                                                style={{ fontSize: '0.7rem' }}
                                                onClick={() => handleInfluencerVisit(inf)}
                                            >
                                                View
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-12"><p className="text-muted small">No influencers connected yet.</p></div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
