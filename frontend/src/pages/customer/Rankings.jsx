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
    { value: 'platform_count', label: 'Platform Count' },
    { value: 'completedCampaigns', label: 'Completed Campaigns' }
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
            case 'completedCampaigns':
                return formatNumber(influencer?.completedCampaigns || 0);
            case 'totalFollowers':
            default:
                return formatNumber(influencer?.totalFollowers || 0);
        }
    };

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
                                    <li className="list-group-item d-flex align-items-center" key={brand.id || brand.name}>
                                        <img
                                            src={brand?.logoUrl || DEFAULT_BRAND_LOGO}
                                            alt={brand?.name || 'Brand'}
                                            className={`${styles['ranking-avatar']} me-3`}
                                            onError={(event) => {
                                                event.currentTarget.onerror = null;
                                                event.currentTarget.src = DEFAULT_BRAND_LOGO;
                                            }}
                                        />
                                        <div className="flex-grow-1">
                                            <div className={styles['rank-name']}>{brand?.name || 'Brand'}</div>
                                            <div className={styles['rank-meta']}>
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
                                    <li className="list-group-item d-flex align-items-center" key={influencer.id || influencer.name}>
                                        <img
                                            src={influencer?.profilePicUrl || DEFAULT_AVATAR}
                                            alt={influencer?.name || 'Influencer'}
                                            className={`${styles['ranking-avatar']} me-3`}
                                            onError={(event) => {
                                                event.currentTarget.onerror = null;
                                                event.currentTarget.src = DEFAULT_AVATAR;
                                            }}
                                        />
                                        <div className="flex-grow-1">
                                            <div className={styles['rank-name']}>{influencer?.name || 'Influencer'}</div>
                                            <div className={styles['rank-meta']}>
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