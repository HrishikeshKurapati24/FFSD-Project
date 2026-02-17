import React from 'react';
import DeliverableFormItem from './DeliverableFormItem';

const DeliverablesSection = ({
  deliverables,
  deliverableErrors,
  onDeliverableChange,
  onRemoveDeliverable,
  onAddDeliverable,
  mode = 'edit', // 'edit' | 'readonly' | 'checklist'
  onChecklistToggle,
  title = 'Deliverables',
  footer, // optional: node with action buttons (e.g., Save/Close) for modal usage
  onItemFieldChange // optional: (index, field, value) => void for external state mgmt
}) => {
  const handleChange = (deliverableId, field, value, index) => {
    if (typeof onItemFieldChange === 'function' && typeof index === 'number') {
      onItemFieldChange(index, field, value);
    } else if (typeof onDeliverableChange === 'function') {
      onDeliverableChange(deliverableId, field, value);
    }
  };

  return (
    <div className="deliverables-section">
      <h3 className="section-title">
        <i className="fa-solid fa-list-check"></i> {title}
      </h3>
      {mode === 'edit' && (
        <p className="section-description">
          Specify what influencers are expected to do for this campaign. Add deliverables for each platform.
        </p>
      )}

      <div id="deliverables-container">
        {deliverables.map((deliverable, index) => (
          <DeliverableFormItem
            key={deliverable.id || deliverable._id || index}
            deliverable={deliverable}
            index={index}
            deliverableErrors={deliverableErrors}
            onDeliverableChange={(id, field, value) => handleChange(id, field, value, index)}
            onRemoveDeliverable={onRemoveDeliverable}
            canRemove={mode === 'edit' && deliverables.length > 1}
            mode={mode}
            onChecklistToggle={onChecklistToggle}
          />
        ))}
      </div>

      {mode === 'edit' && (
        <div className="add-deliverable-container">
          <button type="button" className="btn btn-secondary" onClick={onAddDeliverable}>
            <i className="fa-solid fa-plus"></i> Add Another Deliverable
          </button>
        </div>
      )}

      {footer && <div className="deliverables-footer">{footer}</div>}
    </div>
  );
};

export default DeliverablesSection;
