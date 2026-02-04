import React from 'react';

const AboutSection = ({ brand, onOpenEditModal }) => {
  return (
    <div id="about-tab" className="tab-content active">
      <div className="profile-bio">
        <div className="section-header">
          <h2>About {brand.name}</h2>
          <button className="btn-edit" onClick={onOpenEditModal}>
            <i className="fas fa-edit"></i> Edit
          </button>
        </div>
        {brand.tagline && <p className="tagline" style={{ fontStyle: 'italic', marginBottom: '10px', color: '#666' }}>{brand.tagline}</p>}
        <p className="bio-text">{brand.description || 'No description provided.'}</p>

        <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
          {brand.industry && (
            <div className="info-item">
              <strong><i className="fas fa-briefcase"></i> Industry:</strong> {brand.industry}
            </div>
          )}
          {brand.location && (
            <div className="info-item">
              <strong><i className="fas fa-map-marker-alt"></i> Location:</strong> {brand.location}
            </div>
          )}
          {brand.phone && (
            <div className="info-item">
              <strong><i className="fas fa-phone"></i> Phone:</strong> {brand.phone}
            </div>
          )}
        </div>

        {brand.mission && (
          <div className="info-section mission-section">
            <h3>
              <i className="fas fa-bullseye"></i> Our Mission
            </h3>
            <p>{brand.mission}</p>
          </div>
        )}

        {brand.currentCampaign && (
          <div className="info-section campaign-section">
            <h3>
              <i className="fas fa-rocket"></i> Current Campaign Goals
            </h3>
            <p>{brand.currentCampaign}</p>
          </div>
        )}

        <div className="info-section values-section">
          <h3>
            <i className="fas fa-heart"></i> Brand Categories
          </h3>
          <div className="values-tags">
            {brand.values &&
              brand.values.map((value, index) => (
                <span key={index} className="value-tag">
                  {value}
                </span>
              ))}
          </div>
        </div>

        {brand.targetInterests && brand.targetInterests.length > 0 && (
          <div className="info-section interests-section">
            <h3>
              <i className="fas fa-bullseye"></i> Target Interests
            </h3>
            <div className="values-tags">
              {brand.targetInterests.map((interest, index) => (
                <span key={index} className="value-tag interest-tag">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AboutSection;
