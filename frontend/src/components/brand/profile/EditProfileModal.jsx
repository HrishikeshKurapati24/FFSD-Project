import React from 'react';

const EditProfileModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  valueInput,
  setValueInput,
  formErrors,
  onAddValue,
  onRemoveValue,
  onAddSocialLink,
  onRemoveSocialLink,
  onSocialLinkChange,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-modal" onClick={onClose}>
          &times;
        </span>
        <h2>Edit Brand Profile</h2>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="brandName">Brand Name</label>
              <input
                type="text"
                className="form-control"
                id="brandName"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
              {formErrors.name && (
                <small className="form-text error-inline">{formErrors.name}</small>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="brandUsername">Username</label>
              <input
                type="text"
                className="form-control"
                id="brandUsername"
                name="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="brandDescription">Brand Description</label>
            <textarea
              className="form-control"
              id="brandDescription"
              name="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            {formErrors.description && (
              <small className="form-text error-inline">{formErrors.description}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="brandMission">Mission Statement</label>
            <textarea
              className="form-control"
              id="brandMission"
              name="mission"
              value={formData.mission}
              onChange={(e) => setFormData((prev) => ({ ...prev, mission: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="currentCampaign">Current Campaign Goals</label>
            <textarea
              className="form-control"
              id="currentCampaign"
              name="currentCampaign"
              value={formData.currentCampaign}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, currentCampaign: e.target.value }))
              }
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="primaryMarket">Primary Market</label>
              <select
                className="form-control"
                id="primaryMarket"
                name="primaryMarket"
                value={formData.primaryMarket}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, primaryMarket: e.target.value }))
                }
              >
                <option value="">Select market</option>
                <option value="Global">Global</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="Europe">Europe</option>
                <option value="Asia">Asia</option>
              </select>
              {formErrors.primaryMarket && (
                <small className="form-text error-inline">{formErrors.primaryMarket}</small>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="brandWebsite">Website</label>
              <input
                type="url"
                className="form-control"
                id="brandWebsite"
                name="website"
                value={formData.website}
                onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
              />
              {formErrors.website && (
                <small className="form-text error-inline">{formErrors.website}</small>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="valueInput">Brand Categories</label>
            <div id="valuesContainer" className="tag-container">
              {formData.values.map((value, index) => (
                <span key={index} className="tag">
                  {value}
                  <span className="tag-remove" onClick={() => onRemoveValue(value)}>
                    ×
                  </span>
                </span>
              ))}
            </div>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                id="valueInput"
                placeholder="Add a category..."
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddValue();
                  }
                }}
              />
              <button type="button" className="btn-secondary" onClick={onAddValue}>
                Add
              </button>
            </div>
            {formErrors.values && (
              <small className="form-text error-inline">{formErrors.values}</small>
            )}
          </div>

          <div className="form-group">
            <label>Target Audience</label>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="targetAgeRange">Target Age Range</label>
                <input
                  type="text"
                  className="form-control"
                  id="targetAgeRange"
                  name="targetAgeRange"
                  value={formData.targetAgeRange}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, targetAgeRange: e.target.value }))
                  }
                  placeholder="e.g., 18-35"
                />
                {formErrors.targetAgeRange && (
                  <small className="form-text error-inline">{formErrors.targetAgeRange}</small>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="targetGender">Primary Gender</label>
                <select
                  className="form-control"
                  id="targetGender"
                  name="targetGender"
                  value={formData.targetGender}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, targetGender: e.target.value }))
                  }
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="All">All</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Social Media Links</label>
            <div id="socialLinks" className="social-links-container">
              {formData.socialLinks.map((link, index) => (
                <div key={index} className="social-platform-row">
                  <div className="form-group social-platform-select">
                    <select
                      className="form-control"
                      value={link.platform || 'instagram'}
                      onChange={(e) =>
                        onSocialLinkChange(index, 'platform', e.target.value)
                      }
                    >
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="twitter">Twitter</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="linkedin">LinkedIn</option>
                    </select>
                  </div>
                  <div className="form-group social-platform-url">
                    <input
                      type="url"
                      className="form-control"
                      placeholder="Profile URL"
                      value={link.url || ''}
                      onChange={(e) => onSocialLinkChange(index, 'url', e.target.value)}
                    />
                  </div>
                  <div className="form-group social-platform-followers">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Followers"
                      value={link.followers || 0}
                      onChange={(e) =>
                        onSocialLinkChange(
                          index,
                          'followers',
                          parseInt(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-secondary btn-remove-social"
                    onClick={() => onRemoveSocialLink(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn-secondary" onClick={onAddSocialLink}>
              <i className="fas fa-plus"></i> Add Social Link
            </button>
            {formErrors.socialLinks && (
              <small className="form-text error-inline">{formErrors.socialLinks}</small>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
