import React from 'react';
import CampaignRequestCard from './CampaignRequestCard';

const CampaignRequestsSection = ({ requests, onActivate, onViewDetails }) => {
  return (
    <section className="campaign-requests-section">
      <h2 className="section-header">Campaign Requests</h2>
      <div className="campaign-requests-list">
        {requests && requests.length > 0 ? (
          requests.map(request => (
            <CampaignRequestCard
              key={request._id}
              request={request}
              onActivate={onActivate}
              onViewDetails={onViewDetails}
            />
          ))
        ) : (
          <div className="no-campaign-requests">
            <i className="fas fa-inbox"></i>
            <h3>No Campaign Requests</h3>
            <p>You don't have any campaign requests at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default CampaignRequestsSection;
