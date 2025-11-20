import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styles from '../../styles/campaign_shopping.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';

const EXTERNAL_ASSETS = {
    styles: [
        'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
    ],
    scripts: ['https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js']
};

const DEFAULT_BRAND_LOGO = '/images/default-brand-logo.jpg';
const DEFAULT_PRODUCT_IMAGE = '/images/default-product.jpg';
const DEFAULT_AVATAR = '/images/default-avatar.jpg';

const CampaignShopping = () => {
    useExternalAssets(EXTERNAL_ASSETS);
    const { campaignId } = useParams();
    const [campaign, setCampaign] = useState(null);
    const [products, setProducts] = useState([]);
    const [contentItems, setContentItems] = useState([]);
    const [activeTab, setActiveTab] = useState('products');
    const [searchValue, setSearchValue] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [alert, setAlert] = useState({ type: '', message: '' });

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
        let isMounted = true;

        const loadCampaign = async () => {
            if (!isMounted) {
                return;
            }
            await fetchCampaignDetails();
        };

        loadCampaign();

        return () => {
            isMounted = false;
        };
    }, [fetchCampaignDetails]);

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

                const response = await fetch(`${API_BASE_URL}/customer/cart/add`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    body: JSON.stringify({ productId, quantity })
                });

                const data = await response.json();
                if (response.ok && data?.success) {
                    showAlert('success', 'Added to cart');
                } else {
                    throw new Error(data?.message || 'Failed to add to cart');
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
                showAlert('danger', error.message || 'Failed to add to cart');
            }
        },
        [showAlert]
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

    const brandLogo = campaign?.brand?.logoUrl || DEFAULT_BRAND_LOGO;
    const brandName = campaign?.brand?.brandName || 'Brand';

    return (
        <div className={styles.campaignShoppingPage}>
            <nav className={`navbar navbar-light bg-light sticky-top ${styles.navbar}`}>
                <div className="container">
                    <Link className="navbar-brand fw-bold" to="/customer" aria-label="CollabSync home">
                        <i className="fas fa-shopping-bag me-2" aria-hidden="true" />
                        CollabSync
                    </Link>
                    <ul className="nav me-auto">
                        <li className="nav-item">
                            <Link className="nav-link" to="/customer">
                                All Campaigns
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/customer/rankings">
                                Rankings
                            </Link>
                        </li>
                    </ul>
                    <div className="d-flex align-items-center">
                        <div className="input-group me-3">
                            <input
                                type="text"
                                id="search"
                                className="form-control"
                                placeholder="Search products or posts..."
                                aria-label="Search products or posts"
                                value={searchValue}
                                onChange={handleSearchChange}
                            />
                            <button
                                type="button"
                                className={`btn btn-outline-secondary ${styles['btn-outline-secondary']}`}
                                aria-label="Search icon"
                            >
                                <i className="fas fa-search" aria-hidden="true" />
                            </button>
                        </div>
                        <Link className={`btn btn-primary ${styles['btn-primary']}`} to="/customer/cart" aria-label="Go to cart">
                            <i className="fas fa-shopping-cart me-2" aria-hidden="true" />
                            Cart
                        </Link>
                    </div>
                </div>
            </nav>

            <header className={styles['campaign-header']}>
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <div className="d-flex align-items-center mb-3">
                                <img
                                    src={brandLogo}
                                    alt={brandName}
                                    className={`${styles['brand-logo']} me-3 ${styles['campaign-brand-image']}`}
                                    onError={(event) => {
                                        event.currentTarget.onerror = null;
                                        event.currentTarget.src = DEFAULT_BRAND_LOGO;
                                    }}
                                />
                                <div>
                                    <h1 className={`${styles['campaign-title']} mb-1`}>{campaign?.title || 'Campaign'}</h1>
                                    <p className={`${styles['brand-name']} mb-0`}>by {brandName}</p>
                                </div>
                            </div>
                            <p className={styles['campaign-description']}>{campaign?.description || ''}</p>
                            <div className={styles['campaign-dates']}>
                                <small>
                                    <i className="fas fa-calendar-alt me-1" aria-hidden="true" />
                                    {formatDateRange()}
                                </small>
                            </div>
                        </div>
                        <div className="col-md-4 text-end">
                            <div className={styles['campaign-stats']}>
                                <div className={styles['stat-item']}>
                                    <span className={styles['stat-number']}>{products.length}</span>
                                    <span className={styles['stat-label']}>Products</span>
                                </div>
                                <div className={styles['stat-item']}>
                                    <span className={styles['stat-number']}>{contentItems.length}</span>
                                    <span className={styles['stat-label']}>Posts</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mt-4">
                {alert.message && (
                    <div className={`alert alert-${alert.type === 'success' ? 'success' : 'danger'}`} role="alert">
                        {alert.message}
                    </div>
                )}

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
                    <>
                        <ul className="nav nav-tabs mb-4" role="tablist">
                            <li className="nav-item" role="presentation">
                                <button
                                    type="button"
                                    className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
                                    role="tab"
                                    aria-selected={activeTab === 'products'}
                                    onClick={() => setActiveTab('products')}
                                >
                                    <i className="fas fa-box me-2" aria-hidden="true" />
                                    Products
                                </button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button
                                    type="button"
                                    className={`nav-link ${activeTab === 'content' ? 'active' : ''}`}
                                    role="tab"
                                    aria-selected={activeTab === 'content'}
                                    onClick={() => setActiveTab('content')}
                                >
                                    <i className="fas fa-images me-2" aria-hidden="true" />
                                    Influencer Content
                                </button>
                            </li>
                        </ul>

                        {activeTab === 'products' ? (
                            <div className="row" id="products-section">
                                {filteredProducts.length ? (
                                    filteredProducts.map((product) => {
                                        const imageUrl = getPrimaryImageUrl(product) || DEFAULT_PRODUCT_IMAGE;
                                        const availableStock = getAvailableStock(product);
                                        return (
                                            <div className="col-md-6 col-lg-4 mb-4" key={product?._id}>
                                                <div className={`h-100 d-flex flex-column ${styles['product-card']}`}>
                                                    <div className={styles['product-image-container']}>
                                                        <img
                                                            src={imageUrl}
                                                            alt={product?.name || 'Product image'}
                                                            className={styles['product-image']}
                                                            onError={(event) => {
                                                                event.currentTarget.onerror = null;
                                                                event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                                                            }}
                                                        />
                                                        {product?.discount_percentage > 0 && (
                                                            <span className={styles['discount-badge']}>
                                                                {product.discount_percentage}% OFF
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`${styles['product-info']} d-flex flex-column flex-grow-1`}>
                                                        <h6 className={styles['product-name']}>
                                                            {product?.name || 'Unnamed Product'}
                                                        </h6>
                                                        <p className={styles['product-description']}>
                                                            {product?.description
                                                                ? product.description.length > 120
                                                                    ? `${product.description.substring(0, 120)}...`
                                                                    : product.description
                                                                : ''}
                                                        </p>
                                                        <div className={`${styles['product-pricing']} mb-2`}>
                                                            <span className={styles['current-price']}>
                                                                {formatCurrency(product?.campaign_price || 0)}
                                                            </span>
                                                            {product?.original_price != null &&
                                                                product.original_price > product.campaign_price && (
                                                                    <span className={styles['original-price']}>
                                                                        {formatCurrency(product.original_price)}
                                                                    </span>
                                                                )}
                                                        </div>
                                                        <div className={`${styles['product-details']} mb-3`}>
                                                            <ul className="list-unstyled small mb-0">
                                                                {product?.category && (
                                                                    <li>
                                                                        <strong>Category:</strong> {product.category}
                                                                    </li>
                                                                )}
                                                                {product?.is_digital && (
                                                                    <li>
                                                                        <strong>Type:</strong>{' '}
                                                                        <span className="badge bg-info">Digital Product</span>
                                                                    </li>
                                                                )}
                                                                <li>
                                                                    <strong>Stock:</strong> {availableStock} available
                                                                </li>
                                                                {product?.delivery_info?.estimated_days && (
                                                                    <li>
                                                                        <strong>Delivery:</strong>{' '}
                                                                        {product.delivery_info.estimated_days} days{' '}
                                                                        {product.delivery_info.shipping_cost > 0
                                                                            ? `(Shipping: ${formatCurrency(
                                                                                product.delivery_info.shipping_cost
                                                                            )})`
                                                                            : product.delivery_info.free_shipping_threshold
                                                                                ? `(Free shipping over ${formatCurrency(
                                                                                    product.delivery_info.free_shipping_threshold
                                                                                )})`
                                                                                : '(Free shipping)'}
                                                                    </li>
                                                                )}
                                                                {product?.tags?.length ? (
                                                                    <li>
                                                                        <strong>Tags:</strong>{' '}
                                                                        {product.tags.slice(0, 3).join(', ')}
                                                                        {product.tags.length > 3 ? '...' : ''}
                                                                    </li>
                                                                ) : null}
                                                                {product?.specifications &&
                                                                    Object.keys(product.specifications).length > 0 && (
                                                                        <>
                                                                            {Object.entries(product.specifications)
                                                                                .slice(0, 2)
                                                                                .map(([key, value]) => (
                                                                                    <li key={key}>
                                                                                        <strong>{key}:</strong> {value}
                                                                                    </li>
                                                                                ))}
                                                                            {Object.keys(product.specifications).length > 2 && (
                                                                                <li>
                                                                                    <em>
                                                                                        +
                                                                                        {Object.keys(product.specifications).length - 2} more
                                                                                        specifications
                                                                                    </em>
                                                                                </li>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                {product?.special_instructions && (
                                                                    <li>
                                                                        <strong>Note:</strong> {product.special_instructions}
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        </div>
                                                        <div className={`${styles['product-actions']} mt-auto`}>
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary btn-sm"
                                                                onClick={() => handleAddToCart(product?._id, availableStock)}
                                                            >
                                                                <i className="fas fa-shopping-cart me-1" aria-hidden="true" />
                                                                Add to Cart
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-12">
                                        <div className="alert alert-info text-center">
                                            <i className="fas fa-info-circle me-2" aria-hidden="true" />
                                            No products available for this campaign.
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="row">
                                {filteredContent.length ? (
                                    filteredContent.map((item) => {
                                        const influencer = item?.influencer_id || {};
                                        const influencerName =
                                            influencer.fullName || influencer.displayName || influencer.username || 'Influencer';
                                        const cover = Array.isArray(item?.media_urls) ? item.media_urls[0] : null;
                                        const coverUrl = cover?.url || null;
                                        return (
                                            <div className="col-md-6 col-lg-4 mb-4" key={item?._id}>
                                                <div className={`h-100 d-flex flex-column ${styles['content-card']}`}>
                                                    <div className={styles['content-image-container']}>
                                                        {coverUrl ? (
                                                            <img
                                                                src={coverUrl}
                                                                alt={item?.caption ? `${item.caption.substring(0, 50)}...` : 'Content image'}
                                                                className={styles['content-image']}
                                                                onError={(event) => {
                                                                    event.currentTarget.onerror = null;
                                                                    event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className={styles['content-placeholder']}>
                                                                <i className="fas fa-image" aria-hidden="true" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`${styles['content-info']} d-flex flex-column flex-grow-1`}>
                                                        <div className="d-flex align-items-center mb-2">
                                                            <img
                                                                src={influencer?.profilePicUrl || DEFAULT_AVATAR}
                                                                alt={influencerName}
                                                                className={`${styles['influencer-avatar']} me-2`}
                                                                onError={(event) => {
                                                                    event.currentTarget.onerror = null;
                                                                    event.currentTarget.src = DEFAULT_AVATAR;
                                                                }}
                                                            />
                                                            <span className={styles['influencer-name']}>{influencerName}</span>
                                                        </div>
                                                        <h6 className={styles['content-title']}>
                                                            {item?.caption
                                                                ? item.caption.length > 60
                                                                    ? `${item.caption.substring(0, 60)}...`
                                                                    : item.caption
                                                                : 'Influencer Post'}
                                                        </h6>
                                                        <p className={styles['content-caption']}>
                                                            {item?.caption
                                                                ? item.caption.length > 140
                                                                    ? `${item.caption.substring(0, 140)}...`
                                                                    : item.caption
                                                                : ''}
                                                        </p>
                                                        {item?.hashtags?.length ? (
                                                            <div className={`${styles['content-hashtags']} mb-2`}>
                                                                {item.hashtags.slice(0, 3).map((hashtag) => (
                                                                    <span className="badge bg-light text-dark me-1" key={hashtag}>
                                                                        #{hashtag}
                                                                    </span>
                                                                ))}
                                                                {item.hashtags.length > 3 && (
                                                                    <span className="text-muted small">
                                                                        +{item.hashtags.length - 3} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : null}
                                                        <div className={`${styles['content-stats']} mt-auto mb-2`}>
                                                            <small className="text-muted">
                                                                {item?.published_at && (
                                                                    <>
                                                                        <i className="fas fa-calendar me-1" aria-hidden="true" />
                                                                        {new Date(item.published_at).toLocaleDateString()}
                                                                    </>
                                                                )}
                                                                {item?.media_urls?.length > 1 && (
                                                                    <>
                                                                        <i className="fas fa-images ms-2 me-1" aria-hidden="true" />
                                                                        {item.media_urls.length} media
                                                                    </>
                                                                )}
                                                            </small>
                                                        </div>
                                                        <div className={styles['content-actions']}>
                                                            {item?.attached_products?.length ? (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-primary btn-sm"
                                                                    onClick={handleShopFromContent}
                                                                >
                                                                    <i className="fas fa-shopping-bag me-1" aria-hidden="true" />
                                                                    Shop Products
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-12">
                                        <div className="alert alert-info text-center">
                                            <i className="fas fa-info-circle me-2" aria-hidden="true" />
                                            No content available for this campaign.
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>

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