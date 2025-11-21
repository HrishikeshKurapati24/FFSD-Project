import React from 'react';

const CampaignDetailsModal = ({ modalRef, modalInstanceRef, isOpen, details, loading, onClose }) => {
  return (
    <div className="modal fade" ref={modalRef} id="campaignDetailsModal" tabIndex="-1" aria-labelledby="campaignDetailsModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="campaignDetailsModalLabel">Campaign Details</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <div className="campaign-details-content">
              {loading ? (
                <p>Loading...</p>
              ) : details ? (
                <>
                  <div className="detail-section">
                    <h6>Campaign Overview</h6>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <i className="fas fa-calendar"></i>
                        <strong>Start Date:</strong> {new Date(details.start_date).toLocaleDateString()}
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-clock"></i>
                        <strong>Duration:</strong> {details.duration || 0} days
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-dollar-sign"></i>
                        <strong>Budget:</strong> ${details.budget || 0}
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-users"></i>
                        <strong>Accepted Influencers:</strong> {details.accepted_influencers || 0}
                      </div>
                    </div>
                  </div>
                  <div className="detail-section">
                    <h6>Campaign Details</h6>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <i className="fas fa-bullseye"></i>
                        <strong>Target Audience:</strong> {details.target_audience || 'Not specified'}
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-hashtag"></i>
                        <strong>Min Followers:</strong> {(details.min_followers || 0).toLocaleString()}
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-list"></i>
                        <strong>Required Channels:</strong> {(details.required_channels || []).join(', ') || 'Not specified'}
                      </div>
                      <div className="detail-item">
                        <i className="fas fa-bullseye"></i>
                        <strong>Objectives:</strong> {details.objectives || 'Not specified'}
                      </div>
                    </div>
                  </div>
                  <div className="detail-section">
                    <h6>Description</h6>
                    <p>{details.description || 'No description available'}</p>
                  </div>
                  {details.influencers && details.influencers.length > 0 && (
                    <div className="detail-section">
                      <h6>Accepted Influencers</h6>
                      <div className="influencers-list">
                        {details.influencers.map((influencer, idx) => (
                          <div key={idx} className="influencer-card">
                            <img
                              src={influencer.profilePicUrl || '/images/default-avatar.jpg'}
                              alt={influencer.name}
                              className="influencer-avatar"
                            />
                            <div className="influencer-name">{influencer.name}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p>No details available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailsModal;
