import React from 'react';

const ActiveCampaignCard = ({ campaign, onReviewContent, onEndCampaign }) => {
  return (
    <div className="campaign-card">
      <span className={`campaign-status ${campaign.status === 'active' ? 'status-active' : 'status-upcoming'}`}>
        {campaign.status}
      </span>
      <h3>{campaign.name || campaign.title}</h3>
      <p>{(campaign.description || '').substring(0, 80)}...</p>

      {/* Campaign Progress */}
      <div className="progress-container">
        <div className="progress-info">
          <span>Progress</span>
          <span>{campaign.progress || 0}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${campaign.progress || 0}%` }}></div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="campaign-performance">
        <div className="performance-metric">
          <i className="fas fa-chart-line"></i>
          <div>
            <span className="metric-value">
              {(campaign.engagement_rate || 0).toFixed(1)}%
            </span>
            <span className="metric-label">Engagement Rate</span>
          </div>
        </div>
        <div className="performance-metric">
          <i className="fas fa-users"></i>
          <div>
            <span className="metric-value">
              {(campaign.reach || 0).toLocaleString()}
            </span>
            <span className="metric-label">Total Reach</span>
          </div>
        </div>
        <div className="performance-metric">
          <i className="fas fa-shopping-cart"></i>
          <div>
            <span className="metric-value">
              {campaign.conversion_rate || 0}%
            </span>
            <span className="metric-label">Conversion Rate</span>
          </div>
        </div>
      </div>

      {/* Campaign Details */}
      <div className="campaign-meta">
        <div className="meta-item">
          <i className="far fa-calendar"></i>
          <span>Ends in {campaign.daysRemaining || 0} days</span>
        </div>
        <div className="meta-item">
          <i className="fas fa-users"></i>
          <span>{campaign.influencersCount || 0} influencers</span>
        </div>
        <div className="meta-item">
          <i className="fas fa-tag"></i>
          <span>{(campaign.budget || 0).toLocaleString()} budget</span>
        </div>
      </div>

      {/* Campaign Action Buttons */}
      <div className="campaign-actions">
        <button
          className="btn-review-content"
          onClick={() => onReviewContent(campaign._id, campaign.name || campaign.title)}
        >
          <i className="fas fa-eye"></i> Review Content
        </button>
        <button
          className="btn-end-campaign"
          onClick={() => onEndCampaign(campaign._id, campaign.title || campaign.name)}
        >
          <i className="fas fa-check-circle"></i> End Campaign
        </button>
      </div>
    </div>
  );
};

export default ActiveCampaignCard;
