import React from 'react';

const SocialPlatforms = ({ socials = [], formatNumber, getPlatformBackground }) => (
  <div className="detail-card">
    <h2 className="card-title">Social Media Platforms</h2>
    {socials.length > 0 ? (
      <div className="social-platforms">
        {socials.map((social) => (
          <div className="platform-card" key={`${social.platform}-${social.name}`}>
            <div className="platform-header">
              <div className={`platform-icon ${getPlatformBackground(social.platform)}`}>
                <i className={`fab fa-${social.icon || 'link'}`} aria-hidden="true"></i>
              </div>
              <div className="platform-name">{social.name || social.platform || 'Unknown Platform'}</div>
            </div>
            <div className="platform-stats">
              <div className="stat-box">
                <div className="stat-box-value">{formatNumber(social.followers || 0)}</div>
                <div className="stat-box-label">Followers</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-value">{formatNumber(social.avgLikes || 0)}</div>
                <div className="stat-box-label">Avg. Likes</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-value">{formatNumber(social.avgComments || 0)}</div>
                <div className="stat-box-label">Avg. Comments</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-value">{formatNumber(social.avgViews || 0)}</div>
                <div className="stat-box-label">Avg. Views</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="empty-state">No social media platforms connected.</p>
    )}
  </div>
);

export default SocialPlatforms;

