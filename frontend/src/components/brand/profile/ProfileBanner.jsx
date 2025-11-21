import React from 'react';
import { API_BASE_URL } from '../../../services/api';

const ProfileBanner = ({ brand, getMarketEmoji, onOpenEditImages }) => {
  return (
    <section className="profile-banner">
      <div
        className="banner-image"
        style={{
          backgroundImage: `url(${
            brand.bannerUrl
              ? brand.bannerUrl.startsWith('http')
                ? brand.bannerUrl
                : `${API_BASE_URL}${brand.bannerUrl}`
              : '/images/default-banner.jpg'
          })`
        }}
      >
        <button className="edit-banner-btn" onClick={onOpenEditImages} type="button">
          <i className="fas fa-camera"></i>
          <span>Edit Profile or Banner</span>
        </button>
      </div>
      <div className="profile-info">
        <div className="profile-pic">
          <img
            src={
              brand.logoUrl
                ? brand.logoUrl.startsWith('http')
                  ? brand.logoUrl
                  : `${API_BASE_URL}${brand.logoUrl}`
                : '/images/default-brand-logo.jpg'
            }
            alt={brand.name}
            onError={(e) => {
              e.target.src = '/images/default-brand-logo.jpg';
            }}
          />
        </div>
        <div className="profile-name">
          <h1>{brand.username}</h1>
          <p className="username">@{brand.username}</p>
          <div className="profile-status">
            {brand.verified ? (
              <span className="premium-badge">
                <i className="fas fa-check-circle"></i> VERIFIED
              </span>
            ) : (
              <span className="premium-badge pending-badge">
                <i className="fas fa-clock"></i> PENDING VERIFICATION
              </span>
            )}
            <span className="influence-info">
              Primary market: {brand.primaryMarket || 'Not specified'}{' '}
              {getMarketEmoji(brand.primaryMarket)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileBanner;
