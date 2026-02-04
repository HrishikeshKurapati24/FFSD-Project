import React from 'react';

const EditProfileModal = ({
  isOpen,
  formData,
  setFormData,
  newCategory,
  setNewCategory,
  newLanguage,
  setNewLanguage,
  onAddCategory,
  onRemoveCategory,
  onAddLanguage,
  onRemoveLanguage,
  onAddSocialLink,
  onRemoveSocialLink,
  onSocialChange,
  onClose,
  onSubmit,
  formErrors = {}, // Added
  isSubmitting = false // Added
}) => {
  if (!isOpen) {
    return null;
  }

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="modal" style={{ display: 'block' }} onClick={(e) => e.target.className === 'modal' && !isSubmitting && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-modal" onClick={!isSubmitting ? onClose : undefined}>&times;</span>
        <h2>Edit Influencer Profile</h2>
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                className="form-control"
                id="displayName"
                value={formData.displayName}
                onChange={handleInputChange('displayName')}
                disabled={isSubmitting} // Added
              />
              {formErrors.displayName && <small className="error-text" style={{ color: 'red' }}>{formErrors.displayName}</small>}
            </div>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                className="form-control"
                id="username"
                value={formData.username}
                onChange={handleInputChange('username')}
                disabled={isSubmitting} // Added
              />
              {formErrors.username && <small className="error-text" style={{ color: 'red' }}>{formErrors.username}</small>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="niche">Niche (Primary Category)</label>
            <input
              type="text"
              className="form-control"
              id="niche"
              value={formData.niche || ''}
              onChange={handleInputChange('niche')}
              disabled={isSubmitting}
              placeholder="e.g. Current Fashion, Tech Reviewer"
            />
            {formErrors.niche && <small className="error-text" style={{ color: 'red' }}>{formErrors.niche}</small>}
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              className="form-control"
              id="bio"
              value={formData.bio}
              onChange={handleInputChange('bio')}
              disabled={isSubmitting} // Added
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                className="form-control"
                id="location"
                value={formData.location}
                onChange={handleInputChange('location')}
                disabled={isSubmitting} // Added
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                className="form-control"
                id="phone"
                value={formData.phone || ''}
                onChange={handleInputChange('phone')}
                disabled={isSubmitting}
                placeholder="+1234567890"
              />
              {formErrors.phone && <small className="error-text" style={{ color: 'red' }}>{formErrors.phone}</small>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="audienceGender">Primary Audience Gender</label>
            <select
              className="form-control"
              id="audienceGender"
              value={formData.audienceGender}
              onChange={handleInputChange('audienceGender')}
              disabled={isSubmitting} // Added
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Mixed">Mixed</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="audienceAge">Audience Age Range</label>
            <input
              type="text"
              className="form-control"
              id="audienceAge"
              value={formData.audienceAgeRange}
              onChange={handleInputChange('audienceAgeRange')}
              placeholder="e.g. 18-35"
              disabled={isSubmitting} // Added
            />
          </div>

          <div className="form-group">
            <label htmlFor="categories">Content Categories</label>
            <div id="categoriesContainer">
              {formData.categories.map((category, index) => (
                <span key={`${category}-${index}`} className="tag">
                  {category}
                  <span className="tag-remove" onClick={() => !isSubmitting && onRemoveCategory(category)}>×</span>
                </span>
              ))}
            </div>
            <div className="tag-input-container">
              <input
                type="text"
                id="categoryInput"
                className="form-control"
                placeholder="Add a category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                disabled={isSubmitting} // Added
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddCategory();
                  }
                }}
              />
              <button type="button" className="btn-secondary" onClick={onAddCategory} disabled={isSubmitting}>Add</button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="languages">Languages</label>
            <div id="languagesContainer">
              {formData.languages.map((language, index) => (
                <span key={`${language}-${index}`} className="tag">
                  {language}
                  <span className="tag-remove" onClick={() => !isSubmitting && onRemoveLanguage(language)}>×</span>
                </span>
              ))}
            </div>
            <div className="tag-input-container">
              <input
                type="text"
                id="languageInput"
                className="form-control"
                placeholder="Add a language"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                disabled={isSubmitting} // Added
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddLanguage();
                  }
                }}
              />
              <button type="button" className="btn-secondary" onClick={onAddLanguage} disabled={isSubmitting}>Add</button>
            </div>
          </div>

          <div className="form-group">
            <label>Social Media Links</label>
            <div id="socialLinks">
              {formData.socials.map((social, index) => (
                <div key={`${social.platform}-${index}`} className="social-platform-row">
                  <div className="form-group social-platform-select">
                    <label htmlFor={`socialPlatform${index}`}>Platform</label>
                    <select
                      className="form-control"
                      id={`socialPlatform${index}`}
                      value={social.platform}
                      onChange={(e) => onSocialChange(index, 'platform', e.target.value)}
                      disabled={isSubmitting} // Added
                    >
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="twitter">Twitter</option>
                      <option value="facebook">Facebook</option>
                      <option value="linkedin">LinkedIn</option>
                    </select>
                  </div>
                  <div className="form-group social-platform-url">
                    <label htmlFor={`socialUrl${index}`}>Profile URL</label>
                    <input
                      type="url"
                      className="form-control"
                      id={`socialUrl${index}`}
                      value={social.url}
                      onChange={(e) => onSocialChange(index, 'url', e.target.value)}
                      placeholder="Profile URL"
                      disabled={isSubmitting} // Added
                    />
                  </div>
                  <div className="form-group social-platform-followers">
                    <label htmlFor={`socialFollowers${index}`}>Followers</label>
                    <input
                      type="number"
                      className="form-control"
                      id={`socialFollowers${index}`}
                      value={social.followers}
                      onChange={(e) => onSocialChange(index, 'followers', parseInt(e.target.value) || 0)}
                      placeholder="Followers"
                      disabled={isSubmitting} // Added
                    />
                  </div>
                  <div className="form-group social-platform-remove">
                    <button type="button" className="btn-secondary" onClick={() => onRemoveSocialLink(index)} disabled={isSubmitting}>×</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="btn-secondary btn-add-social" onClick={onAddSocialLink} disabled={isSubmitting}>
              <i className="fas fa-plus"></i> Add Social Link
            </button>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;


