import React from 'react';

const ErrorAlert = ({ error, showRenewLink, showUpgradeLink }) => {
  if (!error) return null;

  return (
    <div className="alert alert-danger">
      <strong>Error:</strong> {error}
      {showRenewLink && (
        <div style={{ marginTop: '10px' }}>
          <a href="/subscription/manage" className="btn-upgrade">
            <i className="fas fa-sync-alt"></i> Renew Your Subscription
          </a>
        </div>
      )}
      {showUpgradeLink && (
        <div style={{ marginTop: '10px' }}>
          <a href="/subscription/manage" className="btn-upgrade">
            <i className="fas fa-crown"></i> Upgrade Your Plan
          </a>
        </div>
      )}
    </div>
  );
};

export default ErrorAlert;
