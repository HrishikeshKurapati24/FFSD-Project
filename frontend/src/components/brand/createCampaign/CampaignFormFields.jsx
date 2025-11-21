import React from 'react';

const CampaignFormFields = ({ formData, formErrors, handleInputChange, handleChannelChange }) => {
  return (
    <>
      <div className="form-group">
        <label htmlFor="title">Campaign Title</label>
        <input
          type="text"
          className={`form-control ${formErrors.title ? 'error-input' : ''}`}
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter campaign title (max 100 characters)"
          aria-invalid={formErrors.title ? 'true' : 'false'}
        />
        {formErrors.title && <small className="error-inline">{formErrors.title}</small>}
      </div>

      <div className="form-group">
        <label htmlFor="description">Campaign Description</label>
        <textarea
          className={`form-control ${formErrors.description ? 'error-input' : ''}`}
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe your campaign (max 1000 characters)"
          aria-invalid={formErrors.description ? 'true' : 'false'}
        />
        {formErrors.description && <small className="error-inline">{formErrors.description}</small>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="start_date">Start Date</label>
          <input
            type="date"
            className={`form-control ${formErrors.start_date ? 'error-input' : ''}`}
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleInputChange}
            aria-invalid={formErrors.start_date ? 'true' : 'false'}
          />
          {formErrors.start_date && <small className="error-inline">{formErrors.start_date}</small>}
        </div>

        <div className="form-group">
          <label htmlFor="end_date">End Date</label>
          <input
            type="date"
            className={`form-control ${formErrors.end_date ? 'error-input' : ''}`}
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleInputChange}
            aria-invalid={formErrors.end_date ? 'true' : 'false'}
          />
          {formErrors.end_date && <small className="error-inline">{formErrors.end_date}</small>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="budget">Budget (in $)</label>
        <input
          type="number"
          className={`form-control ${formErrors.budget ? 'error-input' : ''}`}
          id="budget"
          name="budget"
          value={formData.budget}
          onChange={handleInputChange}
          min="0"
          placeholder="Enter budget (min 0)"
          aria-invalid={formErrors.budget ? 'true' : 'false'}
        />
        {formErrors.budget && <small className="error-inline">{formErrors.budget}</small>}
      </div>

      <div className="form-group">
        <label htmlFor="required_influencers">Number of Required Influencers</label>
        <input
          type="number"
          className={`form-control ${formErrors.required_influencers ? 'error-input' : ''}`}
          id="required_influencers"
          name="required_influencers"
          value={formData.required_influencers}
          onChange={handleInputChange}
          required
          min="1"
          max="100"
          step="1"
          placeholder="Enter number of influencers needed (1-100)"
          aria-invalid={formErrors.required_influencers ? 'true' : 'false'}
        />
        {formErrors.required_influencers && (
          <small className="error-inline">{formErrors.required_influencers}</small>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="target_audience">Target Audience</label>
        <input
          type="text"
          className={`form-control ${formErrors.target_audience ? 'error-input' : ''}`}
          id="target_audience"
          name="target_audience"
          value={formData.target_audience}
          onChange={handleInputChange}
          placeholder="Describe your target audience"
          aria-invalid={formErrors.target_audience ? 'true' : 'false'}
        />
        {formErrors.target_audience && (
          <small className="error-inline">{formErrors.target_audience}</small>
        )}
      </div>

      <div className="form-group">
        <label>Required Social Media Channels <span style={{ color: 'var(--danger)' }}>*</span></label>
        <div className="checkbox-group" style={formErrors.required_channels ? { border: '2px solid #ff4d4f' } : {}}>
          {['Instagram', 'YouTube', 'TikTok', 'Facebook', 'Twitter', 'LinkedIn'].map(channel => (
            <div key={channel} className="checkbox-item">
              <input
                type="checkbox"
                id={`channel-${channel.toLowerCase()}`}
                name="required_channels"
                value={channel}
                checked={formData.required_channels.includes(channel)}
                onChange={handleChannelChange}
              />
              <label htmlFor={`channel-${channel.toLowerCase()}`}>{channel}</label>
            </div>
          ))}
        </div>
        {formErrors.required_channels && (
          <small className="error-inline">{formErrors.required_channels}</small>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="min_followers">Minimum Followers Required</label>
        <input
          type="number"
          className={`form-control ${formErrors.min_followers ? 'error-input' : ''}`}
          id="min_followers"
          name="min_followers"
          value={formData.min_followers}
          onChange={handleInputChange}
          min="0"
          placeholder="Enter minimum followers (min 0)"
          aria-invalid={formErrors.min_followers ? 'true' : 'false'}
        />
        {formErrors.min_followers && <small className="error-inline">{formErrors.min_followers}</small>}
      </div>

      <div className="form-group">
        <label htmlFor="objectives">Campaign Objectives</label>
        <textarea
          className={`form-control ${formErrors.objectives ? 'error-input' : ''}`}
          id="objectives"
          name="objectives"
          value={formData.objectives}
          onChange={handleInputChange}
          placeholder="State your campaign objectives (max 500 characters)"
          aria-invalid={formErrors.objectives ? 'true' : 'false'}
        />
        {formErrors.objectives && <small className="error-inline">{formErrors.objectives}</small>}
      </div>
    </>
  );
};

export default CampaignFormFields;

