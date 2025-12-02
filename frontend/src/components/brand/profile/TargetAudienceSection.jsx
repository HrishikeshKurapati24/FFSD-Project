import React from 'react';

const TargetAudienceSection = ({ brand }) => {
  return (
    <div className="profile-card audience-card">
      <h3>Target Audience</h3>
      <div className="audience-info">
        <div className="audience-item">
          <i className="fas fa-birthday-cake"></i>
          <span>
            <strong>Ages:</strong> {brand.targetAgeRange || 'Not specified'}
          </span>
        </div>
        <div className="audience-item">
          <i className="fas fa-venus-mars"></i>
          <span>
            <strong>Gender:</strong> {brand.targetGender || 'Not specified'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TargetAudienceSection;
