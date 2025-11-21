import React from 'react';
import { Link } from 'react-router-dom';

const getDurationLabel = (campaign) => {
  if (campaign.duration) {
    return `${campaign.duration} days`;
  }
  if (campaign.start_date && campaign.end_date) {
    const start = new Date(campaign.start_date);
    const end = new Date(campaign.end_date);
    const diff = Math.abs(end - start);
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `${days} days`;
  }
  return 'Not specified';
};

const CampaignCard = ({ campaign, styles }) => {
  const requiredChannels = Array.isArray(campaign.required_channels)
    ? campaign.required_channels
    : campaign.required_channels
      ? `${campaign.required_channels}`.split(',')
      : [];

  return (
    <div className={styles.campaignCard} key={campaign.id || campaign._id}>
      <div className={styles.campaignHeader}>
        <h2 className={styles.campaignTitle}>{campaign.title || 'Campaign Title'}</h2>
        {campaign.status && <span className={styles.statusChip}>{campaign.status}</span>}
      </div>

      {campaign.description && <p className={styles.campaignDescription}>{campaign.description}</p>}

      <div className={styles.campaignDetailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Brand</span>
          <span className={styles.detailValue}>{campaign.brand_name || 'Unknown Brand'}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Budget</span>
          <span className={styles.detailValue}>${(campaign.budget || 0).toLocaleString()}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Duration</span>
          <span className={styles.detailValue}>{getDurationLabel(campaign)}</span>
        </div>
        {campaign.product_names && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Products</span>
            <span className={styles.detailValue}>{campaign.product_names}</span>
          </div>
        )}
        {campaign.primary_category && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Category</span>
            <span className={styles.detailValue}>{campaign.primary_category}</span>
          </div>
        )}
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Min Followers</span>
          <span className={styles.detailValue}>
            {campaign.min_followers ? campaign.min_followers.toLocaleString() : 'No minimum'}
          </span>
        </div>
        {campaign.target_audience && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Target Audience</span>
            <span className={styles.detailValue}>{campaign.target_audience}</span>
          </div>
        )}
      </div>

      {requiredChannels.length > 0 && (
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Required Channels</span>
          <div className={styles.channelsList}>
            {requiredChannels.map((channel) => (
              <span className={styles.channelTag} key={channel}>
                {channel}
              </span>
            ))}
          </div>
        </div>
      )}

      {campaign.objectives && (
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Campaign Objectives</span>
          <p className={styles.objectivesText}>{campaign.objectives}</p>
        </div>
      )}

      <div className={styles.campaignActions}>
        <div className={styles.campaignDates}>
          {campaign.start_date && <span>Starts: {new Date(campaign.start_date).toLocaleDateString()}</span>}
        </div>
        <Link to={`/influencer/collab/${campaign._id || campaign.id}`} className={styles.viewDetailsBtn}>
          View Details &amp; Apply
        </Link>
      </div>
    </div>
  );
};

export default CampaignCard;


