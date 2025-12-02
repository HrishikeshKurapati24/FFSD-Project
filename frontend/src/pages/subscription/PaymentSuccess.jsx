import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styles from '../../styles/subscription/payment-success.module.css';
import { API_BASE_URL } from '../../services/api';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const transactionId = searchParams.get('transactionId');
    
    const [paymentData, setPaymentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        if (!transactionId) {
            setError('Missing transaction ID');
            setLoading(false);
            return;
        }

        const fetchPaymentData = async () => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/subscription/payment-success?transactionId=${transactionId}`,
                    {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch payment data');
                }

                const data = await response.json();
                if (data.success) {
                    setPaymentData({
                        planName: data.planName,
                        billingCycle: data.billingCycle,
                        amount: data.amount,
                        transactionId: data.transactionId,
                        features: data.features || []
                    });
                } else {
                    setError(data.message || 'Failed to load payment details');
                }
            } catch (err) {
                console.error('Error fetching payment data:', err);
                setError('Failed to load payment details');
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentData();
    }, [transactionId]);

    // Countdown and auto-redirect
    useEffect(() => {
        if (!paymentData) return;

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    navigate('/signin');
                    return 0;
                }
                return prev - 1;
            });
    }, 1000);

        return () => clearInterval(interval);
    }, [paymentData, navigate]);

    if (loading) {
        return (
            <div className={styles['payment-success-page']}>
                <div className={styles['success-container']}>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>Loading payment details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !paymentData) {
    return (
            <div className={styles['payment-success-page']}>
                <div className={styles['success-container']}>
                    <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                        <p>{error || 'Payment details not found'}</p>
                        <button 
                            onClick={() => navigate('/signin')}
                            style={{ marginTop: '20px', padding: '10px 20px' }}
                        >
                            Go to Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles['payment-success-page']}>
            <div className={styles['success-container']}>
                <div className={styles['success-icon']}>
                    <i className="fas fa-check"></i>
            </div>

                <h1 className={styles['success-title']}>Payment Successful!</h1>
                <p className={styles['success-message']}>
                    Thank you for upgrading to {paymentData.planName}! Your subscription has been activated and you now have access to
                all premium features.
            </p>

                <div className={styles['transaction-details']}>
                    <div className={styles['detail-row']}>
                        <span className={styles['detail-label']}>Plan:</span>
                        <span className={styles['detail-value']}>
                            {paymentData.planName}
                    </span>
                </div>
                    <div className={styles['detail-row']}>
                        <span className={styles['detail-label']}>Billing Cycle:</span>
                        <span className={styles['detail-value']}>
                            {paymentData.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                    </span>
                </div>
                    <div className={styles['detail-row']}>
                        <span className={styles['detail-label']}>Amount Paid:</span>
                        <span className={styles['detail-value']}>${paymentData.amount}</span>
                </div>
                    <div className={styles['detail-row']}>
                        <span className={styles['detail-label']}>Transaction ID:</span>
                        <span className={styles['detail-value']}>
                            {paymentData.transactionId}
                    </span>
                </div>
                    <div className={styles['detail-row']}>
                        <span className={styles['detail-label']}>Status:</span>
                        <span className={styles['detail-value']} style={{ color: '#28a745' }}>Active</span>
                </div>
            </div>

                <div className={styles['action-buttons']}>
                    <a 
                        href="/signin"
                        className={`${styles.btn} ${styles['btn-primary']}`}
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/signin');
                        }}
                    >
                        <i className="fas fa-sign-in-alt"></i>
                    Continue to Dashboard
                </a>
                    <a 
                        href="/subscription/manage"
                        className={`${styles.btn} ${styles['btn-secondary']}`}
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/subscription/manage');
                        }}
                    >
                        <i className="fas fa-cog"></i>
                    Manage Subscription
                </a>
            </div>

                {paymentData.features && paymentData.features.length > 0 && (
                    <div className={styles['features-preview']}>
                        <h3 className={styles['features-title']}>
                            <i className="fas fa-star"></i>
                    Your New Features
                </h3>
                        <ul className={styles['features-list']}>
                            {paymentData.features.map((feature, index) => (
                                <li key={index}>
                                    <i className="fas fa-check-circle"></i>
                                    {feature}
                        </li>
                            ))}
                </ul>
                    </div>
                )}

                <div className={styles.countdown}>
                    Redirecting to sign in in {countdown} seconds...
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
