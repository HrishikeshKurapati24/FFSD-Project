import React from 'react';

const CampaignRequestCard = ({ request, onActivate, onViewDetails }) => {
  return (
    <div className="campaign-request-card">
      <div className="request-header">
        <h3>{request.title}</h3>
        <span className={`request-status ${request.status}`}>
          {request.status}
        </span>
      </div>
      <p className="request-description">{request.description}</p>
      <div className="request-details">
        <div className="meta-item">
          <i className="fas fa-calendar"></i>
          <span>Start: {new Date(request.start_date).toLocaleDateString()}</span>
        </div>
        <div className="meta-item">
          <i className="fas fa-clock"></i>
          <span>Duration: {request.duration} days</span>
        </div>
        <div className="meta-item">
          <i className="fas fa-dollar-sign"></i>
          <span>Budget: ${request.budget}</span>
        </div>
        <div className="meta-item">
          <i className="fas fa-users"></i>
          <span>Accepted Influencers: {request.influencers_count || 0}</span>
        </div>
        <div className="meta-item">
          <i className="fas fa-bullseye"></i>
          <span>Target: {request.target_audience}</span>
        </div>
        <div className="meta-item">
          <i className="fas fa-hashtag"></i>
          <span>Min Followers: {(request.min_followers || 0).toLocaleString()}</span>
        </div>
      </div>
      <div className="request-actions">
        {request.status === 'request' && request._id && (
          <button className="btn-activate" onClick={() => onActivate(request._id)}>
            Activate Campaign
          </button>
        )}
        {request._id && (
          <button className="btn-view" onClick={() => onViewDetails(request._id)}>
            View Details
          </button>
        )}
      </div>
    </div>
  );
};

export default CampaignRequestCard;
