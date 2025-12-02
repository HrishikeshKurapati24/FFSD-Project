import React from 'react';

const CampaignCompletionForm = ({ formData, formErrors, handleInputChange, styles }) => {
  return (
    <div className={styles.campaignSection} style={{ marginBottom: '30px' }}>
      <h3>Complete Campaign Details</h3>
      <p className={styles.sectionDescription}>
        Please complete the campaign details before proceeding with payment.
      </p>

      <div className={styles.formGroup}>
        <label htmlFor="objectives">Campaign Objectives *</label>
        <textarea
          id="objectives"
          name="objectives"
          rows="4"
          value={formData.objectives}
          onChange={handleInputChange}
          placeholder="e.g., Increase brand awareness, Drive sales, Promote new product launch, Build community engagement"
          className={formErrors.objectives ? styles.errorInput : ''}
        />
        {formErrors.objectives && (
          <small className={styles.errorInline}>{formErrors.objectives}</small>
        )}
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="startDate">Start Date *</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            className={formErrors.startDate ? styles.errorInput : ''}
          />
          {formErrors.startDate && (
            <small className={styles.errorInline}>{formErrors.startDate}</small>
          )}
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="endDate">End Date *</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            className={formErrors.endDate ? styles.errorInput : ''}
          />
          {formErrors.endDate && (
            <small className={styles.errorInline}>{formErrors.endDate}</small>
          )}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="targetAudience">Target Audience *</label>
        <input
          type="text"
          id="targetAudience"
          name="targetAudience"
          value={formData.targetAudience}
          onChange={handleInputChange}
          placeholder="e.g., Young Adults, 18-35, interested in fashion"
          className={formErrors.targetAudience ? styles.errorInput : ''}
        />
        {formErrors.targetAudience && (
          <small className={styles.errorInline}>{formErrors.targetAudience}</small>
        )}
      </div>
    </div>
  );
};

export default CampaignCompletionForm;
