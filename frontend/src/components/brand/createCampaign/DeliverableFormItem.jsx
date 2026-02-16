import React from 'react';

const DeliverableFormItem = ({
  deliverable,
  index,
  deliverableErrors,
  onDeliverableChange,
  onRemoveDeliverable,
  canRemove,
  mode = 'edit', // 'edit' | 'readonly' | 'checklist'
  onChecklistToggle
}) => {
  // Platform options
  const platforms = [
    { value: '', label: 'Select platform' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'YouTube', label: 'YouTube' },
    { value: 'TikTok', label: 'TikTok' },
    { value: 'Facebook', label: 'Facebook' },
    { value: 'Twitter', label: 'Twitter' },
    { value: 'LinkedIn', label: 'LinkedIn' }
  ];

  // Handle increment/decrement for a field
  const handleIncrement = (field) => {
    const currentValue = parseInt(deliverable[field]) || 0;
    onDeliverableChange && onDeliverableChange(deliverable.id, field, currentValue + 1);
  };

  const handleDecrement = (field) => {
    const currentValue = parseInt(deliverable[field]) || 0;
    if (currentValue > 0) {
      onDeliverableChange && onDeliverableChange(deliverable.id, field, currentValue - 1);
    }
  };

  // Handle direct input change
  const handleInputChange = (field, value) => {
    const numValue = parseInt(value) || 0;
    onDeliverableChange && onDeliverableChange(deliverable.id, field, numValue >= 0 ? numValue : 0);
  };

  const errors = deliverableErrors?.[deliverable.id] || {};
  const isReadonly = mode !== 'edit';
  const isChecklist = mode === 'checklist';

  if (mode === 'readonly') {
    return (
      <div className="deliverable-item" data-index={index}>
        <div className="deliverable-header">
          <h4>Deliverable {index + 1}</h4>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Task Description</label>
            <div className="form-control-plaintext">{deliverable.task_description || '-'}</div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Platform</label>
            <div className="form-control-plaintext">{deliverable.platform || '-'}</div>
          </div>
        </div>
        <div className="form-row deliverables-numbers">
          <div className="form-group"><label>Number of Posts</label><div className="form-control-plaintext">{deliverable.num_posts || 0}</div></div>
          <div className="form-group"><label>Number of Reels</label><div className="form-control-plaintext">{deliverable.num_reels || 0}</div></div>
          <div className="form-group"><label>Number of Videos</label><div className="form-control-plaintext">{deliverable.num_videos || 0}</div></div>
        </div>
      </div>
    );
  }

  if (isChecklist) {
    const total =
      (parseInt(deliverable.num_posts) || 0) +
      (parseInt(deliverable.num_reels) || 0) +
      (parseInt(deliverable.num_videos) || 0);
    const checked = !!deliverable.completed;
    return (
      <div className="deliverable-item checklist" data-index={index}>
        <div className="deliverable-header">
          <h4>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChecklistToggle && onChecklistToggle(deliverable.id, e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Deliverable {index + 1}
          </h4>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Task</label>
            <div className="form-control-plaintext">{deliverable.task_description || '-'}</div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Platform</label>
            <div className="form-control-plaintext">{deliverable.platform || '-'}</div>
          </div>
        </div>
        <div className="form-row deliverables-numbers">
          <div className="form-group"><label>Posts</label><div className="form-control-plaintext">{deliverable.num_posts || 0}</div></div>
          <div className="form-group"><label>Reels</label><div className="form-control-plaintext">{deliverable.num_reels || 0}</div></div>
          <div className="form-group"><label>Videos</label><div className="form-control-plaintext">{deliverable.num_videos || 0}</div></div>
          <div className="form-group"><label>Total</label><div className="form-control-plaintext">{total}</div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="deliverable-item" data-index={index}>
      <div className="deliverable-header">
        <h4>Deliverable {index + 1}</h4>
        {canRemove && (
          <button
            type="button"
            className="btn-remove-deliverable"
            onClick={() => onRemoveDeliverable(deliverable.id)}
          >
            <i className="fa-solid fa-trash"></i>
          </button>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`deliverables[${index}][task_description]`}>
            Task Description
          </label>
          <textarea
            className={`form-control ${errors.task_description ? 'is-invalid' : ''}`}
            id={`deliverables[${index}][task_description]`}
            name={`deliverables[${index}][task_description]`}
            value={deliverable.task_description || ''}
            onChange={(e) => onDeliverableChange(deliverable.id, 'task_description', e.target.value)}
            placeholder="Describe what the influencer is expected to do"
            rows="3"
            readOnly={isReadonly}
          />
          {errors.task_description && (
            <small className="form-text text-danger">{errors.task_description}</small>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`deliverables[${index}][platform]`}>
            Attach Platform <span style={{ color: 'var(--danger-color)' }}>*</span>
          </label>
          <select
            className={`form-control ${errors.platform ? 'is-invalid' : ''}`}
            id={`deliverables[${index}][platform]`}
            name={`deliverables[${index}][platform]`}
            value={deliverable.platform || ''}
            onChange={(e) => onDeliverableChange(deliverable.id, 'platform', e.target.value)}
            disabled={isReadonly}
          >
            {platforms.map((platform) => (
              <option key={platform.value} value={platform.value}>
                {platform.label}
              </option>
            ))}
          </select>
          {errors.platform && (
            <small className="form-text text-danger">{errors.platform}</small>
          )}
        </div>
      </div>

      {/* Number inputs with increment/decrement buttons */}
      <div className="form-row deliverables-numbers">
        {/* Number of Posts */}
        <div className="form-group">
          <label htmlFor={`deliverables[${index}][num_posts]`}>Number of Posts</label>
          <div className="number-input-group">
            <button
              type="button"
              className="btn-number btn-decrement"
              onClick={() => handleDecrement('num_posts')}
              disabled={isReadonly}
            >
              <i className="fa-solid fa-minus"></i>
            </button>
            <input
              type="number"
              className="form-control"
              id={`deliverables[${index}][num_posts]`}
              name={`deliverables[${index}][num_posts]`}
              value={deliverable.num_posts || 0}
              onChange={(e) => handleInputChange('num_posts', e.target.value)}
              min="0"
              placeholder="0"
              readOnly={isReadonly}
            />
            <button
              type="button"
              className="btn-number btn-increment"
              onClick={() => handleIncrement('num_posts')}
              disabled={isReadonly}
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>

        {/* Number of Reels */}
        <div className="form-group">
          <label htmlFor={`deliverables[${index}][num_reels]`}>Number of Reels</label>
          <div className="number-input-group">
            <button
              type="button"
              className="btn-number btn-decrement"
              onClick={() => handleDecrement('num_reels')}
              disabled={isReadonly}
            >
              <i className="fa-solid fa-minus"></i>
            </button>
            <input
              type="number"
              className="form-control"
              id={`deliverables[${index}][num_reels]`}
              name={`deliverables[${index}][num_reels]`}
              value={deliverable.num_reels || 0}
              onChange={(e) => handleInputChange('num_reels', e.target.value)}
              min="0"
              placeholder="0"
              readOnly={isReadonly}
            />
            <button
              type="button"
              className="btn-number btn-increment"
              onClick={() => handleIncrement('num_reels')}
              disabled={isReadonly}
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>

        {/* Number of Videos */}
        <div className="form-group">
          <label htmlFor={`deliverables[${index}][num_videos]`}>Number of Videos</label>
          <div className="number-input-group">
            <button
              type="button"
              className="btn-number btn-decrement"
              onClick={() => handleDecrement('num_videos')}
              disabled={isReadonly}
            >
              <i className="fa-solid fa-minus"></i>
            </button>
            <input
              type="number"
              className="form-control"
              id={`deliverables[${index}][num_videos]`}
              name={`deliverables[${index}][num_videos]`}
              value={deliverable.num_videos || 0}
              onChange={(e) => handleInputChange('num_videos', e.target.value)}
              min="0"
              placeholder="0"
              readOnly={isReadonly}
            />
            <button
              type="button"
              className="btn-number btn-increment"
              onClick={() => handleIncrement('num_videos')}
              disabled={isReadonly}
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliverableFormItem;
