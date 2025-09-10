const { CampaignInfluencers } = require('../config/CampaignMongo');
const mongoose = require('mongoose');

const getRequestById = async (requestId) => {
  try {
    const req = await CampaignInfluencers.findById(requestId)
      .populate('influencer_id', 'fullName channels followers engagement_rate')
      .populate('campaign_id', 'title required_channels min_followers target_audience age_group genders')
      .lean();

    if (!req) {
      return null;
    }

    return {
      collab_title: req.campaign_id?.title || '',
      influencer_name: req.influencer_id?.fullName || '',
      influencer_channels: req.influencer_id?.channels?.join(', ') || '',
      followers: req.influencer_id?.followers || 0,
      engagement_rate: req.influencer_id?.engagement_rate || 0,
      required_channels: req.campaign_id?.required_channels?.join(', ') || '',
      min_followers: req.campaign_id?.min_followers || 0,
      age_group: req.campaign_id?.age_group || '',
      genders: req.campaign_id?.genders || ''
    };
  } catch (error) {
    console.error('Error fetching collaboration request by id:', error);
    throw error;
  }
};

module.exports = { getRequestById };