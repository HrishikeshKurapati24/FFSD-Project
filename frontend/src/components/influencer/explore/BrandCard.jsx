import React from 'react';
import { Link } from 'react-router-dom';

const BrandCard = ({ brand, viewMode, getBrandLogo, onLogoError, onInvite }) => (
  <div className="brand-item">
    <div className="brand-logo-container">
      <img
        loading="lazy"
        src={getBrandLogo(brand.logoUrl)}
        alt={brand.brandName || brand.name}
        onError={onLogoError}
      />
      {brand.verified && (
        <span className="verified-badge" title="Verified Brand">
          <i className="fas fa-check-circle"></i>
        </span>
      )}
    </div>
    <div className="brand-details">
      <div className="brand-header">
        <h2 className="brand-name">
          {brand.brandName || brand.name}
        </h2>
        {brand.avgCampaignRating && brand.avgCampaignRating > 0 && (
          <div className="brand-rating">
            <i className="fas fa-star"></i>
            <span>
              {brand.avgCampaignRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {brand.tagline && (
        <p className="brand-tagline">
          {brand.tagline}
        </p>
      )}

      <div className="brand-info-grid">
        {brand.industry && (
          <div className="info-item">
            <i className="fas fa-tags"></i>
            <span>{brand.industry}</span>
          </div>
        )}

        {brand.location && (
          <div className="info-item">
            <i className="fas fa-map-marker-alt"></i>
            <span>{brand.location}</span>
          </div>
        )}

        {brand.completedCampaigns !== undefined && (
          <div className="info-item">
            <i className="fas fa-check-double"></i>
            <span>{brand.completedCampaigns} Campaigns</span>
          </div>
        )}

        {brand.influencerPartnerships !== undefined && (
          <div className="info-item">
            <i className="fas fa-users"></i>
            <span>{brand.influencerPartnerships} Partnerships</span>
          </div>
        )}
      </div>

      {brand.mission && (
        <p className="brand-mission">
          {brand.mission.length > 120
            ? `${brand.mission.substring(0, 120)}...`
            : brand.mission}
        </p>
      )}
    </div>
    <div className="button-group">
      <button
        className="invite-button"
        onClick={() => onInvite(brand._id, brand.brandName || brand.name)}
      >
        Invite
      </button>
      <Link
        to={`/influencer/brand_profile/${brand._id}`}
        className="profile-button"
      >
        View Profile
      </Link>
    </div>
  </div>
);

export default BrandCard;


