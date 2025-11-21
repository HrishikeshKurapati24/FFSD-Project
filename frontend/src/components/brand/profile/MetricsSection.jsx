import React from 'react';

const MetricsSection = ({ brand }) => {
  return (
    <div className="metrics-section">
      <h2>Brand Performance</h2>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="metric-value">{brand.completedCampaigns || 0}</div>
          <div className="metric-label">Campaigns</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="metric-value">{brand.influencerPartnerships || 0}</div>
          <div className="metric-label">Partnerships</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <i className="fas fa-star"></i>
          </div>
          <div className="metric-value">{brand.avgCampaignRating || '0.0'}</div>
          <div className="metric-label">Avg. Rating</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <i className="fas fa-bullhorn"></i>
          </div>
          <div className="metric-value">{(brand.totalAudience || 0).toLocaleString()}</div>
          <div className="metric-label">Total Audience</div>
        </div>
      </div>
    </div>
  );
};

export default MetricsSection;
