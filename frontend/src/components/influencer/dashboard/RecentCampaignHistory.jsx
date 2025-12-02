import React from 'react';
import { Link } from 'react-router-dom';

const RecentCampaignHistory = ({ campaigns }) => (
  <section className="campaign-history-section" style={{ marginTop: '2rem' }}>
    <h2>Recent Campaign History</h2>
    {campaigns && campaigns.length > 0 ? (
      <div
        className="campaigns-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginTop: '10px' }}
      >
        {campaigns.map((campaign) => (
          <div
            key={campaign._id || campaign.title}
            className="campaign-card"
            style={{ background: '#fff', borderRadius: '10px', padding: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.08)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <span
              className="campaign-status"
              style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', background: '#e6f4ea', color: '#34a853' }}
            >
              {campaign.status}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {campaign.brand_logo && (
                <img
                  src={campaign.brand_logo}
                  alt={campaign.brand_name}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {campaign.title}
                </h3>
                {campaign.brand_name && (
                  <div style={{ fontSize: '12px', color: '#6c757d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {campaign.brand_name}
                  </div>
                )}
              </div>
            </div>
            <p style={{ margin: 0, color: '#666' }}>
              {(campaign.description || '').substring(0, 120)}...
            </p>
            <div className="campaign-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '8px 0', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
              <div className="metric" style={{ textAlign: 'center' }}>
                <div className="metric-value" style={{ fontWeight: 600, color: '#4285f4' }}>
                  {(campaign.performance_score || 0).toFixed(1)}
                </div>
                <div className="metric-label" style={{ fontSize: '12px', color: '#666' }}>Performance</div>
              </div>
              <div className="metric" style={{ textAlign: 'center' }}>
                <div className="metric-value" style={{ fontWeight: 600, color: '#4285f4' }}>
                  {(campaign.engagement_rate || 0).toFixed(1)}%
                </div>
                <div className="metric-label" style={{ fontSize: '12px', color: '#666' }}>Engagement</div>
              </div>
              <div className="metric" style={{ textAlign: 'center' }}>
                <div className="metric-value" style={{ fontWeight: 600, color: '#4285f4' }}>
                  {(campaign.reach || 0).toLocaleString()}
                </div>
                <div className="metric-label" style={{ fontSize: '12px', color: '#666' }}>Reach</div>
              </div>
            </div>
            <div className="campaign-details" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
              <div className="detail-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '12px' }}>
                <i className="far fa-calendar" style={{ color: '#4285f4' }}></i>
                <span>
                  {(campaign.start_date
                    ? new Date(campaign.start_date).toLocaleDateString()
                    : new Date(campaign.end_date).toLocaleDateString()
                  )} - {new Date(campaign.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="detail-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '12px' }}>
                <i className="fas fa-clock" style={{ color: '#4285f4' }}></i>
                <span>{campaign.duration || 0} days</span>
              </div>
              <div className="detail-item" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '12px' }}>
                <i className="fas fa-tag" style={{ color: '#4285f4' }}></i>
                <span>{(campaign.budget || 0).toLocaleString()} budget</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : null}
    <div className="view-history" style={{ marginTop: '16px', textAlign: 'center' }}>
      <p style={{ marginBottom: '10px', color: '#555', fontSize: '0.95rem' }}>
        Want to revisit every collaboration you’ve completed?
      </p>
      <Link
        to="/influencer/campaign-history"
        className="view-campaigns-btn"
        style={{ display: 'inline-block', background: '#007BFF', color: '#fff', padding: '12px 28px', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }}
      >
        View All Campaigns
      </Link>
    </div>
  </section>
);

export default RecentCampaignHistory;


