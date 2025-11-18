import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styles from '../../styles/payment.module.css';
import { API_BASE_URL } from '../../services/api';

const Payment = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType');
    const planId = searchParams.get('planId');
    const billingCycle = searchParams.get('billingCycle');
    
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [lastPaymentDetails, setLastPaymentDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(true);
    
    // Form state
    const [formData, setFormData] = useState({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
        billingAddress: ''
    });

    useEffect(() => {
        if (!userId || !userType || !planId || !billingCycle) {
            setError('Missing required parameters');
            setLoading(false);
            return;
        }

        const fetchPaymentData = async () => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/subscription/payment?userId=${userId}&userType=${userType}&planId=${planId}&billingCycle=${billingCycle}`,
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
                    setSelectedPlan(data.selectedPlan);
                    setLastPaymentDetails(data.lastPaymentDetails);
                    
                    // Pre-fill form if last payment details exist
                    if (data.lastPaymentDetails) {
                        setFormData({
                            cardNumber: data.lastPaymentDetails.cardNumber || '',
                            cardName: data.lastPaymentDetails.cardName || '',
                            expiryDate: data.lastPaymentDetails.expiryDate || '',
                            cvv: '',
                            billingAddress: data.lastPaymentDetails.billingAddress || ''
                        });
                    }
                } else {
                    setError(data.message || 'Failed to load payment page');
                }
            } catch (err) {
                console.error('Error fetching payment data:', err);
                setError('Failed to load payment page');
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentData();
    }, [userId, userType, planId, billingCycle]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCardNumberChange = (e) => {
        let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        setFormData(prev => ({ ...prev, cardNumber: formattedValue }));
    };

    const handleExpiryDateChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        setFormData(prev => ({ ...prev, expiryDate: value }));
    };

    const handleCvvChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, cvv: value }));
    };

    const validateForm = () => {
        const cardNumber = formData.cardNumber.replace(/\s/g, '');
        const expiryDate = formData.expiryDate;
        const cvv = formData.cvv;

        if (cardNumber.length < 13 || cardNumber.length > 19) {
            setError('Please enter a valid card number');
            return false;
        }

        if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
            setError('Please enter a valid expiry date (MM/YY)');
            return false;
        }

        // Validate expiry date is in the future
        const [month, year] = expiryDate.split('/').map(num => parseInt(num, 10));
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear() % 100;

        if (month < 1 || month > 12) {
            setError('Please enter a valid month (01-12)');
            return false;
        }

        if (year < currentYear || (year === currentYear && month < currentMonth)) {
            setError('Card expiry date must be in the future');
            return false;
        }

        if (cvv.length < 3 || cvv.length > 4) {
            setError('Please enter a valid CVV');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setShowForm(false);

        try {
            const amount = billingCycle === 'monthly' 
                ? selectedPlan.price.monthly 
                : selectedPlan.price.yearly;

            const cardData = {
                cardNumber: formData.cardNumber.replace(/\s/g, ''),
                cardName: formData.cardName,
                expiryDate: formData.expiryDate,
                cvv: formData.cvv,
                billingAddress: formData.billingAddress
            };

            const response = await fetch(`${API_BASE_URL}/subscription/process-payment`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    userType,
                    planId,
                    billingCycle,
                    amount,
                    cardData
                })
            });

            const result = await response.json();

            if (result.success) {
                setTimeout(() => {
                    if (result.redirectTo) {
                        const redirectPath = result.redirectTo.startsWith('http')
                            ? new URL(result.redirectTo).pathname + new URL(result.redirectTo).search
                            : result.redirectTo;
                        navigate(redirectPath);
                    } else {
                        alert('Payment successful! Your subscription has been activated.');
                        navigate('/signin?message=subscription-success');
                    }
                }, 2000);
            } else {
                throw new Error(result.message || 'Payment failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            setError(error.message || 'Payment failed. Please try again.');
            setShowForm(true);
            setIsSubmitting(false);
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
                            onClick={() => navigate(`/subscription/select-plan?userId=${userId}&userType=${userType}`)}
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

    const amount = billingCycle === 'monthly' ? selectedPlan.price.monthly : selectedPlan.price.yearly;

    return (
        <div className={styles['payment-page']}>
            <div className={styles['payment-container']}>
                {/* Order Summary */}
                <div className={styles['order-summary']}>
                    <h2><i className="fas fa-receipt"></i> Order Summary</h2>

                    <div className={styles['plan-details']}>
                        <div className={styles['plan-name']}>
                            {selectedPlan.name} Plan
                        </div>
                        <div className={styles['plan-price']}>
                            ${amount}
                            <span>/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                        </div>

                        <ul className={styles['plan-features']}>
                            {userType === 'brand' ? (
                                <>
                                    <li>
                                        <i className="fas fa-check"></i>
                                        {selectedPlan.features.maxCampaigns === -1 ? 'Unlimited' : selectedPlan.features.maxCampaigns} Campaigns
                                    </li>
                                    <li>
                                        <i className="fas fa-check"></i>
                                        {selectedPlan.features.maxInfluencers === -1 ? 'Unlimited' : selectedPlan.features.maxInfluencers} Influencer Connections
                                    </li>
                                </>
                            ) : (
                                <li>
                                    <i className="fas fa-check"></i>
                                    {selectedPlan.features.maxBrands === -1 ? 'Unlimited' : selectedPlan.features.maxBrands} Brand Connections
                                </li>
                            )}
                            {selectedPlan.features.analytics && (
                                <li><i className="fas fa-check"></i> Basic Analytics</li>
                            )}
                            {selectedPlan.features.advancedAnalytics && (
                                <li><i className="fas fa-check"></i> Advanced Analytics</li>
                            )}
                            {selectedPlan.features.prioritySupport && (
                                <li><i className="fas fa-check"></i> Priority Support</li>
                            )}
                        </ul>
                    </div>

                    <div className={styles['total-section']}>
                        <div className={styles['total-row']}>
                            <span>Subtotal:</span>
                            <span>${amount}</span>
                        </div>
                        <div className={styles['total-row']}>
                            <span>Tax:</span>
                            <span>$0.00</span>
                        </div>
                        <div className={`${styles['total-row']} ${styles.final}`}>
                            <span>Total:</span>
                            <span>${amount}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Form */}
                <div className={styles['payment-form']}>
                    <a 
                        href={`/subscription/select-plan?userId=${userId}&userType=${userType}`}
                        className={styles['back-btn']}
                        onClick={(e) => {
                            e.preventDefault();
                            navigate(`/subscription/select-plan?userId=${userId}&userType=${userType}`);
                        }}
                    >
                        <i className="fas fa-arrow-left"></i> Back to Plans
                    </a>

                    <h2><i className="fas fa-credit-card"></i> Payment Details</h2>

                    {lastPaymentDetails && lastPaymentDetails.cardName && (
                        <div className={styles['saved-payment-info']}>
                            <i className="fas fa-info-circle"></i>
                            <span>We found your previous payment details. Fields have been pre-filled to save you time!</span>
                        </div>
                    )}

                    {error && (
                        <div className={styles['error-message']}>
                            {error}
                        </div>
                    )}

                    {showForm ? (
                        <form onSubmit={handleSubmit}>
                            <div className={styles['form-group']}>
                                <label htmlFor="cardNumber">Card Number</label>
                                <input
                                    type="text"
                                    id="cardNumber"
                                    name="cardNumber"
                                    className={styles['form-control']}
                                    placeholder="1234 5678 9012 3456"
                                    maxLength="19"
                                    value={formData.cardNumber}
                                    onChange={handleCardNumberChange}
                                    required
                                />
                                {lastPaymentDetails && lastPaymentDetails.cardNumber && (
                                    <small className={styles['form-hint']}>
                                        <i className="fas fa-check-circle"></i> Auto-filled from your last payment
                                    </small>
                                )}
                            </div>

                            <div className={styles['form-group']}>
                                <label htmlFor="cardName">Cardholder Name</label>
                                <input
                                    type="text"
                                    id="cardName"
                                    name="cardName"
                                    className={styles['form-control']}
                                    placeholder="John Doe"
                                    value={formData.cardName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className={styles['form-row']}>
                                <div className={styles['form-group']}>
                                    <label htmlFor="expiryDate">Expiry Date</label>
                                    <input
                                        type="text"
                                        id="expiryDate"
                                        name="expiryDate"
                                        className={styles['form-control']}
                                        placeholder="MM/YY"
                                        maxLength="5"
                                        value={formData.expiryDate}
                                        onChange={handleExpiryDateChange}
                                        required
                                    />
                                </div>
                                <div className={styles['form-group']}>
                                    <label htmlFor="cvv">CVV</label>
                                    <input
                                        type="text"
                                        id="cvv"
                                        name="cvv"
                                        className={styles['form-control']}
                                        placeholder="123"
                                        maxLength="4"
                                        value={formData.cvv}
                                        onChange={handleCvvChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles['form-group']}>
                                <label htmlFor="billingAddress">Billing Address</label>
                                <input
                                    type="text"
                                    id="billingAddress"
                                    name="billingAddress"
                                    className={styles['form-control']}
                                    placeholder="123 Main St, City, State, ZIP"
                                    value={formData.billingAddress}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className={styles['security-info']}>
                                <i className="fas fa-shield-alt"></i>
                                <span>Your payment information is encrypted and secure. We never store your card details.</span>
                            </div>

                            <button 
                                type="submit" 
                                className={styles['payment-btn']}
                                disabled={isSubmitting}
                            >
                                <i className="fas fa-lock"></i> Complete Payment - ${amount}
                            </button>
                        </form>
                    ) : (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Processing your payment...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Payment;
