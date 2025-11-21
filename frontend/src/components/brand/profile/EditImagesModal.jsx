import React from 'react';

const EditImagesModal = ({
  isOpen,
  onClose,
  logoPreview,
  bannerPreview,
  imageErrors,
  onImageChange,
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
        <h2>Edit Brand Images</h2>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="logoUpload">Brand Logo</label>
            <div className="file-upload">
              <label className="file-upload-label" htmlFor="logoUpload">
                <i className="fas fa-camera" style={{ marginRight: '8px' }}></i>
                Click to upload new logo
                <input
                  type="file"
                  className="file-upload-input"
                  id="logoUpload"
                  name="logo"
                  accept="image/*"
                  onChange={onImageChange}
                />
              </label>
              <img
                id="logoPreview"
                className="preview-image"
                src={logoPreview}
                alt="Logo Preview"
              />
            </div>
            {imageErrors.logo && (
              <small className="form-text error-inline">{imageErrors.logo}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="bannerUpload">Banner Image</label>
            <div className="file-upload">
              <label className="file-upload-label" htmlFor="bannerUpload">
                <i className="fas fa-image" style={{ marginRight: '8px' }}></i>
                Click to upload new banner
                <input
                  type="file"
                  className="file-upload-input"
                  id="bannerUpload"
                  name="banner"
                  accept="image/*"
                  onChange={onImageChange}
                />
              </label>
              <img
                id="bannerPreview"
                className="preview-image"
                src={bannerPreview}
                alt="Banner Preview"
              />
            </div>
            {imageErrors.banner && (
              <small className="form-text error-inline">{imageErrors.banner}</small>
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

export default EditImagesModal;
