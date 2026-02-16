import React from 'react';
import { Link } from 'react-router-dom';

const IntroSection = ({ influencer, subscriptionStatus, stats }) => {
  // Get display name - handle both name and displayName properties
  const displayName = influencer?.displayName || influencer?.name || 'Influencer';
  
  // Get total audience - check multiple possible sources
  const totalAudience = influencer?.totalAudience || 
                        influencer?.metrics?.totalFollowers || 
                        influencer?.totalFollowers || 
                        stats?.totalFollowers || 
                        0;
  
  // Get total commissions earned - from campaign influencers (stats from backend)
  const totalCommissionsEarned = stats?.totalCommissionsEarned || 0;
  
  // Get avg engagement rate - check multiple possible sources
  const avgEngagementRate = influencer?.avgEngagementRate || 
                            influencer?.metrics?.avgEngagementRate || 
                            stats?.avgEngagementRate || 
                            0;

  const metrics = [
    {
      label: 'Avg Engagement Rate',
      value: `${avgEngagementRate.toFixed(1)}%`
    },
    {
      label: 'Total Audience',
      value: totalAudience.toLocaleString()
    },
    {
      label: 'Total Commissions Earned',
      value: `$${totalCommissionsEarned.toLocaleString()}`
    }
  ];

  return (
    <div className="intro">
      <h1>Welcome, {displayName}</h1>
      <p>Discover how CollabSync empowers influencers with seamless brand collaborations.</p>

      <div className="performance-metrics">
        {metrics.map((metric) => (
          <div key={metric.label} className="metric-item">
            <div className="metric-value">{metric.value}</div>
            <div className="metric-label">{metric.label}</div>
          </div>
        ))}

        {subscriptionStatus && (
          <div className="metric-item">
            <div className="metric-value">
              {subscriptionStatus?.subscription?.planId?.name || 'Free'}
            </div>
            <div className="metric-label">Current Plan</div>
            <div style={{ marginTop: '5px' }}>
              <Link
                to="/subscription/manage"
                style={{ color: '#4285f4', fontSize: '0.85em', textDecoration: 'none' }}
              >
                <i className="fas fa-crown"></i> Manage Plan
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntroSection;


