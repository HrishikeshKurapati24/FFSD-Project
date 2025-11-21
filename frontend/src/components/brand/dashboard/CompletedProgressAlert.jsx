import React from 'react';
import { Link } from 'react-router-dom';

const CompletedProgressAlert = ({ campaigns }) => {
  if (!campaigns || campaigns.length === 0) return null;

  return (
    <div className="alert alert-info alert-dismissible fade show alert-info-bordered" role="alert">
      <h4 className="alert-heading"><i className="fas fa-check-circle"></i> Campaigns Ready for Completion</h4>
      <p>The following campaign{campaigns.length > 1 ? 's have' : ' has'} reached 100% progress and should be marked as completed:</p>
      <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
        {campaigns.map(campaign => (
          <li key={campaign._id} style={{ margin: '5px 0' }}>
            <strong>{campaign.title}</strong> -{' '}
            <Link to={`/brand/campaigns/${campaign._id}/details`} className="alert-link">View Campaign</Link>
          </li>
        ))}
      </ul>
      <hr />
      <p className="mb-0">Please review and mark these campaigns as completed in the campaign management section.</p>
      <button type="button" className="btn-close" aria-label="Close"></button>
    </div>
  );
};

export default CompletedProgressAlert;