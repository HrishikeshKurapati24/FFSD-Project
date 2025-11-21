import React from 'react';

const CampaignDetailsSection = ({ styles, durationLabel, budget, startDate, endDate }) => (
  <div className={styles.detailSection}>
    <h3>Campaign Details</h3>
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>Duration:</span>
      <span className={styles.detailValue}>{durationLabel}</span>
    </div>
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>Budget:</span>
      <span className={styles.detailValue}>{budget} Rupees</span>
    </div>
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>Start Date:</span>
      <span className={styles.detailValue}>{startDate}</span>
    </div>
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>End Date:</span>
      <span className={styles.detailValue}>{endDate}</span>
    </div>
  </div>
);

export default CampaignDetailsSection;


