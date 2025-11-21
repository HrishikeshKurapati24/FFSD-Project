import React from 'react';

const SentRequests = ({ requests, onCancel }) => (
  <section className="sent-requests">
    <h2>Sent Requests</h2>
    <div className="sent-requests-grid">
      {requests && requests.length > 0 ? (
        requests.map((request) => (
          <div key={request._id} className="sent-request-card">
            <span className="sent-badge">Awaiting Response</span>
            <div className="sent-request-header">
              <img
                src={request.brand_logo || '/images/default-brand.png'}
                alt={request.brand_name}
                className="brand-logo"
              />
              <div className="sent-request-info">
                <h3>{request.campaign_title}</h3>
                <p className="brand-name">{request.brand_name}</p>
                {request.brand_location && (
                  <p className="brand-location">
                    <i className="fas fa-map-marker-alt"></i>
                    {request.brand_location}
                  </p>
                )}
              </div>
            </div>
            <div className="sent-request-description">
              <p>{request.campaign_description || 'No description provided'}</p>
            </div>
            <div className="sent-request-details">
              <div className="detail-row">
                <div className="detail-item">
                  <i className="fas fa-dollar-sign"></i>
                  <span className="label">Budget:</span>
                  <span className="value">${(request.campaign_budget || 0).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <i className="fas fa-calendar-alt"></i>
                  <span className="label">Duration:</span>
                  <span className="value">{request.campaign_duration || 0} days</span>
                </div>
              </div>
              {request.required_channels?.length > 0 && (
                <div className="detail-row">
                  <div className="detail-item full-width">
                    <i className="fas fa-share-alt"></i>
                    <span className="label">Required Channels:</span>
                    <div className="channel-badges">
                      {request.required_channels.map((channel, idx) => (
                        <span key={idx} className="channel-badge">{channel}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {request.campaign_start_date && request.campaign_end_date && (
                <div className="detail-row">
                  <div className="detail-item">
                    <i className="fas fa-calendar-check"></i>
                    <span className="label">Start:</span>
                    <span className="value">{new Date(request.campaign_start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-calendar-times"></i>
                    <span className="label">End:</span>
                    <span className="value">{new Date(request.campaign_end_date).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="sent-request-actions">
              <button className="btn-cancel-request" onClick={() => onCancel(request._id, request.campaign_title)}>
                <i className="fas fa-times-circle"></i> Cancel Request
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="no-sent-requests">
          <i className="fas fa-paper-plane"></i>
          <h3>No Sent Requests</h3>
          <p>You haven't sent any collaboration requests yet. Explore campaigns to get started!</p>
        </div>
      )}
    </div>
  </section>
);

export default SentRequests;


