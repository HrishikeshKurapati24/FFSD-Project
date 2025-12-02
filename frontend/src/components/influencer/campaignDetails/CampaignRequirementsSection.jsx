import React from 'react';

const CampaignRequirementsSection = ({
  styles,
  minFollowers,
  requiredChannels,
  unmetRequirements
}) => (
  <div className={styles.detailSection}>
    <h3>Requirements</h3>
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>Minimum Followers:</span>
      <span className={styles.detailValue}>
        {typeof minFollowers === 'number' ? minFollowers.toLocaleString() : 'Not specified'}
      </span>
    </div>
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>Required Channels:</span>
      <div className={styles.channelsList}>
        {requiredChannels.length > 0 ? (
          requiredChannels.map((channel) => (
            <span className={styles.channelBadge} key={channel}>
              {channel}
            </span>
          ))
        ) : (
          <span className={styles.detailValue}>Not specified</span>
        )}
      </div>
    </div>
    {unmetRequirements.length > 0 && (
      <div className={`${styles.detailItem} ${styles.unmetRequirements}`}>
        <span className={`${styles.detailLabel} ${styles.unmetLabel}`}>Unmet Requirements:</span>
        <ul className={styles.unmetList}>
          {unmetRequirements.map((req) => (
            <li key={req}>{req}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export default CampaignRequirementsSection;


