import React from 'react';

const EditImagesModal = ({
  isOpen,
  onClose,
  onSubmit,
  profilePicPreview,
  bannerPreview,
  onProfilePicChange,
  onBannerChange,
  profilePicInputRef,
  bannerInputRef
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal" style={{ display: 'block' }} onClick={(e) => e.target.className === 'modal' && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-modal" onClick={onClose}>&times;</span>
        <h2>Edit Profile Images</h2>
        <form onSubmit={onSubmit} encType="multipart/form-data">
          <div className="form-group">
            <label htmlFor="profilePic">Profile Picture</label>
            <div className="file-upload">
              <label className="file-upload-label" htmlFor="profilePic">
                <i className="fas fa-camera"></i>
                Click to upload new profile picture
                <input
                  type="file"
                  className="file-upload-input"
                  id="profilePic"
                  name="profilePic"
                  accept="image/*"
                  ref={profilePicInputRef}
                  onChange={onProfilePicChange}
                  style={{ display: 'none' }}
                />
              </label>
              <img
                src={profilePicPreview}
                alt="Profile Preview"
                className="preview-image"
                style={{ maxWidth: '200px', maxHeight: '200px', marginTop: '15px', borderRadius: '8px', display: 'block' }}
              />
            </div>
            <small className="form-text text-muted">Max size: 5MB. Allowed formats: JPG, PNG, GIF</small>
          </div>

          <div className="form-group">
            <label htmlFor="bannerImage">Banner Image</label>
            <div className="file-upload">
              <label className="file-upload-label" htmlFor="bannerImage">
                <i className="fas fa-image"></i>
                Click to upload new banner image
                <input
                  type="file"
                  className="file-upload-input"
                  id="bannerImage"
                  name="bannerImage"
                  accept="image/*"
                  ref={bannerInputRef}
                  onChange={onBannerChange}
                  style={{ display: 'none' }}
                />
              </label>
              <img
                src={bannerPreview}
                alt="Banner Preview"
                className="preview-image"
                style={{ maxWidth: '100%', maxHeight: '300px', marginTop: '15px', borderRadius: '8px', display: 'block', objectFit: 'cover' }}
              />
            </div>
            <small className="form-text text-muted">Max size: 10MB. Allowed formats: JPG, PNG, GIF</small>
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

export default EditImagesModal;


