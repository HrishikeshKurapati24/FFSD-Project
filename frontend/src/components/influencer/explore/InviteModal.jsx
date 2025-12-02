import React from 'react';

const CHANNEL_OPTIONS = ['Instagram', 'YouTube', 'TikTok', 'Facebook', 'Twitter', 'LinkedIn'];

const InviteModal = ({
  isOpen,
  selectedBrand,
  formData,
  setFormData,
  onClose,
  onChannelChange,
  onSubmit
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="invite-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="invite-modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="invite-modal-close" onClick={onClose}>&times;</span>
        <h2 className="invite-modal-title">Invite Brand to Collaborate</h2>
        <p className="invite-brand-name">Inviting: {selectedBrand.name}</p>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="campaignTitle">Campaign Title *</label>
            <input
              type="text"
              id="campaignTitle"
              required
              placeholder="e.g., Summer Fashion Collection"
              value={formData.campaignTitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, campaignTitle: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="campaignDescription">Campaign Description *</label>
            <textarea
              id="campaignDescription"
              required
              rows="4"
              placeholder="Describe what you want to collaborate on..."
              value={formData.campaignDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, campaignDescription: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="budget">Proposed Budget ($) *</label>
            <input
              type="number"
              id="budget"
              required
              min="0"
              placeholder="5000"
              value={formData.budget}
              onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="productName">Product Name *</label>
            <input
              type="text"
              id="productName"
              required
              placeholder="e.g., Summer Collection Dress"
              value={formData.productName}
              onChange={(e) => setFormData((prev) => ({ ...prev, productName: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="requiredChannels">Channels You'll Use *</label>
            <div className="channel-checkboxes">
              {CHANNEL_OPTIONS.map((channel) => (
                <label key={channel}>
                  <input
                    type="checkbox"
                    name="channels"
                    value={channel}
                    checked={formData.channels.includes(channel)}
                    onChange={() => onChannelChange(channel)}
                  />
                  {channel}
                </label>
              ))}
            </div>
          </div>

          <div className="invite-modal-actions">
            <button type="submit" className="invite-btn-send">
              <i className="fas fa-paper-plane"></i> Send Invitation
            </button>
            <button type="button" onClick={onClose} className="invite-btn-cancel">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;


