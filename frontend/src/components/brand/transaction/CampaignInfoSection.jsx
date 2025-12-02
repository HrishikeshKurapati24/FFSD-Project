import React from 'react';

const CampaignInfoSection = ({ transactionData, styles }) => {
  return (
    <div className={styles.campaignSection}>
      <h1>{transactionData.campaignTitle}</h1>
      <p className={styles.description}>{transactionData.campaignDescription}</p>
      <div className={styles.campaignDetails}>
        <div className={styles.detailItem}>
          <i className="fas fa-calendar"></i>
          <span>Duration: {transactionData.campaignDuration}</span>
        </div>
        <div className={styles.detailItem}>
          <i className="fas fa-dollar-sign"></i>
          <span>Budget(in $): {transactionData.campaignBudget}</span>
        </div>
        <div className={styles.detailItem}>
          <i className="fas fa-users"></i>
          <span>Target Audience: {transactionData.campaignTargetAudience}</span>
        </div>
        <div className={styles.detailItem}>
          <i className="fas fa-chart-line"></i>
          <span>Min Followers: {transactionData.campaignMinFollowers?.toLocaleString()}</span>
        </div>
        <div className={styles.detailItem}>
          <i className="fas fa-calendar-alt"></i>
          <span>Start Date: {transactionData.campaignStartDate}</span>
        </div>
        <div className={styles.detailItem}>
          <i className="fas fa-calendar-check"></i>
          <span>End Date: {transactionData.campaignEndDate}</span>
        </div>
      </div>
      <div className={styles.requiredChannels}>
        <h3>Required Channels:</h3>
        <div className={styles.channelBadges}>
          {transactionData.campaignRequiredChannels &&
          transactionData.campaignRequiredChannels.length > 0 ? (
            transactionData.campaignRequiredChannels.map((channel, index) => (
              <span key={index} className={styles.channelBadge}>
                {channel}
              </span>
            ))
          ) : (
            <span className={styles.noChannels}>No specific channels required</span>
          )}
        </div>
      </div>
      <div className={styles.objectives}>
        <h3>Campaign Objectives:</h3>
        <p>{transactionData.campaignObjectives}</p>
      </div>
    </div>
  );
};

export default CampaignInfoSection;
