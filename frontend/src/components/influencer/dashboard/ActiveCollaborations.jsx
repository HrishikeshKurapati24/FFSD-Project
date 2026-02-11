import React from 'react';
import { Link } from 'react-router-dom';

const ActiveCollaborations = ({
  collaborations,
  baseUrl,
  referralCode,
  onCopyShopUrl,
  onOpenProgressModal,
  onOpenContentModal
}) => {
  const hasCollaborations = collaborations && collaborations.length > 0;

  return (
    <section className="active-collaborations">
      <h2>Active Collaborations</h2>
      <div className="collaborations-grid">
        {hasCollaborations ? (
          collaborations.map((collab) => (
            <div key={collab.id} className="collab-card" data-collab-id={collab.id}>
              <div className="collab-header">
                <img
                  src={collab.brand_logo || '/images/default-brand.png'}
                  alt={collab.brand_name}
                  className="brand-logo"
                />
                <div className="collab-title">
                  <h3>{collab.campaign_name}</h3>
                  <p className="brand-name">{collab.brand_name}</p>
                </div>
              </div>

              <div className="collab-progress">
                <div className="progress-info">
                  <span>Progress</span>
                  <span>{collab.progress || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress" style={{ '--progress': `${collab.progress || 0}%` }}></div>
                </div>
              </div>

              <div className="collab-metrics">
                <div className="metric">
                  <span className="label">Duration</span>
                  <span className="value">{collab.duration || 0} days</span>
                </div>
                <div className="metric">
                  <span className="label">Budget</span>
                  <span className="value">${(collab.budget || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="collab-analytics">
                <h4>Performance Analytics</h4>
                <div className="analytics-grid">
                  {[
                    ['Reach', collab.reach],
                    ['Clicks', collab.clicks],
                    ['Conversions', collab.conversions],
                    ['Performance Score', collab.performance_score],
                    ['Engagement', collab.engagement_rate],
                    ['Impressions', collab.impressions],
                    ['Revenue', collab.revenue],
                    ['ROI', collab.roi],
                    ['Conversion Rate', `${collab.engagement_rate || 0}%`]
                  ].map(([label, value]) => (
                    <div key={label} className="analytics-item">
                      <span className="label">{label}</span>
                      <span className="value">{value || 0}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="shop-url-section">
                <div className="shop-url-header">
                  <i className="fas fa-shopping-cart"></i>
                  <span className="shop-url-label">Customer Shop Link</span>
                </div>
                <div className="shop-url-container">
                  {(() => {
                    const shopUrl = `${baseUrl}/customer/campaign/${collab.campaign_id}/shop${referralCode ? `?ref=${encodeURIComponent(referralCode)}` : ''
                      }`;
                    return (
                      <>
                        <input
                          type="text"
                          className="shop-url-input"
                          id={`shopUrl_${collab.campaign_id}`}
                          value={shopUrl}
                          readOnly
                        />
                        <button
                          className="btn btn-copy"
                          style={{ width: '75px' }}
                          onClick={() => onCopyShopUrl(collab.campaign_id)}
                          title="Copy to clipboard"
                        >
                          <i className="fas fa-copy"></i>
                        </button>
                      </>
                    );
                  })()}
                </div>
                <div className="shop-url-note">
                  <i className="fas fa-info-circle"></i>
                  <span>Include this link in every post for this campaign</span>
                </div>
              </div>

              <div className="collab-actions">
                <button className="update-progress-btn" onClick={() => onOpenProgressModal(collab.id)}>
                  <i className="fas fa-chart-line"></i>
                  Update Progress
                </button>
              </div>

              <div
                className="post-content-label"
                style={{
                  fontWeight: 'bold',
                  color: '#2d6cdf',
                  fontSize: '1.08rem',
                  marginTop: '18px',
                  marginBottom: '7px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <i className="fas fa-edit" style={{ marginTop: '8px', color: '#4683ea', fontSize: '1.1em' }}></i>
                Post content for this campaign
              </div>
              <div className="collab-actions">
                <button
                  className="update-progress-btn"
                  onClick={() => onOpenContentModal(collab.campaign_id, collab.campaign_title || collab.campaign_name)}
                >
                  <i className="fas fa-chart-line"></i> Create Content
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-collaborations">
            <p>No active collaborations at the moment</p>
            <Link to="/influencer/explore" className="explore-btn">Explore Opportunities</Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default ActiveCollaborations;


