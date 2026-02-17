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
    scripts: ['https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js']
};

const DEFAULT_PRODUCT_IMAGE = '/images/default-product.png';

const Cart = () => {
    useExternalAssets(EXTERNAL_ASSETS);
    const navigate = useNavigate();
    const { cartItems, subtotal, shipping, total, loading, error: cartError, removeFromCart, clearCart } = useCart();
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [customerName, setCustomerName] = useState('');
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
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        cardNumber: '',
        expMonth: '',
        expYear: '',
        cvv: ''
    });

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
                        setIsAuthenticated(true);
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
            } catch (error) {
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
        validateField(name, value, nextState);
    };

    const validateField = (fieldName, value, currentState = formData) => {
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
            case 'cardNumber': {
                const digits = trimmed.replace(/\s+/g, '');
                if (!digits) {
                    message = 'Card number is required.';
                } else if (!/^\d{16}$/.test(digits)) {
                    message = 'Card number must be exactly 16 digits.';
                }
                break;
            }
            case 'expMonth': {
                const mm = parseInt(trimmed, 10);
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth() + 1;
                const yy = parseInt(currentState.expYear, 10);

                if (!trimmed) {
                    message = 'Expiry month is required.';
                } else if (Number.isNaN(mm) || mm < 1 || mm > 12) {
                    message = 'Enter a valid month (01–12).';
                } else if (!Number.isNaN(yy) && yy === currentYear && mm < currentMonth) {
                    message = 'Card has already expired.';
                } else {
                    // Clear expiry error on year if month is now valid
                    setErrors(prev => ({ ...prev, expYear: prev.expYear === 'Card has already expired.' ? '' : prev.expYear }));
                }
                break;
            }
            case 'expYear': {
                const yy = parseInt(trimmed, 10);
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth() + 1;
                const mm = parseInt(currentState.expMonth, 10);

                if (!trimmed) {
                    message = 'Expiry year is required.';
                } else if (Number.isNaN(yy) || trimmed.length !== 4) {
                    message = 'Enter a 4-digit year.';
                } else if (yy < currentYear) {
                    message = 'Card has already expired.';
                } else if (yy === currentYear && !Number.isNaN(mm) && mm < currentMonth) {
                    message = 'Card has already expired.';
                } else {
                    // Clear expiry error on month if year is now valid
                    setErrors(prev => ({ ...prev, expMonth: prev.expMonth === 'Card has already expired.' ? '' : prev.expMonth }));
                }
                break;
            }
            case 'cvv': {
                const digits = trimmed;
                if (!digits) {
                    message = 'CVV is required.';
                } else if (!/^\d{3}$/.test(digits)) {
                    message = 'CVV must be exactly 3 digits.';
                }
                break;
            }
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
        const { name, email, phone, address, cardNumber, expMonth, expYear, cvv } = formData;

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
            paymentInfo: {
                cardNumber: cardNumber.trim(),
                expMonth: expMonth.trim(),
                expYear: expYear.trim(),
                cvv: cvv.trim()
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
                // Clear cart in context after successful checkout
                clearCart();
                navigate('/customer');
            } else {
                throw new Error(data?.message || 'Checkout failed');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            showAlert('danger', error.message || 'Checkout failed');
        }
    };

    const items = useMemo(() => cartItems || [], [cartItems]);
    const isEmpty = !items.length;
    const formatCurrency = (value) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

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
                                        <h6 className={styles['payment-title']}>Payment Details</h6>
                                        <div className="mb-2">
                                            <label htmlFor="cardNumber" className="form-label">
                                                Card Number
                                            </label>
                                            <input
                                                type="text"
                                                id="cardNumber"
                                                name="cardNumber"
                                                className={`form-control ${errors.cardNumber ? 'is-invalid' : ''}`}
                                                placeholder="4111 1111 1111 1111"
                                                inputMode="numeric"
                                                value={formData.cardNumber}
                                                onChange={handleInputChange}
                                            />
                                            {errors.cardNumber && (
                                                <div className="invalid-feedback">{errors.cardNumber}</div>
                                            )}
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
                                                    className={`form-control ${errors.expMonth ? 'is-invalid' : ''}`}
                                                    placeholder="MM"
                                                    inputMode="numeric"
                                                    value={formData.expMonth}
                                                    onChange={handleInputChange}
                                                />
                                                {errors.expMonth && (
                                                    <div className="invalid-feedback">{errors.expMonth}</div>
                                                )}
                                            </div>
                                            <div className="col">
                                                <label htmlFor="expYear" className="form-label">
                                                    Exp. Year
                                                </label>
                                                <input
                                                    type="text"
                                                    id="expYear"
                                                    name="expYear"
                                                    className={`form-control ${errors.expYear ? 'is-invalid' : ''}`}
                                                    placeholder="YYYY"
                                                    inputMode="numeric"
                                                    value={formData.expYear}
                                                    onChange={handleInputChange}
                                                />
                                                {errors.expYear && (
                                                    <div className="invalid-feedback">{errors.expYear}</div>
                                                )}
                                            </div>
                                            <div className="col">
                                                <label htmlFor="cvv" className="form-label">
                                                    CVV
                                                </label>
                                                <input
                                                    type="password"
                                                    id="cvv"
                                                    name="cvv"
                                                    className={`form-control ${errors.cvv ? 'is-invalid' : ''}`}
                                                    placeholder="123"
                                                    inputMode="numeric"
                                                    value={formData.cvv}
                                                    onChange={handleInputChange}
                                                />
                                                {errors.cvv && (
                                                    <div className="invalid-feedback">{errors.cvv}</div>
                                                )}
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
