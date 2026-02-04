import React from 'react';

const numberFields = [
  { id: 'reachInput', name: 'reach', label: 'Reach' },
  { id: 'clicksInput', name: 'clicks', label: 'Clicks' },
  { id: 'performanceScoreInput', name: 'performanceScore', label: 'Performance Score (%)' },
  { id: 'conversionsInput', name: 'conversions', label: 'Conversions' },
  { id: 'engagementRateInput', name: 'engagementRate', label: 'Engagement Rate (%)' },
  { id: 'impressionsInput', name: 'impressions', label: 'Impressions' },
  { id: 'revenueInput', name: 'revenue', label: 'Revenue ($)' },
  { id: 'roiInput', name: 'roi', label: 'ROI' }
];

const ProgressModal = ({
  isOpen,
  formData,
  modalData,
  onClose,
  onSubmit,
  sliderRef,
  valueRef,
  setFormData
}) => {
  if (!isOpen) {
    return null;
  }

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNumberChange = (field, value) => {
    const numericValue = Number(value) || 0;
    handleFieldChange(field, numericValue);
  };

  return (
    <div id="updateProgressModal" className="modal" style={{ display: 'block' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Update Progress & Metrics</h2>
        <p style={{ fontSize: '0.9rem', color: '#666', margin: '10px 0' }}>
          Note: Progress can only be increased, not decreased.
        </p>

        <form onSubmit={onSubmit}>
          <div className="progress-input">
            <label htmlFor="progressSlider">Campaign Progress:</label>
            <input
              type="range"
              id="progressSlider"
              ref={sliderRef}
              min={modalData.currentProgress}
              max="100"
              value={formData.progress}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                handleFieldChange('progress', value);
                if (valueRef.current) {
                  valueRef.current.textContent = `${value}%`;
                }
              }}
            />
            <span id="progressValue" ref={valueRef}>{formData.progress}%</span>
          </div>

          <div className="metrics-grid">
            {numberFields.map(({ id, name, label }) => (
              <div key={id} className="metric-group">
                <label htmlFor={id}>{label}:</label>
                <input
                  type="number"
                  id={id}
                  name={name}
                  min="0"
                  placeholder="0"
                  value={formData[name]}
                  onChange={(e) => handleNumberChange(name, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success">
              <i className="fas fa-save"></i> Save Updates
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgressModal;


