const fs = require('fs');
const ctrlPath = './controllers/brand/brandCampaignController.js';

let ctrlC = `const mongoose = require('mongoose');
const brandCampaignService = require('../../services/brand/brandCampaignService');
const { CampaignInfo } = require('../../models/CampaignMongo');

const controller = {
  // Return campaign deliverables aggregated from CampaignInfluencers documents
  async getCampaignDeliverables(req, res) {
    try {
      const { campaignId } = req.params;
      const brandId = req.session.user.id;
      
      const data = await brandCampaignService.getCampaignDeliverables(campaignId, brandId);
      
      if(data.message) {
         return res.json({ success: true, ...data });
      }

      return res.json({
        success: true,
        ...data
      });
    } catch (err) {
      console.error('[getCampaignDeliverables] Error:', err);
      return res.status(err.message === 'Campaign not found or you do not have access' ? 404 : (err.message === 'Campaign ID is required' ? 400 : 500)).json({
        success: false,
        message: err.message || 'Server error while fetching deliverables',
        error: err.message
      });
    }
  },

  // Update deliverables for one or more influencer collaborations and recompute progress
  async updateCampaignDeliverables(req, res) {
    try {
      const { campaignId } = req.params;
      const brandId = req.session.user.id;
      const { updates } = req.body;

      const results = await brandCampaignService.updateCampaignDeliverables(campaignId, brandId, updates);
      
      res.json({ success: true, results });
    } catch (err) {
      console.error('Error updating campaign deliverables:', err);
      res.status(err.message === 'Campaign not found' ? 404 : (err.message.includes('required') || err.message.includes('provided') ? 400 : 500)).json({ success: false, message: err.message || 'Error updating campaign deliverables' });
    }
  },

  // Get list of influencers for a specific campaign (Level 1)
  async getCampaignInfluencers(req, res) {
    try {
      const { campaignId } = req.params;
      const brandId = req.session.user.id;
      
      const formattedInfluencers = await brandCampaignService.getCampaignInfluencers(campaignId, brandId);

      res.json({
        success: true,
        influencers: formattedInfluencers
      });
    } catch (error) {
      console.error('Error fetching campaign influencers:', error);
      res.status(error.message === 'Campaign not found' ? 404 : (error.message.includes('required') ? 400 : 500)).json({ success: false, message: error.message || 'Error fetching influencers' });
    }
  },

  // Get detailed contribution of an influencer for a campaign (Level 2)
  async getInfluencerContribution(req, res) {
    try {
      const { campaignId, influencerId } = req.params;
      const brandId = req.session.user.id;
      
      const data = await brandCampaignService.getInfluencerContribution(campaignId, influencerId, brandId);

      res.json({
        success: true,
        ...data
      });
    } catch (error) {
      console.error('Error fetching influencer contribution:', error);
      res.status(error.message === 'Campaign not found' || error.message.includes('not part of') ? 404 : (error.message.includes('required') ? 400 : 500)).json({ success: false, message: error.message || 'Error fetching contribution details' });
    }
  }
};

module.exports = controller;
`;

fs.writeFileSync(ctrlPath, ctrlC);

