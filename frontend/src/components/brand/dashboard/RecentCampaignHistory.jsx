import React from 'react';
import { Link } from 'react-router-dom';

const RecentCampaignHistory = ({ campaigns }) => {
  if (!campaigns || campaigns.length === 0) return null;

  return (
    <section className="campaign-history-section">
      <h2 className="section-header">Campaign History</h2>
      <div className="campaign-list">
        {campaigns.slice(0, 3).map(campaign => (
          <div key={campaign._id || campaign.id} className="campaign-card">
            <span className="campaign-status status-completed">completed</span>
            <h3>{campaign.name || campaign.title}</h3>
            <p>{(campaign.description || '').substring(0, 100)}...</p>

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
                    {(campaign.conversion_rate || 0).toFixed(1)}%
                  </span>
                  <span className="metric-label">Conversion Rate</span>
                </div>
              </div>
            </div>

            <div className="campaign-meta">
              <div className="meta-item">
                <i className="far fa-calendar-check"></i>
                <span>Ended on {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="meta-item">
                <i className="fas fa-users"></i>
                <span>{campaign.influencersCount || campaign.influencers_count || 0} influencers</span>
              </div>
              <div className="meta-item">
                <i className="fas fa-tag"></i>
                <span>{(campaign.budget || 0).toLocaleString()} budget</span>
              </div>
              {campaign.duration && (
                <div className="meta-item">
                  <i className="fas fa-clock"></i>
                  <span>Duration: {campaign.duration} days</span>
                </div>
              )}
              {campaign.target_audience && (
                <div className="meta-item">
                  <i className="fas fa-bullseye"></i>
                  <span>Target: {campaign.target_audience}</span>
                </div>
              )}
              {campaign.min_followers && (
                <div className="meta-item">
                  <i className="fas fa-hashtag"></i>
                  <span>Min Followers: {(campaign.min_followers || 0).toLocaleString()}</span>
                </div>
              )}
            </div>

            {campaign.products && campaign.products.length > 0 && (
              <div className="campaign-products" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: '#555' }}>Associated Products</h4>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                  {campaign.products.map(product => (
                    <div key={product._id} style={{ minWidth: '60px', textAlign: 'center' }}>
                      <img
                        src={product.images && product.images[0] ? product.images[0] : '/images/default-product.png'}
                        alt={product.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', marginBottom: '4px' }}
                      />
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60px' }}>
                        {product.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {campaign.required_channels && campaign.required_channels.length > 0 && (
              <div className="campaign-performance" style={{ marginTop: '10px', gridTemplateColumns: '1fr 1fr' }}>
                <div className="performance-metric">
                  <i className="fas fa-bullhorn"></i>
                  <div>
                    <span className="metric-value">{campaign.required_channels.join(', ')}</span>
                    <span className="metric-label">Channels</span>
                  </div>
                </div>
                <div className="performance-metric">
                  <i className="fas fa-trophy"></i>
                  <div>
                    <span className="metric-value">{(campaign.performance_score || 0).toFixed(0)}%</span>
                    <span className="metric-label">Performance Score</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="view-history-section">
        <p>Explore all your past campaigns and performance.</p>
        <Link to="/brand/campaigns/history" className="view-campaigns-btn">View All Campaigns</Link>
      </div>
    </section>
  );
};

export default RecentCampaignHistory;
