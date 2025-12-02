import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../../styles/customer/all_campaigns.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets.js';
import CustomerNavbar from '../../components/customer/CustomerNavbar';

const EXTERNAL_ASSETS = {
    styles: [
        'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
    ],
    scripts: ['https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js']
};

const DEFAULT_BRAND_LOGO = '/images/default-brand-logo.jpg';

const AllCampaigns = () => {
    useExternalAssets(EXTERNAL_ASSETS);
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState([]);
    const [pageTitle, setPageTitle] = useState('All Active Campaigns');
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

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

    const fetchCampaigns = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/customer`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Unable to load campaigns right now.');
            }

            const data = await response.json();
            setCampaigns(Array.isArray(data?.campaigns) ? data.campaigns : []);
            setPageTitle(data?.title || 'All Active Campaigns');
            setErrorMessage('');
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            setErrorMessage(error.message || 'Unable to load campaigns right now.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadCampaigns = async () => {
            if (!isMounted) {
                return;
            }
            await fetchCampaigns();
        };

        loadCampaigns();

        return () => {
            isMounted = false;
        };
    }, [fetchCampaigns]);

    useEffect(() => {
        const debounceTimeout = window.setTimeout(() => {
            setDebouncedSearch(searchValue.trim().toLowerCase());
        }, 300);

        return () => {
            window.clearTimeout(debounceTimeout);
        };
    }, [searchValue]);

    useEffect(() => {
        document.title = `${pageTitle} - CollabSync`;
    }, [pageTitle]);

    const filteredCampaigns = useMemo(() => {
        if (!debouncedSearch) {
            return campaigns;
        }

        return campaigns.filter((campaign) => {
            const brandName = campaign?.brand_id?.brandName || '';
            const description = campaign?.description || '';
            const title = campaign?.title || '';
            const influencers = (campaign?.influencers || []).map((inf) => inf?.name || '').join(' ');
            const searchString = `${brandName} ${description} ${title} ${influencers}`.toLowerCase();
            return searchString.includes(debouncedSearch);
        });
    }, [campaigns, debouncedSearch]);

    const formatBudget = (value) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

    const getDaysLeft = (endDate) => {
        if (!endDate) {
            return 0;
        }
        const diff = new Date(endDate).getTime() - Date.now();
        return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    };

    const truncateDescription = (description) => {
        if (!description) {
            return '';
        }
        return description.length > 140 ? `${description.substring(0, 140)}...` : description;
    };

    const handleBrandImageError = (event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = DEFAULT_BRAND_LOGO;
    };

    const handleSearchChange = (event) => {
        setSearchValue(event.target.value);
    };

    if (!isAuthenticated) {
        return (
            <div className={styles.allCampaignsPage}>
                <CustomerNavbar
                    searchValue={searchValue}
                    onSearchChange={handleSearchChange}
                />
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" aria-label="Loading" />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.allCampaignsPage}>
            <CustomerNavbar
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                customerName={customerName}
            />

            <main className="container mt-4">
                <div className="row">
                    <div className="col-12">
                        {customerName && (
                            <div className="mb-4">
                                <h2 className="text-primary">
                                    <i className="fas fa-smile me-2" aria-hidden="true" />
                                    Hello, {customerName}! 👋
                                </h2>
                            </div>
                        )}
                        <h1 className="mb-3">
                            <i className="fas fa-fire me-2 text-primary" aria-hidden="true" />
                            {pageTitle}
                        </h1>
                        <p className="lead text-muted">
                            Discover amazing products from your favorite brands and influencers
                        </p>
                    </div>
                </div>

                {errorMessage && (
                    <div className="alert alert-danger" role="alert">
                        {errorMessage}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status" aria-label="Loading" />
                    </div>
                ) : (
                    <div className="row mt-4" id="campaigns-container">
                        {filteredCampaigns.length ? (
                            filteredCampaigns.map((campaign) => (
                                <div className="col-md-6 col-lg-4 mb-4 campaign-item" key={campaign?._id}>
                                    <div className={`card h-100 shadow-sm border-0 ${styles['campaign-card']}`}>
                                        <div className="card-body d-flex flex-column">
                                            <div className="d-flex align-items-center mb-3">
                                                <div className={`brand-logo-container me-3 ${styles['brand-logo-container']}`}>
                                                    <img
                                                        src={campaign?.brand_id?.logoUrl || DEFAULT_BRAND_LOGO}
                                                        alt={campaign?.brand_id?.brandName || 'Brand logo'}
                                                        className={`brand-logo ${styles['brand-logo']}`}
                                                        onError={handleBrandImageError}
                                                    />
                                                </div>
                                                <h5 className="card-title mb-0">
                                                    {campaign?.brand_id?.brandName || 'Brand'}
                                                </h5>
                                            </div>

                                            <h6 className={`mb-3 ${styles['campaign-title']}`}>
                                                <i className="fas fa-bullhorn me-2" aria-hidden="true" />
                                                {campaign?.title || 'Campaign'}
                                            </h6>

                                            <p className={`card-text flex-grow-1 text-muted ${styles['campaign-description']}`}>
                                                {truncateDescription(campaign?.description)}
                                            </p>

                                            <div className="campaign-dates mb-2">
                                                <small className="text-success">
                                                    <i className="fas fa-calendar-alt me-1" aria-hidden="true" />
                                                    Ends:{' '}
                                                    {campaign?.end_date
                                                        ? new Date(campaign.end_date).toLocaleDateString()
                                                        : 'TBD'}
                                                </small>
                                            </div>

                                            {campaign?.influencers?.length ? (
                                                <div className={`mb-3 ${styles['influencers-section']}`}>
                                                    <div className={`d-flex align-items-center mb-2 ${styles['section-title']}`}>
                                                        <i className="fas fa-users" aria-hidden="true" />
                                                        <span>Influencers</span>
                                                    </div>
                                                    <div className={`d-flex flex-wrap ${styles['influencers-grid']}`}>
                                                        {campaign.influencers.slice(0, 6).map((influencer) => (
                                                            <span className="badge bg-light text-dark border" key={influencer?.id}>
                                                                <i className="fas fa-user-circle me-1" aria-hidden="true" />
                                                                {influencer?.name || 'Influencer'}
                                                            </span>
                                                        ))}
                                                        {campaign.influencers.length > 6 && (
                                                            <span className="badge bg-light text-dark border">
                                                                +{campaign.influencers.length - 6} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {campaign?.required_channels?.length ? (
                                                <div className={`mb-3 ${styles['channels-section']}`}>
                                                    <div className={`d-flex align-items-center mb-2 ${styles['section-title']}`}>
                                                        <i className="fas fa-share-alt" aria-hidden="true" />
                                                        <span>Channels</span>
                                                    </div>
                                                    <div className={`d-flex flex-wrap ${styles['channels-grid']}`}>
                                                        {campaign.required_channels.map((channel) => (
                                                            <span className="badge bg-light text-dark border" key={channel}>
                                                                <i className="fas fa-hashtag me-1" aria-hidden="true" />
                                                                {channel}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}

                                            <div className={`mb-2 ${styles['campaign-stats']}`}>
                                                <div className="row text-center g-0">
                                                    <div className="col-6">
                                                        <div className={styles['stat-number']}>{getDaysLeft(campaign?.end_date)}</div>
                                                        <div className={styles['stat-label']}>Days Left</div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div className={styles['stat-number']}>
                                                            {formatBudget(campaign?.budget || 0)}
                                                        </div>
                                                        <div className={styles['stat-label']}>Budget</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="campaign-actions mt-auto">
                                                <Link
                                                    className={`btn btn-primary w-100 mb-2 ${styles['btn-primary']}`}
                                                    to={`/customer/campaign/${campaign?._id}/shop`}
                                                    aria-label={`Shop campaign ${campaign?.title || ''}`}
                                                >
                                                    <i className="fas fa-shopping-bag me-2" aria-hidden="true" />
                                                    Shop Now
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-12">
                                <div className="text-center py-5">
                                    <i className={`fas fa-calendar-times text-muted ${styles['empty-state-icon']}`} aria-hidden="true" />
                                    <h3 className="mt-3">No Active Campaigns</h3>
                                    <p className="text-muted">
                                        There are no active campaigns at the moment. Check back soon!
                                    </p>
                                    <Link className={`btn btn-primary ${styles['btn-primary']}`} to="/customer">
                                        <i className="fas fa-home me-2" aria-hidden="true" />
                                        Go Home
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AllCampaigns;
