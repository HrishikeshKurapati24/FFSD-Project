import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styles from '../../styles/subscription/payment.module.css';
import { API_BASE_URL } from '../../services/api';

const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error('Unable to load Razorpay checkout script'));
        document.body.appendChild(script);
    });

const Payment = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType');
    const planId = searchParams.get('planId');
    const billingCycle = searchParams.get('billingCycle');

    const [selectedPlan, setSelectedPlan] = useState(null);
    const [checkoutPrefill, setCheckoutPrefill] = useState({ name: '', email: '', contact: '' });
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userId || !planId || !billingCycle) {
            setError('Missing required parameters: userId, planId, or billingCycle');
            setLoading(false);
            return;
        }

        const fetchPaymentData = async () => {
            try {
                const typeParam = userType && userType !== 'undefined' && userType !== 'null'
                    ? `&userType=${userType}`
                    : '';

                const response = await fetch(
                    `${API_BASE_URL}/subscription/payment?userId=${userId}${typeParam}&planId=${planId}&billingCycle=${billingCycle}`,
                    {
                        method: 'GET',
                        credentials: 'include',
                        headers: { Accept: 'application/json' }
                    }
                );

                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.message || 'Failed to load payment page');
                }

                setSelectedPlan(data.selectedPlan || null);
                setCheckoutPrefill(data.checkoutPrefill || { name: '', email: '', contact: '' });
            } catch (err) {
                console.error('Error fetching payment data:', err);
                setError(err.message || 'Failed to load payment page');
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentData();
    }, [userId, userType, planId, billingCycle]);

    const amount = useMemo(() => {
        if (!selectedPlan) return 0;
        return billingCycle === 'monthly'
            ? Number(selectedPlan?.price?.monthly || 0)
            : Number(selectedPlan?.price?.yearly || 0);
    }, [selectedPlan, billingCycle]);

    const featureList = useMemo(() => {
        if (!selectedPlan?.features) return [];
        const features = selectedPlan.features;
        const list = [];

        if (features.maxCampaigns === -1) list.push('Unlimited campaigns');
        else list.push(`${features.maxCampaigns} campaigns`);

        if (features.maxInfluencers === -1) list.push('Unlimited influencer connections');
        else list.push(`${features.maxInfluencers} influencer connections`);

        if (features.maxBrands !== undefined) {
            if (features.maxBrands === -1) list.push('Unlimited brand connections');
            else list.push(`${features.maxBrands} brand connections`);
        }

        if (features.advancedAnalytics) list.push('Advanced analytics');
        if (features.prioritySupport) list.push('Priority support');
        if (features.customBranding) list.push('Custom branding');

        return list;
    }, [selectedPlan]);

    const handlePay = async () => {
        try {
            setError('');
            setProcessing(true);

            await loadRazorpayScript();

            const initiateResponse = await fetch(`${API_BASE_URL}/subscription/payment/initiate`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({ userId, userType, planId, billingCycle })
            });

            const initiateContentType = initiateResponse.headers.get('content-type') || '';
            if (!initiateContentType.includes('application/json')) {
                throw new Error('Unexpected initiate response from server');
            }

            const initiateData = await initiateResponse.json();
            if (!initiateResponse.ok || !initiateData?.success) {
                throw new Error(initiateData?.message || 'Failed to initiate payment');
            }
            if (!initiateData?.razorpayKeyId) {
                throw new Error('Razorpay key missing from server response');
            }
            if (!initiateData?.razorpayOrderId) {
                throw new Error('Razorpay order missing from server response');
            }

            const checkoutPayload = await new Promise((resolve, reject) => {
                const rzp = new window.Razorpay({
                    key: initiateData.razorpayKeyId,
                    amount: initiateData.amountPaise,
                    currency: initiateData.currency || 'INR',
                    name: 'CollabSync',
                    description: `${selectedPlan?.name || 'Plan'} Subscription`,
                    order_id: initiateData.razorpayOrderId,
                    prefill: initiateData.prefill || checkoutPrefill,
                    handler: (responsePayload) => resolve(responsePayload),
                    modal: {
                        ondismiss: () => reject(new Error('Payment was cancelled'))
                    },
                    theme: {
                        color: '#667eea'
                    }
                });
                rzp.open();
            });

            const confirmResponse = await fetch(`${API_BASE_URL}/subscription/payment/confirm`, {
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
                throw new Error(confirmData?.message || 'Failed to confirm payment');
            }

            const redirectPath = confirmData.redirectTo || '/subscription/manage';
            navigate(redirectPath);
        } catch (err) {
            console.error('Payment error:', err);
            setError(err.message || 'Payment failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className={styles['payment-page']}>
                <div className={styles['payment-container']}>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>Loading payment details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !selectedPlan) {
        return (
            <div className={styles['payment-page']}>
                <div className={styles['payment-container']}>
                    <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                        <p>{error}</p>
                        <button
                            onClick={() => navigate(`/subscription/select-plan?userId=${userId}${userType ? `&userType=${userType}` : ''}`)}
                            style={{ marginTop: '20px', padding: '10px 20px' }}
                        >
                            Back to Plans
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!selectedPlan) {
        return null;
    }

    return (
        <div className={styles['payment-page']}>
            <div className={styles['payment-container']}>
                <div className={styles['order-summary']}>
                    <h2>Order Summary</h2>
                    <div className={styles['plan-details']}>
                        <div className={styles['plan-name']}>{selectedPlan.name}</div>
                        <div className={styles['plan-price']}>
                            ₹{amount}
                            <span> / {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                        </div>
                        <ul className={styles['plan-features']}>
                            {featureList.map((feature, index) => (
                                <li key={index}>
                                    <i className="fas fa-check-circle" aria-hidden="true" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className={styles['total-section']}>
                        <div className={styles['total-row']}>
                            <span>Plan Amount</span>
                            <span>₹{amount}</span>
                        </div>
                        <div className={`${styles['total-row']} ${styles.final}`}>
                            <span>Total Payable</span>
                            <span>₹{amount}</span>
                        </div>
                    </div>
                </div>

                <div className={styles['payment-form']}>
                    <h2>Pay With Razorpay</h2>
                    {error ? <div className={styles['error-message']}>{error}</div> : null}

                    <div className={styles['security-info']}>
                        <i className="fas fa-shield-alt" aria-hidden="true" />
                        <span>
                            Secure Razorpay Checkout. Your card and OTP are never stored in this application.
                        </span>
                    </div>

                    <div className={styles['form-group']}>
                        <label>Name</label>
                        <input className={styles['form-control']} value={checkoutPrefill.name || ''} readOnly />
                    </div>
                    <div className={styles['form-group']}>
                        <label>Email</label>
                        <input className={styles['form-control']} value={checkoutPrefill.email || ''} readOnly />
                    </div>
                    <div className={styles['form-group']}>
                        <label>Phone</label>
                        <input className={styles['form-control']} value={checkoutPrefill.contact || ''} readOnly />
                    </div>

                    <button
                        type="button"
                        className={styles['payment-btn']}
                        onClick={handlePay}
                        disabled={processing}
                    >
                        {processing ? 'Processing...' : `Pay ₹${amount}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Payment;
