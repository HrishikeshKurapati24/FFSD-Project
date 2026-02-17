import React from 'react';

const ContentCreationModal = ({
  isOpen,
  formData,
  modalData,
  onClose,
  onSubmit,
  setFormData,
  selectedDeliverable // New prop: deliverable object when modal is opened from deliverable card
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
    <div id="contentCreationModal" className="modal" style={{ display: 'block' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
          <div className="modal-header-custom" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee', marginBottom: '15px' }}>
            <i className="fas fa-arrow-left" style={{ cursor: 'pointer', fontSize: '1.2rem', color: '#555' }} onClick={onClose} title="Back to Dashboard"></i>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}><i className="fas fa-video"></i> Create Content</h2>
          </div>

          {/* Deliverable Context Banner */}
          {selectedDeliverable && (
            <div style={{
              backgroundColor: '#e7f0ff',
              border: '1px solid #4a90e2',
              borderRadius: '6px',
              padding: '12px 15px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'start',
              gap: '10px'
            }}>
              <i className="fas fa-link" style={{ color: '#4a90e2', marginTop: '2px' }}></i>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#2c5aa0', marginBottom: '4px' }}>
                  Linked to Deliverable
                </div>
                <div style={{ fontSize: '0.9rem', color: '#555' }}>
                  {selectedDeliverable.task_description}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span>
                    <i className="fas fa-hashtag"></i> {selectedDeliverable.platform}
                  </span>
                  {selectedDeliverable.num_posts > 0 && (
                    <span>
                      <i className="fas fa-image"></i> {selectedDeliverable.num_posts} Post{selectedDeliverable.num_posts > 1 ? 's' : ''}
                    </span>
                  )}
                  {selectedDeliverable.num_reels > 0 && (
                    <span>
                      <i className="fas fa-video"></i> {selectedDeliverable.num_reels} Reel{selectedDeliverable.num_reels > 1 ? 's' : ''}
                    </span>
                  )}
                  {selectedDeliverable.num_videos > 0 && (
                    <span>
                      <i className="fas fa-film"></i> {selectedDeliverable.num_videos} Video{selectedDeliverable.num_videos > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Deliverable Selection (only if not pre-selected) */}
          {!selectedDeliverable && modalData.deliverables && (
            <div className="form-group" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px dashed #ced4da' }}>
              <label htmlFor="deliverableSelect" style={{ color: '#0d6efd', fontWeight: '600' }}>
                <i className="fas fa-tasks" style={{ marginRight: '6px' }}></i>
                Select a Deliverable to Fulfill
              </label>
              <select
                id="deliverableSelect"
                className="form-control"
                onChange={(e) => {
                  const devId = e.target.value;
                  if (!devId) {
                    // Reset if cleared
                    setFormData(prev => ({ ...prev, contentType: '', platforms: [] }));
                    return;
                  }

                  const dev = modalData.deliverables.find(d => d._id === devId);
                  if (dev) {
                    // Auto-fill logic
                    let autoPlatform = [];
                    // Extract platform from title
                    if (dev.title) {
                      const platforms = ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'linkedin'];
                      const titleLower = dev.title.toLowerCase();
                      const found = platforms.find(p => titleLower.includes(p));
                      if (found) autoPlatform = [found];
                    }

                    // Map content type
                    const typeMap = { 'Post': 'Post', 'Reel': 'Reel', 'Video': 'Video', 'Story': 'Story', 'Other': 'Other' };
                    const autoType = typeMap[dev.deliverable_type] || 'Other';

                    setFormData(prev => ({
                      ...prev,
                      deliverable_id: dev._id, // Set hidden ID
                      deliverable_title: dev.title, // Set title
                      contentType: autoType,
                      platforms: autoPlatform,
                      description: dev.description ? `Fulfilling: ${dev.title}\n\n${dev.description}` : prev.description
                    }));
                  }
                }}
              >
                <option value="">-- Start with a blank form --</option>
                {modalData.deliverables.filter(d => d.status === 'pending').map(d => (
                  <option key={d._id} value={d._id}>
                    {d.title} (Due: {new Date(d.due_date).toLocaleDateString()})
                  </option>
                ))}
              </select>
              <small className="form-text text-muted">
                <span className="text-danger">* Required: </span> Selecting a deliverable is mandatory to submit content.
              </small>
            </div>
          )}

          <form onSubmit={onSubmit} encType="multipart/form-data">
            <input type="hidden" name="campaignId" value={formData.campaignId} />
            {/* If selectedDeliverable prop exists, use it. Else use the one set by dropdown (formData.deliverable_id) */}
            {(selectedDeliverable || formData.deliverable_id) && (
              <input type="hidden" name="deliverable_id" value={selectedDeliverable ? selectedDeliverable._id : formData.deliverable_id} />
            )}

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
                disabled={selectedDeliverable != null} // Auto-set when linked to deliverable
              >
                <option value="">Select content type</option>
                <option value="Post">Social Media Post</option>
                <option value="Story">Story</option>
                <option value="Reel">Reel/Video</option>
                <option value="Video">Video</option>
                <option value="Other">Other</option>
              </select>
              {selectedDeliverable && (
                <small className="form-text text-muted">
                  <i className="fas fa-lock"></i> Auto-selected based on deliverable
                </small>
              )}
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
                      disabled={selectedDeliverable && selectedDeliverable.platform.toLowerCase() !== platform}
                    />
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </label>
                ))}
              </div>
              {selectedDeliverable && (
                <small className="form-text text-muted">
                  <i className="fas fa-lock"></i> Platform locked to: {selectedDeliverable.platform}
                </small>
              )}
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
                {selectedDeliverable && (
                  <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '2px', fontWeight: '400' }}>
                    Will update deliverable status
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContentCreationModal;


