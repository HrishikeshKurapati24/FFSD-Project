import React from 'react';

const TopCampaignsSection = ({ brand }) => {
  return (
    <div className="campaigns-section">
      <h2>Top Campaigns</h2>
      {brand.topCampaigns && brand.topCampaigns.length > 0 ? (
        <div className="campaigns-grid">
          {brand.topCampaigns.map((campaign, index) => (
            <div key={index} className="campaign-card">
              <div className={`campaign-status ${(campaign.status || 'Active').toLowerCase()}`}>
                <i className="fas fa-circle"></i>
                {campaign.status || 'Active'}
              </div>
              <h3 className="campaign-title">{campaign.title}</h3>
              <div className="campaign-stats">
                <div className="stat">
                  <i className="fas fa-chart-line"></i>
                  <span>{(campaign.performance_score || 0).toFixed(1)}</span>
                  <label>Performance</label>
                </div>
                <div className="stat">
                  <i className="fas fa-eye"></i>
                  <span>{(campaign.reach || 0).toLocaleString()}</span>
                  <label>Reach</label>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-data-message">No campaigns available to display.</p>
      )}
    </div>
  );
};

export default TopCampaignsSection;
