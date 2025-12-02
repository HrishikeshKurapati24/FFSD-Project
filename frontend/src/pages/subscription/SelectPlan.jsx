import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styles from '../../styles/subscription/select-plan.module.css';
import { API_BASE_URL } from '../../services/api';

const SelectPlan = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType');
    
    const [availablePlans, setAvailablePlans] = useState([]);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!userId || !userType) {
            setError('Missing userId or userType');
            setLoading(false);
            return;
        }

        const fetchPlans = async () => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/subscription/select-plan?userId=${userId}&userType=${userType}`,
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
                    throw new Error('Failed to fetch plans');
                }

                const data = await response.json();
                if (data.success) {
                    setAvailablePlans(data.availablePlans || []);
                } else {
                    setError(data.message || 'Failed to load plans');
                }
            } catch (err) {
                console.error('Error fetching plans:', err);
                setError('Failed to load subscription plans');
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, [userId, userType]);

    const handleBillingChange = (e) => {
        setBillingCycle(e.target.value);
    };

    const handleSubscribe = async (planId) => {
        if (!userId || !userType) {
            alert('Missing user information');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/subscription/subscribe-after-signup`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    planId,
                    billingCycle,
                    userId,
                    userType
                })
            });

            const result = await response.json();

            if (result.success) {
                if (result.redirectTo) {
                    // Extract path from redirectTo URL
                    const redirectPath = result.redirectTo.startsWith('http') 
                        ? new URL(result.redirectTo).pathname + new URL(result.redirectTo).search
                        : result.redirectTo;
                    navigate(redirectPath);
                } else {
                    alert('Subscription created successfully! Redirecting to sign-in...');
                    navigate('/signin');
                }
            } else {
                alert(result.message || 'Failed to create subscription');
            }
        } catch (error) {
            console.error('Error subscribing to plan:', error);
            alert('An error occurred while subscribing');
        } finally {
            setIsSubmitting(false);
    }
    };

    if (loading) {
        return (
            <div className={styles['select-plan-page']}>
                <div className={styles.container}>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p>Loading plans...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles['select-plan-page']}>
                <div className={styles.container}>
                    <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                        <p>{error}</p>
                        <button onClick={() => navigate('/signin')} style={{ marginTop: '20px', padding: '10px 20px' }}>
                            Go to Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles['select-plan-page']}>
            {/* Welcome Section */}
            <div className={styles['welcome-section']}>
                <h1>Welcome to CollabSync!</h1>
                <p>Your account has been created successfully. Now choose the perfect plan for your needs.</p>
            </div>

            <div className={styles.container}>
                {/* Free Plan Notice */}
                <div className={styles['free-plan-notice']}>
                    <h3><i className="fas fa-gift"></i> Start with Our Free Plan</h3>
                    <p>You can start using CollabSync immediately with our free plan and upgrade anytime!</p>
                    <div className={styles['free-limits']}>
                        <div className={styles['free-limit-item']}>
                            <strong>2</strong> Campaigns
                        </div>
                        <div className={styles['free-limit-item']}>
                            <strong>2</strong> {userType === 'brand' ? 'Collaborations' : 'Brand Connections'}
                        </div>
                        <div className={styles['free-limit-item']}>
                            <strong>Basic</strong> Analytics
                        </div>
                    </div>
                </div>

                {/* Available Plans */}
                <div className={styles['available-plans']}>
                    <h2>Upgrade to Premium Plans</h2>
                    <div className={styles['billing-toggle']}>
                        <label className={styles['toggle-switch']}>
                            <input 
                                type="radio" 
                                name="billing" 
                                value="monthly" 
                                checked={billingCycle === 'monthly'}
                                onChange={handleBillingChange}
                            />
                                <span>Monthly</span>
                        </label>
                        <label className={styles['toggle-switch']}>
                            <input 
                                type="radio" 
                                name="billing" 
                                value="yearly"
                                checked={billingCycle === 'yearly'}
                                onChange={handleBillingChange}
                            />
                            <span>Yearly <span className={styles.discount}>Save 20%</span></span>
                        </label>
                    </div>

                    <div className={styles['plans-grid']}>
                        {availablePlans.map((plan) => (
                            <div 
                                key={plan._id} 
                                className={`${styles['plan-card']} ${plan.name.toLowerCase() === 'premium' ? styles.premium : ''}`}
                            >
                                <div className={styles['plan-header']}>
                                    <h3>{plan.name}</h3>
                                    {plan.popularBadge && (
                                        <span className={styles['popular-badge']}>Most Popular</span>
                                    )}
                                    <div className={styles.price}>
                                        <span className={styles['monthly-price']} style={{ display: billingCycle === 'yearly' ? 'none' : 'block' }}>
                                            ${plan.price.monthly}<span>/month</span>
                                        </span>
                                        <span className={styles['yearly-price']} style={{ display: billingCycle === 'yearly' ? 'block' : 'none' }}>
                                            ${plan.price.yearly}<span>/year</span>
                                        </span>
                                        </div>
                            </div>
    
                                <div className={styles['plan-description']}>
                                    <p>{plan.description}</p>
                            </div>
    
                                <div className={styles['plan-features']}>
                                <ul>
                                        {userType === 'brand' ? (
                                            <>
                                                <li>
                                                    <i className="fas fa-check"></i>
                                                    {plan.features.maxCampaigns === -1 ? 'Unlimited' : plan.features.maxCampaigns} Campaigns
                                        </li>
                                                <li>
                                                    <i className="fas fa-check"></i>
                                                    {plan.features.maxInfluencers === -1 ? 'Unlimited' : plan.features.maxInfluencers} Influencer Connections
                                        </li>
                                            </>
                                        ) : (
                                            <li>
                                                <i className="fas fa-check"></i>
                                                {plan.features.maxBrands === -1 ? 'Unlimited' : plan.features.maxBrands} Brand Connections
                                            </li>
                                        )}
                                        {plan.features.analytics && (
                                            <li><i className="fas fa-check"></i> Basic Analytics</li>
                                        )}
                                        {plan.features.advancedAnalytics && (
                                            <li><i className="fas fa-check"></i> Advanced Analytics</li>
                                        )}
                                        {plan.features.prioritySupport && (
                                            <li><i className="fas fa-check"></i> Priority Support</li>
                                        )}
                                        {plan.features.customBranding && (
                                            <li><i className="fas fa-check"></i> Custom Branding</li>
                                        )}
                                        {plan.features.apiAccess && (
                                            <li><i className="fas fa-check"></i> API Access</li>
                                        )}
                                </ul>
                            </div>
    
                                <button 
                                    className={styles['subscribe-btn']}
                                    onClick={() => handleSubscribe(plan._id)}
                                    disabled={isSubmitting}
                                >
                                    Choose {plan.name}
                            </button>
                        </div>
                        ))}
                    </div>
                </div>

                {/* Skip Section */}
                <div className={styles['skip-section']}>
                    <h3>Not ready to upgrade?</h3>
                    <p>You can start with our free plan and upgrade anytime from your dashboard.</p>
                    <a 
                        href="/signin" 
                        className={styles['skip-btn']}
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/signin');
                        }}
                    >
                        <i className="fas fa-arrow-right"></i> Continue with Free Plan
                    </a>
                </div>
            </div>
        </div>
    );
};

export default SelectPlan;
