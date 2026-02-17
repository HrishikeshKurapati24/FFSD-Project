import React from 'react';
import { Link } from 'react-router-dom';

const ActiveCollaborations = ({
  collaborations,
  baseUrl,
  referralCode,
  onCopyShopUrl,
  onOpenProgressModal,
  onOpenContentModal,
  onPublishContent
}) => {
  const hasCollaborations = collaborations && collaborations.length > 0;

  return (
    <section className="active-collaborations">
      <h2>Active Collaborations</h2>
      <div className="collaborations-grid">
        {hasCollaborations ? (
          collaborations.map((collab) => (
            <div key={collab.id} className="collab-card" data-collab-id={collab.id}>
              {/* collab-header and other sections remain same */}
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
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginLeft: 'auto' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenContentModal(collab.campaign_id, collab.campaign_title || collab.campaign_name, null);
                  }}
                >
                  <i className="fas fa-plus"></i> Create Content
                </button>
              </div>

              {/* ... collab-progress metrics etc ... */}
              <div className="collab-progress">
                <div className="progress-info">
                  <span>Progress</span>
                  <span>{collab.progress || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress" style={{ '--progress': `${collab.progress || 0}%` }}></div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary w-100 mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Opening progress modal for collab:', collab.id);
                    onOpenProgressModal(collab.id, collab.campaign_title || collab.campaign_name, collab.progress);
                  }}
                >
                  <i className="fas fa-chart-line me-1"></i> Update Progress
                </button>
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

              {/* Deliverables Section */}
              {collab.deliverables && collab.deliverables.length > 0 && (
                <div className="deliverables-section" style={{
                  marginTop: '25px',
                  padding: '1.5rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem'
                  }}>
                    <h5 style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: '#333',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: '#e8f0fe',
                        color: '#4285f4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem'
                      }}>
                        <i className="fas fa-tasks"></i>
                      </div>
                      Task Deliverables
                    </h5>
                    <span style={{
                      fontSize: '0.8rem',
                      color: '#666',
                      fontWeight: '600',
                      backgroundColor: '#fff',
                      padding: '4px 10px',
                      borderRadius: '15px',
                      border: '1px solid #dee2e6'
                    }}>
                      {collab.deliverables.filter(d => d.status === 'published').length}/{collab.deliverables.length} Done
                    </span>
                  </div>

                  <div className="deliverables-list" style={{ display: 'grid', gap: '1rem' }}>
                    {collab.deliverables.map((deliverable, idx) => {
                      const getStatusColor = (status) => {
                        switch (status) {
                          case 'pending': return '#6c757d';
                          case 'submitted': return '#4285f4'; // Using dashboard primary
                          case 'approved': return '#34a853'; // Using dashboard secondary (green)
                          case 'published': return '#34a853';
                          case 'rejected': return '#ea4335'; // Using dashboard accent (red)
                          default: return '#6c757d';
                        }
                      };

                      const getStatusIcon = (status) => {
                        switch (status) {
                          case 'pending': return 'fa-clock';
                          case 'submitted': return 'fa-paper-plane';
                          case 'approved': return 'fa-check';
                          case 'published': return 'fa-check-double';
                          case 'rejected': return 'fa-exclamation-triangle';
                          default: return 'fa-clock';
                        }
                      };

                      return (
                        <div
                          key={idx}
                          className="deliverable-item"
                          style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '10px',
                            padding: '1.25rem',
                            border: '1px solid #e9ecef',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            borderLeft: `4px solid ${getStatusColor(deliverable.status)}`,
                            position: 'relative'
                          }}
                        >
                          <div style={{ marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <h6 style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: '#333' }}>
                                {deliverable.title || 'Untitled Task'}
                              </h6>
                              <span style={{
                                padding: '3px 10px',
                                borderRadius: '20px',
                                fontSize: '0.65rem',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                backgroundColor: `${getStatusColor(deliverable.status)}15`,
                                color: getStatusColor(deliverable.status),
                                letterSpacing: '0.5px',
                                border: `1px solid ${getStatusColor(deliverable.status)}30`
                              }}>
                                <i className={`fas ${getStatusIcon(deliverable.status)} me-1`}></i>
                                {deliverable.status}
                              </span>
                            </div>

                            <p style={{
                              fontSize: '0.8rem',
                              color: '#555',
                              marginBottom: '12px',
                              lineHeight: '1.4',
                              display: '-webkit-box',
                              WebkitLineClamp: '3',
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {deliverable.description || 'No specific instructions provided.'}
                            </p>

                            <div style={{
                              display: 'flex',
                              gap: '12px',
                              fontSize: '0.75rem',
                              color: '#777',
                              fontWeight: '500'
                            }}>
                              {deliverable.due_date && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="far fa-calendar-alt"></i>
                                  {new Date(deliverable.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                              {deliverable.deliverable_type && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="fas fa-video"></i>
                                  {deliverable.deliverable_type}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Rendering */}
                          <div style={{
                            marginTop: '1rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px dashed #eee',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center'
                          }}>

                            {deliverable.status === 'submitted' && (
                              <span style={{
                                fontSize: '0.75rem',
                                color: '#4285f4',
                                fontStyle: 'italic',
                                fontWeight: '500'
                              }}>
                                <i className="fas fa-clock me-1"></i> Awaiting Approval...
                              </span>
                            )}

                            {deliverable.status === 'approved' && (
                              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: '#34a853', fontWeight: '600' }}>
                                  <i className="fas fa-check-circle me-1"></i> Ready to Publish!
                                </span>
                                <button
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: '#34a853',
                                    color: 'white',
                                    borderRadius: '6px',
                                    padding: '5px 12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    border: 'none',
                                    boxShadow: '0 2px 5px rgba(52, 168, 83, 0.3)'
                                  }}
                                  onClick={() => onPublishContent(collab.campaign_id, deliverable.id || deliverable._id)}
                                >
                                  <i className="fas fa-rocket me-1"></i> Go Live
                                </button>
                              </div>
                            )}

                            {deliverable.status === 'published' && deliverable.content_url && (
                              <a
                                href={deliverable.content_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm"
                                style={{
                                  borderRadius: '6px',
                                  fontSize: '0.7rem',
                                  fontWeight: '600',
                                  padding: '4px 10px',
                                  color: '#495057',
                                  border: '1px solid #ced4da',
                                  backgroundColor: '#fff'
                                }}
                              >
                                <i className="fas fa-external-link-alt me-1 "></i> View Live Post
                              </a>
                            )}

                            {deliverable.status === 'rejected' && (
                              <div style={{ width: '100%' }}>
                                {deliverable.review_feedback && (
                                  <div style={{
                                    padding: '8px',
                                    backgroundColor: '#fff5f5',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    color: '#c53030',
                                    marginBottom: '8px',
                                    border: '1px solid #fed7d7'
                                  }}>
                                    <strong>Feedback:</strong> {deliverable.review_feedback}
                                  </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <button
                                    className="btn btn-sm btn-warning"
                                    style={{
                                      borderRadius: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: '700'
                                    }}
                                    onClick={() => onOpenContentModal(
                                      collab.campaign_id,
                                      collab.campaign_title || collab.campaign_name,
                                      deliverable
                                    )}
                                  >
                                    <i className="fas fa-redo me-1"></i> Resubmit
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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


