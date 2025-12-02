import React from 'react';

const ProfileBanner = ({ influencer, onEditImages, getPrimaryMarketEmoji }) => (
  <section className="profile-banner">
    <div
      className="banner-image"
      style={{ backgroundImage: `url(${influencer.bannerUrl || '/images/default-banner.jpg'})` }}
    >
      <button className="edit-banner-btn" onClick={onEditImages}>
        <i className="fas fa-camera"></i>
        <span>Edit Profile or Banner</span>
      </button>
    </div>
    <div className="profile-info">
      <div className="profile-pic">
        <img
          src={influencer.profilePicUrl || '/images/default-avatar.jpg'}
          alt={influencer.displayName}
        />
      </div>
      <div className="profile-name">
        <h1>{influencer.displayName}</h1>
        <p className="username">@{influencer.username}</p>
        <div className="profile-status">
          {influencer.verified ? (
            <span className="premium-badge">
              <i className="fas fa-check-circle"></i> VERIFIED
            </span>
          ) : (
            <span className="premium-badge pending-badge">
              <i className="fas fa-clock"></i> PENDING VERIFICATION
            </span>
          )}
          {influencer.primaryMarket && (
            <span className="influence-info">
              Primary market: {influencer.primaryMarket} {getPrimaryMarketEmoji(influencer.primaryMarket)}
            </span>
          )}
        </div>
      </div>
    </div>
  </section>
);

export default ProfileBanner;


