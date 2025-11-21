import React from 'react';

const CampaignHeader = ({ collab, statusClass, styles }) => (
  <div className={styles.campaignHeader}>
    <div className={styles.brandInfo}>
      <img
        src={collab.brand_logo || '/images/default-avatar.jpg'}
        alt={collab.brand_name || 'Brand logo'}
        className={styles.brandLogo}
      />
      <div className={styles.brandDetails}>
        <h1>{collab.title || 'Campaign Title'}</h1>
        <p className={styles.brandName}>{collab.brand_name || 'Unknown Brand'}</p>
      </div>
    </div>
    <div className={`${styles.statusBadge} ${statusClass}`}>{collab.status || 'Active'}</div>
  </div>
);

export default CampaignHeader;


