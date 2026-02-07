import React from 'react';

const AboutSection = ({ influencer, onEditProfile }) => (
  <div className="profile-bio">
    <div className="section-header">
      <h2>About</h2>
      <button className="btn-edit" onClick={onEditProfile}>
        <i className="fas fa-edit"></i> Edit
      </button>
    </div>
    {influencer.niche && (
      <p className="tagline" style={{ fontStyle: 'italic', marginBottom: '1rem', color: '#666' }}>
        {influencer.niche}
      </p>
    )}
    <p className="bio-text">
      {influencer.bio || 'No description provided.'}
    </p>

    <div className="info-section">
      <h3><i className="fas fa-users"></i> Audience Demographics</h3>
      <div className="audience-details">
        {influencer.phone && (
          <div className="detail-item">
            <strong>Contact:</strong>
            <span>{influencer.phone}</span>
          </div>
        )}
        <div className="detail-item">
          <strong>Age Range:</strong>
          <span>{influencer.audienceAgeRange || 'Not specified'}</span>
        </div>
        <div className="detail-item">
          <strong>Primary Gender:</strong>
          <span>{influencer.audienceGender || 'Not specified'}</span>
        </div>
      </div>
    </div>

    <div className="info-section">
      <h3><i className="fas fa-language"></i> Languages</h3>
      <div className="languages-tags">
        {influencer.languages && influencer.languages.length > 0 ? (
          <span className="language-tag">
            {influencer.languages.join('\t')}
          </span>
        ) : (
          <p>No languages specified</p>
        )}
      </div>
    </div>

    <div className="info-section">
      <h3><i className="fas fa-tags"></i> Content Categories</h3>
      <div className="categories-tags">
        {influencer.categories && influencer.categories.length > 0 ? (
          <span className="category-tag">
            {influencer.categories.join('\t')}
          </span>
        ) : (
          <p>No categories specified</p>
        )}
      </div>
    </div>
  </div>
);

export default AboutSection;


