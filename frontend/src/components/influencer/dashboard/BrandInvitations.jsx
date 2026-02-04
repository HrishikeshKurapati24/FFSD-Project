import React from 'react';

const BrandInvitations = ({ invites, onAccept, onDecline }) => {
  return (
    <section className="brand-invites">
      <h2>Brand Invitations</h2>
      <div className="invites-grid">
        {invites && invites.length > 0 ? (
          invites.map((invite) => (
            <div key={invite._id} className="invite-card">
              <span className="invite-badge">New Invite</span>
              <div className="invite-header">
                <img
                  src={invite.brand_logo || '/images/default-brand.png'}
                  alt={invite.brand_name}
                  className="brand-logo"
                />
                <div className="invite-info">
                  <h3>{invite.campaign_title}</h3>
                  <p className="brand-name">{invite.brand_name}</p>
                  {invite.brand_location && (
                    <p className="brand-location">
                      <i className="fas fa-map-marker-alt"></i>
                      {invite.brand_location}
                    </p>
                  )}
                </div>
              </div>
              <div className="invite-description">
                <p>{invite.campaign_description || 'No description provided'}</p>
              </div>
              <div className="invite-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <i className="fas fa-dollar-sign"></i>
                    <span className="label">Budget:</span>
                    <span className="value">${(invite.campaign_budget || 0).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-calendar-alt"></i>
                    <span className="label">Duration:</span>
                    <span className="value">{invite.campaign_duration || 0} days</span>
                  </div>
                </div>
                {invite.campaign_id?.required_channels?.length > 0 && (
                  <div className="detail-row">
                    <div className="detail-item full-width">
                      <i className="fas fa-share-alt"></i>
                      <span className="label">Required Channels:</span>
                      <div className="channel-badges">
                        {invite.campaign_id.required_channels.map((channel, idx) => (
                          <span key={idx} className="channel-badge">{channel}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {invite.campaign_start_date && invite.campaign_end_date && (
                  <div className="detail-row">
                    <div className="detail-item">
                      <i className="fas fa-calendar-check"></i>
                      <span className="label">Start:</span>
                      <span className="value">{new Date(invite.campaign_start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-calendar-times"></i>
                      <span className="label">End:</span>
                      <span className="value">{new Date(invite.campaign_end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="invite-actions">
                <button className="btn-accept" onClick={() => onAccept(invite._id, invite.campaign_title)}>
                  <i className="fas fa-check"></i> Accept Invitation
                </button>
                <button className="btn-decline" onClick={() => onDecline(invite._id, invite.campaign_title)}>
                  <i className="fas fa-times"></i> Decline
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-invites">
            <i className="fas fa-envelope-open"></i>
            <h3>No Brand Invitations</h3>
            <p>You don't have any brand invitations at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default BrandInvitations;
