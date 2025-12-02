import React from 'react';
import { Link } from 'react-router-dom';
import CampaignHistoryCard from './CampaignHistoryCard';

const CampaignHistoryList = ({
  campaigns,
  styles,
  formatNumber,
  formatPercent,
  formatCurrency,
  formatDate,
  getBrandLogo
}) => {
  if (campaigns.length === 0) {
    return (
      <div className={styles['no-campaigns']}>
        <i className="fas fa-history" aria-hidden="true"></i>
        <h3>No Campaign History</h3>
        <p>You haven’t completed any campaigns yet.</p>
        <Link to="/influencer/explore" className={styles['cta-btn']}>
          Explore Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className={styles['campaigns-grid']}>
      {campaigns.map((campaign) => (
        <CampaignHistoryCard
          key={campaign._id || campaign.id || campaign.campaign_id}
          campaign={campaign}
          styles={styles}
          formatNumber={formatNumber}
          formatPercent={formatPercent}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getBrandLogo={getBrandLogo}
        />
      ))}
    </div>
  );
};

export default CampaignHistoryList;


