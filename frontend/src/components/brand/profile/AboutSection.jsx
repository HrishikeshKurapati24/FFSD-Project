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
        <p className="bio-text">{brand.description || 'No description provided.'}</p>

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
      </div>
    </div>
  );
};

export default AboutSection;
