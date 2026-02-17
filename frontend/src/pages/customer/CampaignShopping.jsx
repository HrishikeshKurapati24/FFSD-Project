import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import styles from '../../styles/customer/campaign_shopping.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import { useCart } from '../../contexts/CartContext';
import CampaignShoppingHeader from '../../components/customer/campaignShopping/CampaignShoppingHeader';
import ProductsTab from '../../components/customer/campaignShopping/ProductsTab';
import ContentTab from '../../components/customer/campaignShopping/ContentTab';

const EXTERNAL_ASSETS = {
    styles: [
        'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
    ],
    scripts: ['https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js']
};

const DEFAULT_BRAND_LOGO = '/images/default-brand-logo.jpg';
const DEFAULT_PRODUCT_IMAGE = '/images/default-product.png';
const DEFAULT_AVATAR = '/images/default-avatar.jpg';

const CampaignShopping = () => {
    useExternalAssets(EXTERNAL_ASSETS);
    const { campaignId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [campaign, setCampaign] = useState(null);
    const [products, setProducts] = useState([]);
    const [contentItems, setContentItems] = useState([]);
    const [activeTab, setActiveTab] = useState('products');
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [customerName, setCustomerName] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

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
                    }
                }
            } catch (error) {
                console.error('Auth check error:', error);
            } finally {
                setAuthChecked(true);
            }
        };

        checkAuth();
    }, []);

    const fetchCampaignDetails = useCallback(async () => {
        if (!campaignId) {
            setErrorMessage('Missing campaign identifier.');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/customer/campaign/${campaignId}/shop`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Unable to load campaign details right now.');
            }

            const data = await response.json();
            setCampaign(data?.campaign || null);
            setProducts(Array.isArray(data?.products) ? data.products : []);
            setContentItems(Array.isArray(data?.content) ? data.content : []);
            setErrorMessage('');
        } catch (error) {
            console.error('Error loading campaign shopping data:', error);
            setErrorMessage(error.message || 'Unable to load campaign details right now.');
        } finally {
            setLoading(false);
        }
    }, [campaignId]);

    useEffect(() => {
        fetchCampaignDetails();
    }, [fetchCampaignDetails]);

    // Capture referral code from URL (?ref=XYZ) and persist it
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const refCode = searchParams.get('ref');
        if (refCode) {
            try {
                // Store as-is; backend uppercases when matching
                localStorage.setItem('referralCode', refCode);
            } catch (e) {
                console.warn('Unable to persist referral code', e);
            }
        }
    }, [location.search]);

    useEffect(() => {
        const debounceTimeout = window.setTimeout(() => {
            setDebouncedSearch(searchValue.trim().toLowerCase());
        }, 300);

        return () => {
            window.clearTimeout(debounceTimeout);
        };
    }, [searchValue]);

    useEffect(() => {
        if (campaign?.title) {
            document.title = `${campaign.title} - CollabSync`;
        }
    }, [campaign?.title]);

    useEffect(() => {
        if (!alert.message) {
            return;
        }
        const timeout = window.setTimeout(() => {
            setAlert({ type: '', message: '' });
        }, alert.type === 'success' ? 4000 : 5000);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [alert]);

    const filteredProducts = useMemo(() => {
        if (!debouncedSearch) {
            return products;
        }
        return products.filter((product) => {
            const searchString = `${product?.name || ''} ${product?.description || ''} ${product?.category || ''}`.toLowerCase();
            return searchString.includes(debouncedSearch);
        });
    }, [products, debouncedSearch]);

    const filteredContent = useMemo(() => {
        if (!debouncedSearch) {
            return contentItems;
        }
        return contentItems.filter((item) => {
            const influencer = item?.influencer_id;
            const influencerName = influencer?.fullName || influencer?.displayName || influencer?.username || '';
            const searchString = `${item?.caption || ''} ${influencerName}`.toLowerCase();
            return searchString.includes(debouncedSearch);
        });
    }, [contentItems, debouncedSearch]);

    const formatCurrency = (value) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

    const formatDateRange = () => {
        if (!campaign?.start_date || !campaign?.end_date) {
            return '';
        }
        return `${new Date(campaign.start_date).toLocaleDateString()} - ${new Date(campaign.end_date).toLocaleDateString()}`;
    };

    const getPrimaryImageUrl = (product) => {
        const images = Array.isArray(product?.images) ? product.images : [];
        if (!images.length) {
            return null;
        }
        const primary = images.find((image) => image?.is_primary && image?.url);
        return (primary && primary.url) || images[0]?.url || null;
    };

    const getAvailableStock = (product) => {
        const target = Number(product?.target_quantity) || 0;
        const sold = Number(product?.sold_quantity) || 0;
        if (product?.target_quantity != null && product?.sold_quantity != null) {
            return Math.max(0, target - sold);
        }
        return Math.max(0, Number(product?.stock_quantity) || 0);
    };

    const showAlert = useCallback((type, message) => {
        setAlert({ type, message });
    }, []);

    const handleAddToCart = useCallback(
        async (productId, availableStock) => {
            if (!isAuthenticated) {
                navigate('/signin');
                return;
            }

            try {
                const maxQty = Number.isFinite(availableStock) ? Math.max(0, availableStock) : 0;
                if (maxQty === 0) {
                    showAlert('danger', 'Out of stock');
                    return;
                }

                const qtyInput = window.prompt(`Enter quantity (1 - ${maxQty})`, '1');
                if (qtyInput === null) {
                    return;
                }
                const quantity = parseInt(qtyInput, 10);
                if (!Number.isFinite(quantity) || quantity < 1) {
                    showAlert('danger', 'Invalid quantity');
                    return;
                }
                if (quantity > maxQty) {
                    showAlert('danger', `Only ${maxQty} available`);
                    return;
                }

                // Use CartContext addToCart method instead of direct API call
                const result = await addToCart(productId, quantity);
                if (result.success) {
                    showAlert('success', result.message || 'Added to cart');
                } else {
                    showAlert('danger', result.message || 'Failed to add to cart');
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
                showAlert('danger', error.message || 'Failed to add to cart');
            }
        },
        [addToCart, showAlert, isAuthenticated, navigate]
    );

    const handleSearchChange = (event) => {
        setSearchValue(event.target.value);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleShopFromContent = () => {
        setActiveTab('products');
        window.setTimeout(() => {
            const section = document.getElementById('products-section');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        }, 200);
    };

    if (!authChecked) {
        return (
            <div className={styles.campaignShoppingPage}>
                <CampaignShoppingHeader
                    campaign={campaign}
                    products={products}
                    contentItems={contentItems}
                    activeTab={activeTab}
                    searchValue={searchValue}
                    alert={alert}
                    errorMessage={errorMessage}
                    loading={loading}
                    onSearchChange={handleSearchChange}
                    onTabChange={handleTabChange}
                    formatDateRange={formatDateRange}
                    styles={styles}
                />
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" aria-label="Loading" />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.campaignShoppingPage}>
            <CampaignShoppingHeader
                campaign={campaign}
                products={products}
                contentItems={contentItems}
                activeTab={activeTab}
                searchValue={searchValue}
                alert={alert}
                errorMessage={errorMessage}
                loading={loading}
                onSearchChange={handleSearchChange}
                onTabChange={handleTabChange}
                formatDateRange={formatDateRange}
                styles={styles}
                customerName={customerName}
            />

            {!loading && (
                <div className="container">
                    <div className="mt-3">
                        {activeTab === 'products' ? (
                            <ProductsTab
                                filteredProducts={filteredProducts}
                                styles={styles}
                                formatCurrency={formatCurrency}
                                getPrimaryImageUrl={getPrimaryImageUrl}
                                getAvailableStock={getAvailableStock}
                                handleAddToCart={handleAddToCart}
                            />
                        ) : (
                            <ContentTab
                                filteredContent={filteredContent}
                                styles={styles}
                                handleShopFromContent={handleShopFromContent}
                            />
                        )}
                    </div>
                </div>
            )}

            <div className="modal fade" id="contentModal" tabIndex="-1" aria-labelledby="contentModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-xl">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="contentModalLabel">
                                Influencer Content
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
                        </div>
                        <div className="modal-body" id="contentModalContent" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignShopping;