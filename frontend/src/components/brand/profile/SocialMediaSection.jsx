import React from 'react';

const SocialMediaSection = ({ brand }) => {
  return (
    <div className="profile-card social-card">
      <h3>Social Media</h3>
      <div className="social-stats">
        {brand.socialLinks &&
          brand.socialLinks.map((platform, index) => (
            <div key={index} className="social-item">
              <i className={`fab fa-${platform.platform}`}></i>
              <span className="count">{(platform.followers || 0).toLocaleString()}</span>
              <span className="label">followers</span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default SocialMediaSection;
