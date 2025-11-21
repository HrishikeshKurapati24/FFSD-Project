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
  onSubmit
}) => {
  if (!isOpen) {
    return null;
  }

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="modal" style={{ display: 'block' }} onClick={(e) => e.target.className === 'modal' && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-modal" onClick={onClose}>&times;</span>
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
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                className="form-control"
                id="username"
                value={formData.username}
                onChange={handleInputChange('username')}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              className="form-control"
              id="bio"
              value={formData.bio}
              onChange={handleInputChange('bio')}
              required
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
              />
            </div>
            <div className="form-group">
              <label htmlFor="audienceGender">Primary Audience Gender</label>
              <select
                className="form-control"
                id="audienceGender"
                value={formData.audienceGender}
                onChange={handleInputChange('audienceGender')}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Mixed">Mixed</option>
                <option value="Other">Other</option>
              </select>
            </div>
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
            />
          </div>

          <div className="form-group">
            <label htmlFor="categories">Content Categories</label>
            <div id="categoriesContainer">
              {formData.categories.map((category, index) => (
                <span key={`${category}-${index}`} className="tag">
                  {category}
                  <span className="tag-remove" onClick={() => onRemoveCategory(category)}>×</span>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddCategory();
                  }
                }}
              />
              <button type="button" className="btn-secondary" onClick={onAddCategory}>Add</button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="languages">Languages</label>
            <div id="languagesContainer">
              {formData.languages.map((language, index) => (
                <span key={`${language}-${index}`} className="tag">
                  {language}
                  <span className="tag-remove" onClick={() => onRemoveLanguage(language)}>×</span>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddLanguage();
                  }
                }}
              />
              <button type="button" className="btn-secondary" onClick={onAddLanguage}>Add</button>
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
                    />
                  </div>
                  <div className="form-group social-platform-remove">
                    <button type="button" className="btn-secondary" onClick={() => onRemoveSocialLink(index)}>×</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="btn-secondary btn-add-social" onClick={onAddSocialLink}>
              <i className="fas fa-plus"></i> Add Social Link
            </button>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;


