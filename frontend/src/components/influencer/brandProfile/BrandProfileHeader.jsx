import React from 'react';

const BrandProfileHeader = ({ brand, formatNumber, formatDecimal, onBack }) => (
  <section className="profile-header">
    <div className="profile-content">
      <button type="button" className="back-button" onClick={onBack} aria-label="Go back to previous page">
        <i className="fas fa-arrow-left" aria-hidden="true"></i> Go Back
      </button>
      <div className="profile-header-content">
        <img
          src={brand.profilePicUrl || '/images/default-brand.png'}
          alt={`${brand.displayName || brand.fullName || 'Brand'} logo`}
          className="profile-pic"
        />
        <div className="profile-info">
          <h1 className="profile-name">
            {brand.displayName || brand.fullName || 'Unknown Brand'}
            {brand.verified && <i className="fas fa-check-circle verified-badge" aria-label="Verified brand"></i>}
          </h1>
          {brand.username && <p className="profile-username">@{brand.username}</p>}
          {brand.bio && <p className="profile-bio">{brand.bio}</p>}
          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-value">{formatNumber(brand.totalFollowers)}</div>
              <div className="stat-label">Total Audience</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatDecimal(brand.avgEngagementRate, 1)}%</div>
              <div className="stat-label">Avg. Engagement</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{formatNumber(brand.completedCollabs || 0)}</div>
              <div className="stat-label">Campaigns</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {formatDecimal(brand.rating, 1)}
                <span aria-hidden="true">⭐</span>
              </div>
              <div className="stat-label">Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default BrandProfileHeader;

