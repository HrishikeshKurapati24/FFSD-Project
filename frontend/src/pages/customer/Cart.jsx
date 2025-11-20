import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../../styles/cart.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';

const EXTERNAL_ASSETS = {
    styles: [
        'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
    ],
    scripts: ['https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js']
};

const DEFAULT_PRODUCT_IMAGE = '/images/default-product.jpg';

const Cart = () => {
    useExternalAssets(EXTERNAL_ASSETS);
    const navigate = useNavigate();
    const [cartData, setCartData] = useState({
        items: [],
        subtotal: 0,
        shipping: 0,
        total: 0,
        title: 'Your Cart'
    });
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        cardNumber: '',
        expMonth: '',
        expYear: '',
        cvv: ''
    });

    const showAlert = useCallback((type, message) => {
        setAlert({ type, message });
    }, []);

    useEffect(() => {
        if (!alert.message) {
            return;
        }
        const timeout = window.setTimeout(() => {
            setAlert({ type: '', message: '' });
        }, alert.type === 'success' ? 3000 : 4000);

        return () => window.clearTimeout(timeout);
    }, [alert]);

    const fetchCart = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/customer/cart`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    Accept: 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Unable to load cart at the moment.');
            }

            const data = await response.json();
            setCartData({
                items: Array.isArray(data?.items) ? data.items : [],
                subtotal: data?.subtotal ?? 0,
                shipping: data?.shipping ?? 0,
                total: data?.total ?? 0,
                title: data?.title || 'Your Cart'
            });
            document.title = `${data?.title || 'Your Cart'} - CollabSync`;
            setErrorMessage('');
        } catch (error) {
            console.error('Error loading cart:', error);
            setErrorMessage(error.message || 'Unable to load cart at the moment.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadCart = async () => {
            if (!isMounted) {
                return;
            }
            await fetchCart();
        };

        loadCart();

        return () => {
            isMounted = false;
        };
    }, [fetchCart]);

    const handleRemoveItem = useCallback(
        async (productId) => {
            try {
                const response = await fetch(`${API_BASE_URL}/customer/cart/remove`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    body: JSON.stringify({ productId })
                });

                const data = await response.json();
                if (response.ok && data?.success) {
                    showAlert('success', data?.message || 'Item removed');
                    await fetchCart();
                } else {
                    throw new Error(data?.message || 'Failed to remove item');
                }
            } catch (error) {
                console.error('Remove item error:', error);
                showAlert('danger', error.message || 'Failed to remove item');
            }
        },
        [fetchCart, showAlert]
    );

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckout = async () => {
        const { name, email, phone, address, cardNumber, expMonth, expYear, cvv } = formData;

        if (!name.trim() || !email.trim()) {
            showAlert('danger', 'Please provide your name and email to proceed.');
            return;
        }

        const payload = {
            customerInfo: {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                address: address.trim()
            },
            paymentInfo: {
                cardNumber: cardNumber.trim(),
                expMonth: expMonth.trim(),
                expYear: expYear.trim(),
                cvv: cvv.trim()
            }
        };

        try {
            const response = await fetch(`${API_BASE_URL}/customer/checkout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok && data?.success) {
                showAlert('success', data?.message || 'Payment completed successfully!');
                await fetchCart();
                navigate('/customer');
            } else {
                throw new Error(data?.message || 'Checkout failed');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            showAlert('danger', error.message || 'Checkout failed');
        }
    };

    const items = useMemo(() => cartData.items || [], [cartData.items]);
    const isEmpty = !items.length;
    const formatCurrency = (value) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

    return (
        <div className={styles.cartPage}>
            <nav className={`navbar navbar-light bg-light ${styles.navbar}`}>
                <div className="container d-flex align-items-center">
                    <Link className="navbar-brand fw-bold" to="/" aria-label="CollabSync home">
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
                    <Link className="btn btn-outline-primary" to="/customer">
                        Continue Shopping
                    </Link>
                </div>
            </nav>

            <div className={`container my-4 ${styles['cart-container']}`}>
                <h1 className={`${styles['cart-title']} mb-4`}>{cartData.title}</h1>

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
                ) : isEmpty ? (
                    <div className={styles['empty-cart']}>
                        <i className={`fas fa-shopping-cart ${styles['empty-cart-icon']}`} aria-hidden="true" />
                        <h3 className={styles['empty-cart-title']}>Your cart is empty</h3>
                        <p className={styles['empty-cart-text']}>Add some products to get started!</p>
                        <Link className="btn btn-primary" to="/customer">
                            Browse Campaigns
                        </Link>
                    </div>
                ) : (
                    <div className="row">
                        <div className="col-lg-8">
                            <ul className="list-group mb-3">
                                {items.map((item) => (
                                    <li
                                        key={item.productId}
                                        className={`list-group-item d-flex align-items-center ${styles['cart-item']}`}
                                    >
                                        <img
                                            src={item.image || DEFAULT_PRODUCT_IMAGE}
                                            alt={item.name || 'Product'}
                                            className={`me-3 ${styles['cart-item-image']}`}
                                            onError={(event) => {
                                                event.currentTarget.onerror = null;
                                                event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                                            }}
                                        />
                                        <div className={`flex-grow-1 ${styles['cart-item-info']}`}>
                                            <div className={styles['cart-item-name']}>{item.name}</div>
                                            <small className={styles['cart-item-quantity']}>Qty: {item.quantity}</small>
                                        </div>
                                        <div className="text-end">
                                            <div className={styles['cart-item-price']}>{formatCurrency(item.lineTotal)}</div>
                                            <button
                                                type="button"
                                                className={`btn btn-sm btn-outline-danger mt-2 ${styles['cart-item-remove']}`}
                                                onClick={() => handleRemoveItem(item.productId)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="col-lg-4">
                            <div className={`card mb-3 ${styles['summary-card']}`}>
                                <div className="card-body">
                                    <h5 className={styles['summary-title']}>Summary</h5>
                                    <div className={styles['summary-row']}>
                                        <span className={styles['summary-label']}>Subtotal</span>
                                        <span className={styles['summary-value']}>
                                            {formatCurrency(cartData.subtotal)}
                                        </span>
                                    </div>
                                    <div className={styles['summary-row']}>
                                        <span className={styles['summary-label']}>Shipping</span>
                                        <span className={styles['summary-value']}>
                                            {formatCurrency(cartData.shipping)}
                                        </span>
                                    </div>
                                    <hr />
                                    <div className={`${styles['summary-row']} ${styles['summary-total']}`}>
                                        <span>Total</span>
                                        <span>{formatCurrency(cartData.total)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={`card ${styles['customer-details-card']}`}>
                                <div className="card-body">
                                    <h5 className={styles['customer-details-title']}>Customer Details</h5>
                                    <div className="mb-2">
                                        <label htmlFor="custName" className="form-label">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            id="custName"
                                            name="name"
                                            className="form-control"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <label htmlFor="custEmail" className="form-label">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="custEmail"
                                            name="email"
                                            className="form-control"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <label htmlFor="custPhone" className="form-label">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            id="custPhone"
                                            name="phone"
                                            className="form-control"
                                            placeholder="+1 555 555 5555"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <label htmlFor="custAddress" className="form-label">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            id="custAddress"
                                            name="address"
                                            className="form-control"
                                            placeholder="Street, City, ZIP"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className={styles['payment-section']}>
                                        <h6 className={styles['payment-title']}>Payment Details</h6>
                                        <div className="mb-2">
                                            <label htmlFor="cardNumber" className="form-label">
                                                Card Number
                                            </label>
                                            <input
                                                type="text"
                                                id="cardNumber"
                                                name="cardNumber"
                                                className="form-control"
                                                placeholder="4111 1111 1111 1111"
                                                inputMode="numeric"
                                                value={formData.cardNumber}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="row g-2">
                                            <div className="col">
                                                <label htmlFor="expMonth" className="form-label">
                                                    Exp. Month
                                                </label>
                                                <input
                                                    type="text"
                                                    id="expMonth"
                                                    name="expMonth"
                                                    className="form-control"
                                                    placeholder="MM"
                                                    inputMode="numeric"
                                                    value={formData.expMonth}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="col">
                                                <label htmlFor="expYear" className="form-label">
                                                    Exp. Year
                                                </label>
                                                <input
                                                    type="text"
                                                    id="expYear"
                                                    name="expYear"
                                                    className="form-control"
                                                    placeholder="YYYY"
                                                    inputMode="numeric"
                                                    value={formData.expYear}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="col">
                                                <label htmlFor="cvv" className="form-label">
                                                    CVV
                                                </label>
                                                <input
                                                    type="password"
                                                    id="cvv"
                                                    name="cvv"
                                                    className="form-control"
                                                    placeholder="123"
                                                    inputMode="numeric"
                                                    value={formData.cvv}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className={`btn btn-primary checkout-btn w-100 mt-3 ${styles['checkout-btn']}`}
                                            onClick={handleCheckout}
                                        >
                                            <i className="fas fa-credit-card me-2" aria-hidden="true" />
                                            Checkout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;