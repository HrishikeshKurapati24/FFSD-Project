import React from 'react';
import { Link } from 'react-router-dom';

const SubscriptionAlert = ({ subscriptionStatus }) => {
  if (!subscriptionStatus || (!subscriptionStatus.expired && !subscriptionStatus.needsRenewal)) {
    return null;
  }

  const isExpired = subscriptionStatus.expired;
  const alertClass = `alert ${isExpired ? 'alert-danger' : 'alert-warning'} alert-dismissible fade show`;

  return (
    <div
      className={alertClass}
      role="alert"
      style={{ margin: '20px 0', borderLeft: `4px solid ${isExpired ? '#ea4335' : '#ffc107'}` }}
    >
      <h4 className="alert-heading">
        <i className={`fas ${isExpired ? 'fa-exclamation-triangle' : 'fa-clock'}`}></i>
        {isExpired ? 'Subscription Expired' : 'Subscription Renewal Required'}
      </h4>
      <p>{subscriptionStatus.message}</p>
      {isExpired && (
        <>
          <p><strong>You are now on the Free plan with limited features:</strong></p>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li>Maximum 2 brand collaborations</li>
            <li>Basic analytics only</li>
          </ul>
        </>
      )}
      <hr />
      <Link to="/subscription/manage" className="btn btn-primary">
        <i className="fas fa-credit-card"></i>
        {isExpired ? 'Upgrade Now' : 'Renew Subscription'}
      </Link>
      <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  );
};

export default SubscriptionAlert;


