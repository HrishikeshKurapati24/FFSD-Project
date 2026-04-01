import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../../styles/customer/cart.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import { useCart } from '../../contexts/CartContext';
import CustomerNavbar from '../../components/customer/CustomerNavbar';

const EXTERNAL_ASSETS = {
    styles: [
        'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
    ],
    scripts: [
        'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js',
        'https://checkout.razorpay.com/v1/checkout.js'
    ]
};

const DEFAULT_PRODUCT_IMAGE = '/images/default-product.png';

const Cart = () => {
    useExternalAssets(EXTERNAL_ASSETS);
    const navigate = useNavigate();
    const { cartItems, subtotal, shipping, total, loading, error: cartError, removeFromCart, clearCart } = useCart();
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [customerName, setCustomerName] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Check authentication on mount (optional - don't redirect if not authenticated)
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
                        setCustomerName(data.user?.displayName || '');
                        // Pre-fill form with customer info if authenticated
                        if (data.user?.email) {
                            setFormData(prev => ({
                                ...prev,
                                email: data.user.email || prev.email,
                                name: data.user.displayName || data.user.name || prev.name
                            }));
                        }
                    }
                }
            } catch (_error) {
                // Silently fail - user can still checkout as guest
                console.log('Auth check optional - user can checkout as guest');
            }
        };

        checkAuth();
    }, []);

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

    // Set document title
    useEffect(() => {
        document.title = 'Your Cart - CollabSync';
    }, []);

    const handleRemoveItem = useCallback(
        async (productId) => {
            const result = await removeFromCart(productId);
            if (result.success) {
                showAlert('success', result.message || 'Item removed');
            } else {
                showAlert('danger', result.message || 'Failed to remove item');
            }
        },
        [removeFromCart, showAlert]
    );

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        const nextState = {
            ...formData,
            [name]: value
        };
        setFormData(nextState);

        // Live-validate individual field using the next state
        validateField(name, value);
    };

    const validateField = (fieldName, value) => {
        let message = '';
        const trimmed = value.trim();

        switch (fieldName) {
            case 'name':
                if (!trimmed) {
                    message = 'Full name is required.';
                } else if (trimmed.length < 2) {
                    message = 'Name must be at least 2 characters.';
                } else if (/\d/.test(trimmed)) {
                    message = 'Full name should not contain digits.';
                }
                break;
            case 'email':
                if (!trimmed) {
                    message = 'Email is required.';
                } else if (!trimmed.endsWith('@gmail.com')) {
                    message = 'Email must end with @gmail.com.';
                } else {
                    const localPart = trimmed.slice(0, trimmed.indexOf('@'));
                    if (!localPart || localPart.length < 1) {
                        message = 'Please enter a valid email address.';
                    }
                }
                break;
            case 'phone':
                if (!trimmed) {
                    message = 'Phone number is required.';
                } else {
                    const digits = trimmed.replace(/\D/g, '');
                    if (digits.length !== 10) {
                        message = 'Phone number must be exactly 10 digits.';
                    }
                }
                break;
            case 'address':
                if (!trimmed) {
                    message = 'Address is required for delivery.';
                }
                break;
            default:
                break;
        }

        setErrors((prev) => ({
            ...prev,
            [fieldName]: message
        }));

        return message;
    };

    const validateForm = () => {
        const newErrors = {};
        Object.entries(formData).forEach(([key, value]) => {
            newErrors[key] = validateField(key, value);
        });

        // Check if any errors
        const hasError = Object.values(newErrors).some((msg) => msg);
        return !hasError;
    };

    const handleCheckout = async () => {
        const { name, email, phone, address } = formData;

        // Run full validation before checkout
        const isValid = validateForm();
        if (!isValid) {
            showAlert('danger', 'Please fix the highlighted fields before proceeding.');
            return;
        }

        // Prepare cart items in the format expected by backend (from session structure)
        const cartDataForBackend = items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
        }));

        const payload = {
            customerInfo: {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                address: address.trim()
            },
            cart: cartDataForBackend, // Send cart data from context since backend reads from session
            referralCode: (() => {
                try {
                    return localStorage.getItem('referralCode') || undefined;
                } catch {
                    return undefined;
                }
            })()
        };

        try {
            setIsCheckingOut(true);
            const initiateResponse = await fetch(`${API_BASE_URL}/customer/checkout/initiate`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const initiateData = await initiateResponse.json();
            if (!initiateResponse.ok || !initiateData?.success) {
                throw new Error(initiateData?.message || 'Checkout initiation failed');
            }

            if (!window.Razorpay) {
                throw new Error('Razorpay checkout failed to load');
            }

            const checkoutPayload = await new Promise((resolve, reject) => {
                const rzp = new window.Razorpay({
                    key: initiateData.razorpayKeyId,
                    amount: initiateData.amountPaise,
                    currency: initiateData.currency || 'INR',
                    order_id: initiateData.razorpayOrderId,
                    name: 'CollabSync',
                    description: 'Customer cart checkout',
                    prefill: initiateData.prefill || {
                        name: name.trim(),
                        email: email.trim(),
                        contact: phone.trim()
                    },
                    handler: (responsePayload) => resolve(responsePayload),
                    modal: {
                        ondismiss: () => reject(new Error('Payment was cancelled'))
                    },
                    theme: {
                        color: '#111827'
                    }
                });
                rzp.open();
            });

            const confirmResponse = await fetch(`${API_BASE_URL}/customer/checkout/confirm`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    paymentIntentId: initiateData.paymentIntentId,
                    razorpay_order_id: checkoutPayload.razorpay_order_id,
                    razorpay_payment_id: checkoutPayload.razorpay_payment_id,
                    razorpay_signature: checkoutPayload.razorpay_signature
                })
            });

            const confirmData = await confirmResponse.json();
            if (!confirmResponse.ok || !confirmData?.success) {
                throw new Error(confirmData?.message || 'Checkout confirmation failed');
            }

            showAlert('success', confirmData?.message || 'Payment completed successfully!');
            clearCart();
            navigate('/customer');
        } catch (error) {
            console.error('Checkout error:', error);
            showAlert('danger', error.message || 'Checkout failed');
        } finally {
            setIsCheckingOut(false);
        }
    };

    const items = useMemo(() => cartItems || [], [cartItems]);
    const isEmpty = !items.length;
    const formatCurrency = (value) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);

    // No need to block unauthenticated users - they can checkout as guests

    return (
        <div className={styles.cartPage}>
            <CustomerNavbar
                rightAction={
                    <Link className="btn btn-outline-primary" to="/customer">
                        Continue Shopping
                    </Link>
                }
                customerName={customerName}
            />

            <div className={`container my-4 ${styles['cart-container']}`}>
                <h1 className={`${styles['cart-title']} mb-4`}>Your Cart</h1>

                {alert.message && (
                    <div className={`alert alert-${alert.type === 'success' ? 'success' : 'danger'}`} role="alert">
                        {alert.message}
                    </div>
                )}

                {cartError && (
                    <div className="alert alert-danger" role="alert">
                        {cartError}
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
                                            {formatCurrency(subtotal)}
                                        </span>
                                    </div>
                                    <div className={styles['summary-row']}>
                                        <span className={styles['summary-label']}>Shipping</span>
                                        <span className={styles['summary-value']}>
                                            {formatCurrency(shipping)}
                                        </span>
                                    </div>
                                    <hr />
                                    <div className={`${styles['summary-row']} ${styles['summary-total']}`}>
                                        <span>Total</span>
                                        <span>{formatCurrency(total)}</span>
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
                                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {errors.name && (
                                            <div className="invalid-feedback">{errors.name}</div>
                                        )}
                                    </div>
                                    <div className="mb-2">
                                        <label htmlFor="custEmail" className="form-label">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="custEmail"
                                            name="email"
                                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {errors.email && (
                                            <div className="invalid-feedback">{errors.email}</div>
                                        )}
                                    </div>
                                    <div className="mb-2">
                                        <label htmlFor="custPhone" className="form-label">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            id="custPhone"
                                            name="phone"
                                            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                            placeholder="+1 555 555 5555"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                        />
                                        {errors.phone && (
                                            <div className="invalid-feedback">{errors.phone}</div>
                                        )}
                                    </div>
                                    <div className="mb-2">
                                        <label htmlFor="custAddress" className="form-label">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            id="custAddress"
                                            name="address"
                                            className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                                            placeholder="Street, City, ZIP"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                        />
                                        {errors.address && (
                                            <div className="invalid-feedback">{errors.address}</div>
                                        )}
                                    </div>

                                    <div className={styles['payment-section']}>
                                        <h6 className={styles['payment-title']}>Razorpay Checkout</h6>
                                        <p className="mb-2">
                                            Checkout opens Razorpay in test mode and confirms order only after signature verification.
                                        </p>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary w-100 mb-2"
                                            onClick={() => navigate('/customer/profile')}
                                        >
                                            Update Optional Billing Profile
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-primary checkout-btn w-100 mt-3 ${styles['checkout-btn']}`}
                                            onClick={handleCheckout}
                                            disabled={isCheckingOut}
                                        >
                                            <i className="fas fa-credit-card me-2" aria-hidden="true" />
                                            {isCheckingOut ? 'Processing...' : 'Checkout'}
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
