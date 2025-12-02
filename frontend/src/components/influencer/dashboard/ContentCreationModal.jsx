import React from 'react';

const ContentCreationModal = ({
  isOpen,
  formData,
  modalData,
  onClose,
  onSubmit,
  setFormData
}) => {
  if (!isOpen) {
    return null;
  }

  const handlePlatformsChange = (platform, checked) => {
    setFormData((prev) => ({
      ...prev,
      platforms: checked
        ? [...prev.platforms, platform]
        : prev.platforms.filter((p) => p !== platform)
    }));
  };

  return (
    <div className="modal" style={{ display: 'block' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
          <h2><i className="fas fa-video"></i> Create Content</h2>
          <form onSubmit={onSubmit} encType="multipart/form-data">
            <input type="hidden" name="campaignId" value={formData.campaignId} />

            <div className="form-group">
              <label htmlFor="contentMedia">Post(Video/ Picture) <span className="required">*</span></label>
              <input
                type="file"
                id="contentMedia"
                name="media_files"
                className="form-control"
                multiple
                accept="image/*,video/*"
                required
                onChange={(e) => setFormData((prev) => ({ ...prev, mediaFiles: e.target.files }))}
              />
              <small className="form-text">Upload images or videos for your content</small>
            </div>

            <div className="form-group">
              <label htmlFor="contentDescription">Content Caption <span className="required">*</span></label>
              <textarea
                id="contentDescription"
                name="description"
                className="form-control"
                placeholder="Write your caption here..."
                rows="4"
                required
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contentType">Content Type <span className="required">*</span></label>
              <select
                id="contentType"
                name="content_type"
                className="form-control"
                required
                value={formData.contentType}
                onChange={(e) => setFormData((prev) => ({ ...prev, contentType: e.target.value }))}
              >
                <option value="">Select content type</option>
                <option value="post">Social Media Post</option>
                <option value="story">Story</option>
                <option value="reel">Reel/Video</option>
                <option value="review">Product Review</option>
                <option value="unboxing">Unboxing</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>

            <div className="form-group">
              <label>Platforms <span className="required">*</span></label>
              <div className="checkbox-group">
                {['instagram', 'youtube', 'tiktok', 'facebook'].map((platform) => (
                  <label key={platform} className="checkbox-item">
                    <input
                      type="checkbox"
                      name="platforms"
                      value={platform}
                      checked={formData.platforms.includes(platform)}
                      onChange={(e) => handlePlatformsChange(platform, e.target.checked)}
                    />
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="campaignProduct">Campaign Product <span className="required">*</span></label>
              <select
                id="campaignProduct"
                name="campaign_product"
                className="form-control"
                required
                value={formData.campaignProduct}
                onChange={(e) => setFormData((prev) => ({ ...prev, campaignProduct: e.target.value }))}
              >
                <option value="">Select a product to promote</option>
                {modalData.products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} - ${product.campaign_price}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="specialInstructions">Special Instructions</label>
              <textarea
                id="specialInstructions"
                name="special_instructions"
                className="form-control"
                placeholder="Any special instructions or requirements"
                rows="3"
                value={formData.specialInstructions}
                onChange={(e) => setFormData((prev) => ({ ...prev, specialInstructions: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="publishDate">Planned Publish Date</label>
              <input
                type="datetime-local"
                id="publishDate"
                name="publish_date"
                className="form-control"
                value={formData.publishDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, publishDate: e.target.value }))}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success">
                <i className="fas fa-paper-plane"></i> Submit for Review
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContentCreationModal;


