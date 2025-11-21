import React from 'react';

const WebsiteSection = ({ brand }) => {
  return (
    <div className="profile-card">
      <h3>Website</h3>
      <a
        href={brand.website}
        className="website-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i className="fas fa-globe"></i>
        {brand.website ? brand.website.replace(/^https?:\/\//, '') : 'No website'}
      </a>
    </div>
  );
};

export default WebsiteSection;
