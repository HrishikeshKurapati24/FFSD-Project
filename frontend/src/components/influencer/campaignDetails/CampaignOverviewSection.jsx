import React from 'react';

const CampaignOverviewSection = ({ collab, styles }) => (
  <div className={styles.detailSection}>
    <h3>Campaign Overview</h3>
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>Description:</span>
      <span className={styles.detailValue}>{collab.description || 'No description provided.'}</span>
    </div>
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>Objectives:</span>
      <span className={styles.detailValue}>{collab.objectives || 'Not specified'}</span>
    </div>
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>Target Audience:</span>
      <span className={styles.detailValue}>{collab.target_audience || 'Not specified'}</span>
    </div>
  </div>
);

export default CampaignOverviewSection;


