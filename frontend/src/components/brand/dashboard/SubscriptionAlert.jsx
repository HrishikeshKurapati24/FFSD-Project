import React from 'react';
import { Link } from 'react-router-dom';

const SubscriptionAlert = ({ subscriptionStatus }) => {
  if (!subscriptionStatus || (!subscriptionStatus.expired && !subscriptionStatus.needsRenewal)) return null;

  return (
    <div
      className={`alert ${subscriptionStatus.expired ? 'alert-danger' : 'alert-warning'} alert-dismissible fade show`}
      role="alert"
      style={{ margin: '20px 0', borderLeft: `4px solid ${subscriptionStatus.expired ? '#ea4335' : '#ffc107'}` }}
    >
      <h4 className="alert-heading">
        <i className={`fas ${subscriptionStatus.expired ? 'fa-exclamation-triangle' : 'fa-clock'}`}></i>
        {subscriptionStatus.expired ? 'Subscription Expired' : 'Subscription Renewal Required'}
      </h4>
      <p>{subscriptionStatus.message}</p>
      {subscriptionStatus.expired && (
        <>
          <p><strong>You are now on the Free plan with limited features:</strong></p>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li>Maximum 2 campaigns</li>
            <li>Maximum 2 collaborations</li>
            <li>Basic analytics only</li>
          </ul>
        </>
      )}
      <hr />
      <Link to="/subscription/manage" className="btn btn-primary">
        <i className="fas fa-credit-card"></i>
        {subscriptionStatus.expired ? 'Upgrade Now' : 'Renew Subscription'}
      </Link>
      <button type="button" className="btn-close" aria-label="Close"></button>
    </div>
  );
};

export default SubscriptionAlert;
