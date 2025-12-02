import React from 'react';
import CampaignCard from './CampaignCard';

const CampaignList = ({ campaigns, styles }) => (
  <div className={styles.campaignList}>
    {campaigns.map((campaign) => (
      <CampaignCard key={campaign._id || campaign.id} campaign={campaign} styles={styles} />
    ))}
  </div>
);

export default CampaignList;


