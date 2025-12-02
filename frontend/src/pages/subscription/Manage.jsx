import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import styles from '../../styles/subscription/manage.module.css';
import { API_BASE_URL } from '../../services/api';
import { useExternalAssets } from '../../hooks/useExternalAssets';
import { useBrand } from '../../contexts/BrandContext';
import { useInfluencer } from '../../contexts/InfluencerContext';

const EXTERNAL_ASSETS = {
  styles: [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css'
  ],
  scripts: [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js'
  ]
};

const Manage = () => {
  useExternalAssets(EXTERNAL_ASSETS);
  const navigate = useNavigate();
  const location = useLocation();
  const { subscriptionStatus: brandSubStatus, subscriptionLimits: brandSubLimits, loading: brandLoading, error: brandError, brand, refreshBrand } = useBrand();
  const { subscriptionStatus: influencerSubStatus, subscriptionLimits: influencerSubLimits, loading: influencerLoading, error: influencerError, influencer, refreshInfluencer } = useInfluencer();

  // Determine user type from which context has data
  const userType = brand ? 'brand' : influencer ? 'influencer' : null;
  const subscriptionStatus = brandSubStatus || influencerSubStatus;
  const subscriptionLimits = brandSubLimits || influencerSubLimits;
  const user = brand || influencer;
  const subscriptionLoading = brandLoading || influencerLoading;
  const subscriptionError = brandError || influencerError;

  // Use subscriptionStatus as currentSubscription if it's the full subscription object
  // Otherwise construct it from subscriptionStatus and subscriptionLimits
  const currentSubscriptionFromContext = subscriptionStatus?.subscription || subscriptionStatus;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(currentSubscriptionFromContext || null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Combine loading states
  const overallLoading = subscriptionLoading || loading;
  const overallError = subscriptionError || error;

  // Update currentSubscription when context subscriptionStatus changes
  useEffect(() => {
    if (currentSubscriptionFromContext) {
      setCurrentSubscription(currentSubscriptionFromContext);
    }
  }, [currentSubscriptionFromContext]);

  // Fetch only availablePlans and paymentHistory (static/shared data)
  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/subscription/manage`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/SignIn');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load subscription data');
      }

      const data = await response.json();
      if (data.success) {
        // Only fetch static/shared data
        setAvailablePlans(data.availablePlans || []);
        setPaymentHistory(data.paymentHistory || []);
        // Use currentSubscription from context, but update if backend provides it
        if (data.currentSubscription && !currentSubscriptionFromContext) {
          setCurrentSubscription(data.currentSubscription);
        }
      } else if (data.availablePlans) {
        // Handle direct data in response (not wrapped in success)
        setAvailablePlans(data.availablePlans || []);
        setPaymentHistory(data.paymentHistory || []);
        if (data.currentSubscription && !currentSubscriptionFromContext) {
          setCurrentSubscription(data.currentSubscription);
        }
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount (only for plans and payment history)
  useEffect(() => {
    fetchSubscriptionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle billing cycle toggle
  const handleBillingChange = (e) => {
    setBillingCycle(e.target.value);
  };

  // Subscribe to plan
  const handleSubscribeToPlan = async (planId) => {
    const isExpired = currentSubscription && (
      currentSubscription.status === 'expired' ||
      new Date(currentSubscription.endDate) < new Date()
    );

    if (isExpired) {
      // Ensure userType is determined correctly
      const finalUserType = userType || (brand ? 'brand' : influencer ? 'influencer' : null);
      if (!user?.id || !finalUserType) {
        alert('Unable to determine user information. Please try again.');
        return;
      }
      // Redirect to payment page for expired subscriptions
      navigate(`/subscription/payment?userId=${user.id}&userType=${finalUserType}&planId=${planId}&billingCycle=${billingCycle}`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/subscription/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ planId, billingCycle })
      });

      if (response.status === 401) {
        navigate('/SignIn');
        return;
      }

      const result = await response.json();

      if (result.success) {
        alert('Subscription created successfully!');
        // Refresh the appropriate context after subscription mutation
        if (userType === 'brand') {
          await refreshBrand();
        } else if (userType === 'influencer') {
          await refreshInfluencer();
        }
        await fetchSubscriptionData();
      } else {
        // Check if we need to redirect to payment
        if (result.redirectToPayment && result.paymentUrl) {
          window.location.href = result.paymentUrl;
        } else {
          alert(result.message || 'Failed to create subscription');
        }
      }
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      alert('An error occurred while subscribing');
    }
  };

  // Recalculate usage
  const handleRecalculateUsage = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription/recalculate-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/SignIn');
        return;
      }

      const result = await response.json();

      if (result.success) {
        alert('Usage data refreshed successfully!');
        // Refresh the appropriate context after usage recalculation
        if (userType === 'brand') {
          await refreshBrand();
        } else if (userType === 'influencer') {
          await refreshInfluencer();
        }
        await fetchSubscriptionData();
      } else {
        alert(result.message || 'Failed to refresh usage data');
      }
    } catch (error) {
      console.error('Error refreshing usage:', error);
      alert('An error occurred while refreshing usage data');
    }
  };

  // Get plan features list
  const getPlanFeatures = (features) => {
    const featureList = [];
    if (features.analytics) featureList.push('Basic Analytics');
    if (features.advancedAnalytics) featureList.push('Advanced Analytics');
    if (features.prioritySupport) featureList.push('Priority Support');
    if (features.customBranding) featureList.push('Custom Branding');
    if (features.apiAccess) featureList.push('API Access');
    if (features.collaborationTools) featureList.push('Collaboration Tools');
    if (features.bulkOperations) featureList.push('Bulk Operations');
    if (features.exportData) featureList.push('Export Data');
    if (features.socialMediaIntegration) featureList.push('Social Media Integration');
    if (features.contentLibrary) featureList.push('Content Library');
    return featureList;
  };

  // Calculate usage percentage
  const calculateUsagePercentage = (used, max) => {
    if (max === -1) return 0;
    return Math.min(100, (used / max) * 100);
  };

  if (overallLoading) {
    return (
      <div className={styles.managePageWrapper}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading subscription data...</p>
        </div>
      </div>
    );
  }

  if (overallError) {
    return (
      <div className={styles.managePageWrapper}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: 'red' }}>Error: {overallError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.managePageWrapper}>
      {/* Header */}
      <header>
        <div className="header-container">
          <div className="logo">CollabSync</div>
          <nav>
            <ul>
              <li><Link to={`/${userType}/home`}>Dashboard</Link></li>
              <li><Link to={`/${userType}/profile`}>Profile</Link></li>
              <li><Link to="/subscription/manage" className="active">Subscription</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="container">
        <div className="page-header">
          <h1><i className="fas fa-crown"></i> Subscription Management</h1>
          <p>Manage your CollabSync subscription and billing</p>
        </div>

        {/* Current Subscription */}
        <div className="current-subscription">
          <h2>Current Subscription</h2>
          {currentSubscription ? (
            <div className="subscription-card active">
              <div className="plan-header">
                <h3>{currentSubscription.planId?.name || 'Unknown Plan'}</h3>
                <div className="price">
                  ${currentSubscription.billingCycle === 'monthly'
                    ? currentSubscription.planId?.price?.monthly || 0
                    : currentSubscription.planId?.price?.yearly || 0}
                  <span>/{currentSubscription.billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
              </div>

              <div className="plan-status">
                <span className={`status-badge ${currentSubscription.status || 'active'}`}>
                  {(currentSubscription.status || 'ACTIVE').toUpperCase()}
                </span>
                <p>Expires: {new Date(currentSubscription.endDate).toLocaleDateString()}</p>
              </div>

              <div className="usage-section">
                <h4>Usage This Period</h4>
                <div className="usage-grid">
                  <div className="usage-item">
                    <span className="usage-label">Campaigns</span>
                    <div className="usage-bar">
                      {(() => {
                        const maxCampaigns = currentSubscription.planId?.features?.maxCampaigns || 0;
                        const usedCampaigns = currentSubscription.usage?.campaignsUsed || 0;
                        const campaignPercent = calculateUsagePercentage(usedCampaigns, maxCampaigns);
                        return (
                          <div className="usage-progress" style={{ width: `${campaignPercent}%` }}></div>
                        );
                      })()}
                    </div>
                    <span className="usage-text">
                      {(() => {
                        const maxCampaigns = currentSubscription.planId?.features?.maxCampaigns || 0;
                        const usedCampaigns = currentSubscription.usage?.campaignsUsed || 0;
                        return `${usedCampaigns}/${maxCampaigns === -1 ? 'Unlimited' : maxCampaigns}`;
                      })()}
                    </span>
                  </div>

                  <div className="usage-item">
                    <span className="usage-label">Collaborations</span>
                    <div className="usage-bar">
                      {(() => {
                        const maxCollabs = userType === 'brand'
                          ? currentSubscription.planId?.features?.maxInfluencers || 0
                          : currentSubscription.planId?.features?.maxBrands || 0;
                        const usedCollabs = userType === 'brand'
                          ? (currentSubscription.usage?.influencersConnected || 0)
                          : (currentSubscription.usage?.brandsConnected || 0);
                        const collabPercent = calculateUsagePercentage(usedCollabs, maxCollabs);
                        return (
                          <div className="usage-progress" style={{ width: `${collabPercent}%` }}></div>
                        );
                      })()}
                    </div>
                    <span className="usage-text">
                      {(() => {
                        const maxCollabs = userType === 'brand'
                          ? currentSubscription.planId?.features?.maxInfluencers || 0
                          : currentSubscription.planId?.features?.maxBrands || 0;
                        const usedCollabs = userType === 'brand'
                          ? (currentSubscription.usage?.influencersConnected || 0)
                          : (currentSubscription.usage?.brandsConnected || 0);
                        return `${usedCollabs}/${maxCollabs === -1 ? 'Unlimited' : maxCollabs}`;
                      })()}
                    </span>
                  </div>
                </div>
                <button onClick={handleRecalculateUsage} className="refresh-usage-btn">
                  <i className="fas fa-sync-alt"></i> Refresh Usage Data
                </button>
              </div>

              <div className="plan-features">
                <h4>Plan Features</h4>
                <ul>
                  {getPlanFeatures(currentSubscription.planId?.features || {}).map((feature, idx) => (
                    <li key={idx}><i className="fas fa-check"></i> {feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="no-subscription">
              <i className="fas fa-info-circle"></i>
              <h3>No Active Subscription</h3>
              <p>Choose a plan below to get started with CollabSync premium features.</p>
            </div>
          )}
        </div>

        {/* Available Plans */}
        <div className="available-plans">
          <h2>Available Plans</h2>
          <div className="billing-toggle">
            <label className={`toggle-switch ${billingCycle === 'monthly' ? 'active' : ''}`}>
              <input
                type="radio"
                name="billing"
                value="monthly"
                checked={billingCycle === 'monthly'}
                onChange={handleBillingChange}
              />
              <span>Monthly</span>
            </label>
            <label className={`toggle-switch ${billingCycle === 'yearly' ? 'active' : ''}`}>
              <input
                type="radio"
                name="billing"
                value="yearly"
                checked={billingCycle === 'yearly'}
                onChange={handleBillingChange}
              />
              <span>Yearly <span className="discount">Save 20%</span></span>
            </label>
          </div>

          <div className="plans-grid">
            {availablePlans.map(plan => {
              const isCurrentPlan = currentSubscription &&
                currentSubscription.planId?._id?.toString() === plan._id?.toString();

              return (
                <div key={plan._id} className={`plan-card ${plan.name?.toLowerCase() || ''}`}>
                  <div className="plan-header">
                    <h3>{plan.name || 'Unknown Plan'}</h3>
                    <div className="price">
                      <span className="monthly-price" style={{ display: billingCycle === 'monthly' ? 'block' : 'none' }}>
                        ${plan.price?.monthly || 0}<span>/month</span>
                      </span>
                      <span className="yearly-price" style={{ display: billingCycle === 'yearly' ? 'block' : 'none' }}>
                        ${plan.price?.yearly || 0}<span>/year</span>
                      </span>
                    </div>
                  </div>

                  <div className="plan-description">
                    <p>{plan.description || 'No description available.'}</p>
                  </div>

                  <div className="plan-features">
                    <ul>
                      {getPlanFeatures(plan.features || {}).slice(0, 5).map((feature, idx) => (
                        <li key={idx}><i className="fas fa-check"></i> {feature}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="plan-limits">
                    <div className="limit-item">
                      <span>
                        Campaigns: {plan.features?.maxCampaigns === -1 ? 'Unlimited' : plan.features?.maxCampaigns || 0}
                      </span>
                    </div>
                    <div className="limit-item">
                      <span>
                        Collaborations: {
                          userType === 'brand'
                            ? (plan.features?.maxInfluencers === -1 ? 'Unlimited' : plan.features?.maxInfluencers || 0)
                            : (plan.features?.maxBrands === -1 ? 'Unlimited' : plan.features?.maxBrands || 0)
                        }
                      </span>
                    </div>
                  </div>

                  <button
                    className="subscribe-btn"
                    onClick={() => handleSubscribeToPlan(plan._id)}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Billing History */}
        <div className="billing-history">
          <h2><i className="fas fa-history"></i> Billing History</h2>
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Billing Cycle</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory && paymentHistory.length > 0 ? (
                  paymentHistory.map((payment, idx) => {
                    const planName = payment.subscriptionId?.planId?.name || payment.planId?.name || 'N/A';
                    const billingCycleDisplay = payment.subscriptionId?.billingCycle || payment.billingCycle || 'N/A';
                    const displayDate = payment.createdAt || payment.processedAt || payment.paidAt;
                    const displayStatus = payment.status === 'completed' ? 'success' : payment.status;

                    return (
                      <tr key={idx}>
                        <td>{new Date(displayDate).toLocaleDateString()}</td>
                        <td><strong>{planName}</strong></td>
                        <td>
                          {billingCycleDisplay === 'monthly' ? 'Monthly' :
                            billingCycleDisplay === 'yearly' ? 'Yearly' :
                              billingCycleDisplay}
                        </td>
                        <td><strong>${(payment.amount || 0).toFixed(2)}</strong></td>
                        <td>
                          <span className={`status-badge ${displayStatus}`}>
                            {displayStatus.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {payment.paymentMethod ? (
                            <>
                              <i className="fas fa-credit-card"></i>
                              {' '}{payment.paymentMethod.replace('_', ' ').toUpperCase()}
                            </>
                          ) : (
                            'N/A'
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data">
                      <i className="fas fa-info-circle"></i>
                      No billing history available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manage;
