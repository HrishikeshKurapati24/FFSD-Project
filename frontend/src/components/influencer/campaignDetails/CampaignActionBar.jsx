import React from 'react';

const CampaignActionBar = ({
  styles,
  applicationStatus,
  isEligible,
  applying,
  specialMessage,
  setSpecialMessage,
  onApply
}) => (
  <div className={styles.actionButtons}>
    {applicationStatus === 'request' ? (
      <button type="button" className={styles.secondaryButton} disabled>
        <i className="fas fa-check" /> Applied for Campaign
      </button>
    ) : applicationStatus === 'active' ? (
      <button type="button" className={styles.secondaryButton} disabled>
        <i className="fas fa-check" /> Application already accepted
      </button>
    ) : (
      <div className={styles.actionInputGroup}>
        <input
          type="text"
          className={styles.messageInput}
          placeholder="Add a message to brand (optional)"
          value={specialMessage}
          onChange={(e) => setSpecialMessage(e.target.value)}
        />
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onApply}
          disabled={!isEligible || applying}
        >
          <i className="fas fa-check" /> {applying ? 'Submitting...' : 'Apply For Campaign'}
        </button>
      </div>
    )}
    {!isEligible && (
      <div className={styles.eligibilityNote}>
        <i className="fas fa-info-circle" /> Complete the unmet requirements to become eligible for this campaign.
      </div>
    )}
  </div>
);

export default CampaignActionBar;


