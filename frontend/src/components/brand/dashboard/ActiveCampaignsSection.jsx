import React from 'react';
import { Link } from 'react-router-dom';
import ActiveCampaignCard from './ActiveCampaignCard';

const ActiveCampaignsSection = ({ campaigns, onReviewContent, onEndCampaign, onViewInfluencers }) => {
  return (
    <section className="campaigns-section">
      <h2 className="section-header">Active Campaigns</h2>
      <div className="campaign-list">
        {campaigns && campaigns.length > 0 ? (
          campaigns.map(campaign => (
            <ActiveCampaignCard
              key={campaign._id}
              campaign={campaign}
              onReviewContent={onReviewContent}
              onEndCampaign={onEndCampaign}
              onViewInfluencers={onViewInfluencers}
            />
          ))
        ) : (
          <div className="no-active-campaigns">
            <i className="fas fa-rocket"></i>
            <h3>No Active Campaigns</h3>
            <p>You don't have any active campaigns at the moment. Create a new campaign to get started!</p>
            <Link to="/brand/create_campaign" className="create-campaign-btn">Create Campaign</Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default ActiveCampaignsSection;
