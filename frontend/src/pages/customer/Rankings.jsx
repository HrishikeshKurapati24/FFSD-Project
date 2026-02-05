import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import styles from '../../styles/customer/rankings.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import CustomerNavbar from '../../components/customer/CustomerNavbar';

const EXTERNAL_ASSETS = {
    styles: [
        'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
    ],
    scripts: ['https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js']
};

const DEFAULT_BRAND_LOGO = '/images/default-brand-logo.jpg';
const DEFAULT_AVATAR = '/images/default-avatar.jpg';

const BRAND_OPTIONS = [
    { value: 'revenue', label: 'Campaign Revenue' },
    { value: 'engagement_rate', label: 'Engagement Rate' },
    { value: 'rating', label: 'Rating' },
    { value: 'completedCampaigns', label: 'Completed Campaigns' }
];

const INFLUENCER_OPTIONS = [
    { value: 'totalFollowers', label: 'Total Followers' },
    { value: 'engagement_rate', label: 'Engagement Rate' },
    { value: 'platform_count', label: 'Platform Count' }
    // Removed: completedCampaigns - focus on social metrics and followers instead
];

const Rankings = () => {
    useExternalAssets(EXTERNAL_ASSETS);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [brandCategory, setBrandCategory] = useState(searchParams.get('brandCategory') || 'revenue');
    const [influencerCategory, setInfluencerCategory] = useState(
        searchParams.get('influencerCategory') || 'totalFollowers'
    );
    const [brandRankings, setBrandRankings] = useState([]);
    const [influencerRankings, setInfluencerRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [pageTitle, setPageTitle] = useState('Rankings');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [customerName, setCustomerName] = useState('');
    
    // Profile modal states
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [selectedInfluencer, setSelectedInfluencer] = useState(null);
    const [brandProfileData, setBrandProfileData] = useState(null);
    const [influencerProfileData, setInfluencerProfileData] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/verify`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.authenticated && data.user?.userType === 'customer') {
                        setIsAuthenticated(true);
                        setCustomerName(data.user?.displayName || '');
                    } else {
                        navigate('/signin');
                    }
                } else {
                    navigate('/signin');
                }
            } catch (error) {
                console.error('Auth check error:', error);
                navigate('/signin');
            }
        };

        checkAuth();
    }, [navigate]);

    const updateQueryParams = useCallback(
        (updates) => {
            const params = new URLSearchParams(searchParams);
            Object.entries(updates).forEach(([key, value]) => params.set(key, value));
            setSearchParams(params);
        },
        [searchParams, setSearchParams]
    );

    const fetchRankings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_BASE_URL}/customer/rankings?brandCategory=${brandCategory}&influencerCategory=${influencerCategory}`,
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Unable to load rankings right now.');
            }

            const data = await response.json();
            setBrandRankings(Array.isArray(data?.brandRankings) ? data.brandRankings : []);
            setInfluencerRankings(Array.isArray(data?.influencerRankings) ? data.influencerRankings : []);
            setBrandCategory(data?.brandCategory || 'revenue');
            setInfluencerCategory(data?.influencerCategory || 'totalFollowers');
            setPageTitle(data?.title || 'Rankings');
            document.title = `${data?.title || 'Rankings'} - CollabSync`;
            setErrorMessage('');
        } catch (error) {
            console.error('Error fetching rankings:', error);
            setErrorMessage(error.message || 'Unable to load rankings right now.');
        } finally {
            setLoading(false);
        }
    }, [brandCategory, influencerCategory]);

    useEffect(() => {
        let isMounted = true;

        const loadRankings = async () => {
            if (!isMounted) {
                return;
            }
            await fetchRankings();
        };

        loadRankings();

        return () => {
            isMounted = false;
        };
    }, [fetchRankings]);

    useEffect(() => {
        updateQueryParams({ brandCategory, influencerCategory });
    }, [brandCategory, influencerCategory, updateQueryParams]);

    const brandMetricLabel = useMemo(() => {
        const current = BRAND_OPTIONS.find((opt) => opt.value === brandCategory);
        return current ? current.label : 'Campaign Revenue';
    }, [brandCategory]);

    const influencerMetricLabel = useMemo(() => {
        const current = INFLUENCER_OPTIONS.find((opt) => opt.value === influencerCategory);
        return current ? current.label : 'Total Followers';
    }, [influencerCategory]);

    const formatCurrency = (value) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

    const formatNumber = (value) =>
        new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value || 0);

    const getBrandMetricValue = (brand) => {
        switch (brandCategory) {
            case 'revenue':
                return formatCurrency(brand?.revenue || 0);
            case 'engagement_rate':
                return `${(brand?.engagement_rate || 0).toFixed(2)}%`;
            case 'rating':
                return `${(brand?.rating || 0).toFixed(2)}/5`;
            case 'completedCampaigns':
            default:
                return formatNumber(brand?.completedCampaigns || 0);
        }
    };

    const getInfluencerMetricValue = (influencer) => {
        switch (influencerCategory) {
            case 'engagement_rate':
                return `${(influencer?.engagement_rate || 0).toFixed(2)}%`;
            case 'platform_count':
                return formatNumber(influencer?.platform_count || 0);
            case 'totalFollowers':
            default:
                return formatNumber(influencer?.totalFollowers || 0);
        }
    };

    // Profile modal functions
    const fetchBrandProfile = useCallback(async (brandId) => {
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
        } catch (error) {
            console.error('Error fetching brand profile:', error);
            setBrandProfileData(null);
        } finally {
            setProfileLoading(false);
        }
    }, []);

    const fetchInfluencerProfile = useCallback(async (influencerId) => {
        try {
            setProfileLoading(true);
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
        } catch (error) {
            console.error('Error fetching influencer profile:', error);
            setInfluencerProfileData(null);
        } finally {
            setProfileLoading(false);
        }
    }, []);

    const handleBrandImageClick = useCallback((brand) => {
        setSelectedBrand(brand);
        fetchBrandProfile(brand.id || brand._id);
    }, [fetchBrandProfile]);

    const handleInfluencerImageClick = useCallback((influencer) => {
        setSelectedInfluencer(influencer);
        fetchInfluencerProfile(influencer.id || influencer._id);
    }, [fetchInfluencerProfile]);

    const closeBrandModal = useCallback(() => {
        setSelectedBrand(null);
        setBrandProfileData(null);
    }, []);

    const closeInfluencerModal = useCallback(() => {
        setSelectedInfluencer(null);
        setInfluencerProfileData(null);
    }, []);

    const handleCampaignTitleClick = useCallback((campaignId) => {
        navigate(`/customer/campaign/${campaignId}/shop`);
    }, [navigate]);

    if (!isAuthenticated) {
        return (
            <div className={styles.rankingsPage}>
                <CustomerNavbar />
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" aria-label="Loading" />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.rankingsPage}>
            <CustomerNavbar customerName={customerName} />

            <div className={`container my-4 ${styles['rankings-container']}`}>
                <div className={`d-flex align-items-center gap-2 flex-wrap ${styles['filters-wrap']}`}>
                    <div className="d-flex align-items-center me-2">
                        <label className="me-2" htmlFor="brandCategory">
                            Brand:
                        </label>
                        <select
                            id="brandCategory"
                            className="form-select me-3"
                            value={brandCategory}
                            onChange={(event) => setBrandCategory(event.target.value)}
                        >
                            {BRAND_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="d-flex align-items-center me-2">
                        <label className="me-2" htmlFor="influencerCategory">
                            Influencer:
                        </label>
                        <select
                            id="influencerCategory"
                            className="form-select me-3"
                            value={influencerCategory}
                            onChange={(event) => setInfluencerCategory(event.target.value)}
                        >
                            {INFLUENCER_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {errorMessage && (
                    <div className="alert alert-danger mt-3" role="alert">
                        {errorMessage}
                    </div>
                )}

                {/* Profile Modals (simple overlay modals) */}
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
                            <div className="d-flex justify-content-between align-items-center mb-4" style={{borderBottom: '2px solid #f0f0f0', paddingBottom: 16}}>
                                <h5 className="m-0" style={{fontSize: '1.5rem', fontWeight: 600, color: '#333'}}>
                                    <i className="fas fa-building me-2" style={{color: '#ff6b6b'}}></i>
                                    {brandProfileData?.brandName || selectedBrand?.name || 'Brand Profile'}
                                </h5>
                                <button className="btn btn-sm btn-close" onClick={closeBrandModal} aria-label="Close" style={{fontSize: '1.5rem'}}></button>
                            </div>

                            {profileLoading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status" aria-label="Loading" />
                                    <p className="text-muted mt-3">Loading brand profile...</p>
                                </div>
                            ) : brandProfileData ? (
                                <div>
                                    <div className="mb-4">
                                        <h6 style={{fontSize: '0.95rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px'}}>About</h6>
                                        <p style={{color: '#666', lineHeight: 1.6, marginTop: 8}}>{brandProfileData?.description || brandProfileData?.about || 'No description available.'}</p>
                                    </div>

                                    <div className="mb-4">
                                        <h6 style={{fontSize: '0.95rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Brand Details</h6>
                                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8}}>
                                            {brandProfileData?.industry && (
                                                <div>
                                                    <small style={{color: '#999', display: 'block'}}>Industry</small>
                                                    <span style={{color: '#333', fontWeight: 500}}>{brandProfileData.industry}</span>
                                                </div>
                                            )}
                                            {brandProfileData?.location && (
                                                <div>
                                                    <small style={{color: '#999', display: 'block'}}>Location</small>
                                                    <span style={{color: '#333', fontWeight: 500}}>📍 {brandProfileData.location}</span>
                                                </div>
                                            )}
                                            {brandProfileData?.website && (
                                                <div>
                                                    <small style={{color: '#999', display: 'block'}}>Website</small>
                                                    <a href={brandProfileData.website} target="_blank" rel="noopener noreferrer" style={{color: '#007bff', textDecoration: 'none'}}>Visit Site</a>
                                                </div>
                                            )}
                                            {brandProfileData?.mission && (
                                                <div>
                                                    <small style={{color: '#999', display: 'block'}}>Mission</small>
                                                    <span style={{color: '#333', fontWeight: 500}}>{brandProfileData.mission.substring(0, 50)}...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {Array.isArray(brandProfileData?.categories) && brandProfileData.categories.length > 0 && (
                                        <div className="mb-4">
                                            <h6 style={{fontSize: '0.95rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Categories</h6>
                                            <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8}}>
                                                {brandProfileData.categories.map((cat) => (
                                                    <span key={cat} className="badge bg-light text-dark">{cat}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <h6 style={{fontSize: '0.95rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Current Campaigns</h6>
                                        {Array.isArray(brandProfileData?.currentCampaigns) && brandProfileData.currentCampaigns.length > 0 ? (
                                            <ul className="list-group mt-3" style={{border: 'none'}}>
                                                {brandProfileData.currentCampaigns.map((c) => (
                                                    <li key={c.id || c._id} className="list-group-item d-flex justify-content-between align-items-center" style={{background: '#fff', border: '1px solid #e8e8e8', marginBottom: 8, borderRadius: 6, padding: '12px 16px'}}>
                                                        <button className="btn btn-link p-0" onClick={() => handleCampaignTitleClick(c.id || c._id)} style={{textDecoration: 'none', color: '#000', backgroundColor: '#fff', fontWeight: 500}}>
                                                            {c.title || c.name || 'Untitled Campaign'}
                                                        </button>
                                                        <small className="badge bg-success" style={{color: '#fff'}}>{c.status || 'Active'}</small>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div style={{color: '#999', fontStyle: 'italic'}}>No active campaigns.</div>
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
                            <div className="d-flex justify-content-between align-items-center mb-4" style={{borderBottom: '2px solid #f0f0f0', paddingBottom: 16}}>
                                <h5 className="m-0" style={{fontSize: '1.5rem', fontWeight: 600, color: '#333'}}>
                                    <i className="fas fa-user-circle me-2" style={{color: '#4ecdc4'}}></i>
                                    {influencerProfileData?.name || selectedInfluencer?.name || 'Influencer Profile'}
                                </h5>
                                <button className="btn btn-sm btn-close" onClick={closeInfluencerModal} aria-label="Close" style={{fontSize: '1.5rem'}}></button>
                            </div>

                            {profileLoading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status" aria-label="Loading" />
                                    <p className="text-muted mt-3">Loading influencer profile...</p>
                                </div>
                            ) : influencerProfileData ? (
                                <div>
                                    <div className="mb-4">
                                        <h6 style={{fontSize: '0.95rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Bio</h6>
                                        <p style={{color: '#666', lineHeight: 1.6, marginTop: 8}}>{influencerProfileData?.bio || 'No bio available.'}</p>
                                    </div>

                                    <div className="mb-4">
                                        <h6 style={{fontSize: '0.95rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Profile Details</h6>
                                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8}}>
                                            {influencerProfileData?.niche && (
                                                <div>
                                                    <small style={{color: '#999', display: 'block'}}>Niche</small>
                                                    <span style={{color: '#333', fontWeight: 500}}>{influencerProfileData.niche}</span>
                                                </div>
                                            )}
                                            {influencerProfileData?.location && (
                                                <div>
                                                    <small style={{color: '#999', display: 'block'}}>Location</small>
                                                    <span style={{color: '#333', fontWeight: 500}}>📍 {influencerProfileData.location}</span>
                                                </div>
                                            )}
                                            {influencerProfileData?.website && (
                                                <div>
                                                    <small style={{color: '#999', display: 'block'}}>Website</small>
                                                    <a href={influencerProfileData.website} target="_blank" rel="noopener noreferrer" style={{color: '#007bff', textDecoration: 'none'}}>Visit Site</a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {Array.isArray(selectedInfluencer?.socials) && selectedInfluencer.socials.length > 0 && (
                                        <div className="mb-4">
                                            <h6 style={{fontSize: '0.95rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Social Media Profiles</h6>
                                            <ul className="list-group mt-3" style={{border: 'none'}}>
                                                {selectedInfluencer.socials.map((social, idx) => (
                                                    <li key={idx} className="list-group-item" style={{background: '#fff', border: '1px solid #e8e8e8', marginBottom: 8, borderRadius: 6, padding: '12px 16px'}}>
                                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                            <div>
                                                                <strong style={{color: '#333', textTransform: 'capitalize'}}>{social.platform || 'Platform'}</strong>
                                                                <div style={{fontSize: '0.9rem', color: '#666', marginTop: 4}}>
                                                                    @{social.handle || 'N/A'}
                                                                </div>
                                                            </div>
                                                            {social.followers && (
                                                                <div style={{textAlign: 'right'}}>
                                                                    <small style={{color: '#999', display: 'block'}}>Followers</small>
                                                                    <span style={{color: '#333', fontWeight: 600}}>{formatNumber(social.followers)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <h6 style={{fontSize: '0.95rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Promoted Products</h6>
                                        {Array.isArray(selectedInfluencer?.topProducts) && selectedInfluencer.topProducts.length > 0 ? (
                                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, marginTop: 12}}>
                                                {selectedInfluencer.topProducts.map((p) => (
                                                    <div key={p._id || p.name} style={{borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8e8', background: '#f9f9f9', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                                                        {p.image ? (
                                                            <img src={p.image} alt={p.name} style={{width: '100%', height: 100, objectFit: 'cover'}} />
                                                        ) : (
                                                            <div style={{width: '100%', height: 100, background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><small style={{color: '#999'}}>No Image</small></div>
                                                        )}
                                                        {p.discount_percentage > 0 && (
                                                            <div style={{position: 'absolute', top: 4, right: 4, background: '#ff6b6b', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600}}>
                                                                -{p.discount_percentage}%
                                                            </div>
                                                        )}
                                                        <div style={{padding: 8}}>
                                                            <small style={{color: '#333', fontWeight: 500, display: 'block', wordBreak: 'break-word', lineHeight: 1.2}}>{p.name.substring(0, 25)}...</small>
                                                            {p.category && <tiny style={{color: '#999', fontSize: '0.7rem', display: 'block', marginTop: 2}}>{p.category}</tiny>}
                                                            <div style={{marginTop: 4}}>
                                                                <small style={{color: '#007bff', fontWeight: 600}}>{formatCurrency(p.campaign_price)}</small>
                                                                {p.original_price > p.campaign_price && (
                                                                    <small style={{color: '#999', textDecoration: 'line-through', marginLeft: 4}}>{formatCurrency(p.original_price)}</small>
                                                                )}
                                                            </div>
                                                            {p.stock_available != null && (
                                                                <tiny style={{color: p.stock_available > 0 ? '#28a745' : '#dc3545', fontSize: '0.7rem', display: 'block', marginTop: 2}}>
                                                                    {p.stock_available > 0 ? `${p.stock_available} in stock` : 'Out of stock'}
                                                                </tiny>
                                                            )}
                                                            {p.is_digital && (
                                                                <tiny style={{color: '#6610f2', fontSize: '0.7rem', display: 'block', marginTop: 2}}>🔒 Digital Product</tiny>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : Array.isArray(influencerProfileData?.promotedProducts) && influencerProfileData.promotedProducts.length > 0 ? (
                                            <ul className="list-group mt-3" style={{border: 'none'}}>
                                                {influencerProfileData.promotedProducts.map((p) => (
                                                    <li key={p.id || p._id} className="list-group-item d-flex justify-content-between align-items-center" style={{background: '#fff', border: '1px solid #e8e8e8', marginBottom: 8, borderRadius: 6, padding: '12px 16px'}}>
                                                        <span style={{fontWeight: 500, color: '#333'}}>{p.title || p.name || 'Product'}</span>
                                                        {p.price ? <small className="badge bg-success" style={{color: '#fff'}}>{formatCurrency(p.price)}</small> : null}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div style={{color: '#999', fontStyle: 'italic'}}>No promoted products listed.</div>
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

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status" aria-label="Loading" />
                    </div>
                ) : (
                    <div className="row mt-4">
                        <div className="col-lg-6 mb-4">
                            <h3 className={`${styles['rankings-section-title']} mb-1`}>
                                <i className="fas fa-trophy text-warning" aria-hidden="true" />
                                Top Brands
                            </h3>
                            <small className={styles['rankings-subtitle']}>Sorted by: {brandMetricLabel}</small>
                            <ol className="list-group list-group-numbered">
                                {brandRankings.map((brand) => (
                                    <li className="list-group-item d-flex align-items-start gap-3" key={brand.id || brand.name}>
                                        <img
                                            src={brand?.logoUrl || DEFAULT_BRAND_LOGO}
                                            alt={brand?.name || 'Brand'}
                                            className={`${styles['ranking-avatar']} me-2`}
                                            style={{ cursor: 'pointer', flexShrink: 0 }}
                                            onClick={() => handleBrandImageClick(brand)}
                                            onError={(event) => {
                                                event.currentTarget.onerror = null;
                                                event.currentTarget.src = DEFAULT_BRAND_LOGO;
                                            }}
                                        />
                                        <div className="flex-grow-1" style={{minWidth: 0}}>
                                            <div className={styles['rank-name']}>
                                                {brand?.name || 'Brand'}
                                                {brand?.verified && <i className="fas fa-check-circle text-success ms-2" style={{fontSize: '0.85rem'}} aria-hidden="true" />}
                                            </div>
                                            {brand?.tagline && (
                                                <small style={{color: '#666', display: 'block', marginTop: 2}}>{brand.tagline}</small>
                                            )}
                                            {brand?.description && (
                                                <small style={{color: '#999', display: 'block', marginTop: 4}}>{brand.description.substring(0, 80)}...</small>
                                            )}
                                            <div style={{display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', fontSize: '0.85rem'}}>
                                                {brand?.industry && <span style={{color: '#666'}}>{brand.industry}</span>}
                                                {brand?.categories && Array.isArray(brand.categories) && brand.categories.length > 0 && (
                                                    <span style={{color: '#999'}}>{brand.categories.slice(0, 2).join(', ')}</span>
                                                )}
                                            </div>
                                            <div className={styles['rank-meta']} style={{marginTop: 8}}>
                                                <span className={styles['metric-chip']}>
                                                    <i className="fas fa-chart-line" aria-hidden="true" />
                                                    {brandMetricLabel}: {getBrandMetricValue(brand)}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <div className="col-lg-6 mb-4">
                            <h3 className={`${styles['rankings-section-title']} mb-1`}>
                                <i className="fas fa-star text-warning" aria-hidden="true" />
                                Top Influencers
                            </h3>
                            <small className={styles['rankings-subtitle']}>Sorted by: {influencerMetricLabel}</small>
                            <ol className="list-group list-group-numbered">
                                {influencerRankings.map((influencer) => (
                                    <li className="list-group-item d-flex align-items-start gap-3" key={influencer.id || influencer.name}>
                                        <img
                                            src={influencer?.profilePicUrl || DEFAULT_AVATAR}
                                            alt={influencer?.name || 'Influencer'}
                                            className={`${styles['ranking-avatar']} me-2`}
                                            style={{ cursor: 'pointer', flexShrink: 0 }}
                                            onClick={() => handleInfluencerImageClick(influencer)}
                                            onError={(event) => {
                                                event.currentTarget.onerror = null;
                                                event.currentTarget.src = DEFAULT_AVATAR;
                                            }}
                                        />
                                        <div className="flex-grow-1" style={{minWidth: 0}}>
                                            <div className={styles['rank-name']}>
                                                {influencer?.name || 'Influencer'}
                                                {influencer?.displayName && <small style={{color: '#999', marginLeft: 6}}>• {influencer.displayName}</small>}
                                            </div>
                                            {influencer?.niche && (
                                                <small style={{color: '#666', display: 'block', marginTop: 2}}>🎯 {influencer.niche}</small>
                                            )}
                                            {influencer?.bio && (
                                                <small style={{color: '#999', display: 'block', marginTop: 4}}>{influencer.bio.substring(0, 80)}...</small>
                                            )}
                                            {influencer?.location && (
                                                <small style={{color: '#999', display: 'block', marginTop: 2}}>📍 {influencer.location}</small>
                                            )}
                                            {Array.isArray(influencer?.socials) && influencer.socials.length > 0 && (
                                                <div style={{display: 'flex', gap: 8, marginTop: 6, fontSize: '0.75rem'}}>
                                                    {influencer.socials.slice(0, 4).map((s, idx) => (
                                                        <span key={idx} style={{background: '#f0f0f0', padding: '2px 6px', borderRadius: 3, color: '#666', textTransform: 'capitalize'}}>
                                                            {s.platform}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className={styles['rank-meta']} style={{marginTop: 8}}>
                                                <span className={styles['metric-chip']}>
                                                    <i className="fas fa-users" aria-hidden="true" />
                                                    {influencerMetricLabel}: {getInfluencerMetricValue(influencer)}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Rankings;