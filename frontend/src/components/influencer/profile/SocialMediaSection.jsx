import React from 'react';

const SocialMediaSection = ({ socials = [] }) => (
  <div className="profile-card social-card">
    <h3>Social Media</h3>
    <div className="social-stats">
      {socials.length > 0 ? (
        socials.map((platform, index) => (
          <div key={`${platform.platform}-${index}`} className="social-item">
            <i className={`fab fa-${platform.platform}`}></i>
            <span className="count">
              {platform.followers?.toLocaleString() || 0}
            </span>
            <span className="label">followers</span>
            <div className="platform-stats">
              <span>Avg Likes: {platform.avgLikes?.toLocaleString() || 0}</span>
              <span>Avg Comments: {platform.avgComments?.toLocaleString() || 0}</span>
              <span>Avg Views: {platform.avgViews?.toLocaleString() || 0}</span>
            </div>
          </div>
        ))
      ) : (
        <p>No social media links added</p>
      )}
    </div>
  </div>
);

export default SocialMediaSection;


