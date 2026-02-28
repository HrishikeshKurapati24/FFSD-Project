const fs = require('fs');

const ctrlPath = './controllers/brand/brandProfileController.js';
let ctrlC = fs.readFileSync(ctrlPath, 'utf8');

const s3Rep = `  async getCampaignInfluencers(req, res) {
    try {
      const { campaignId } = req.params;
      const brandId = req.session.user.id;
      
      const brandCampaignService = require('../../services/brand/brandCampaignService');
      const formattedInfluencers = await brandCampaignService.getCampaignInfluencers(campaignId, brandId);

      res.json({
        success: true,
        influencers: formattedInfluencers
      });
    } catch (error) {
      console.error('Error fetching campaign influencers:', error);
      res.status(error.message === 'Campaign not found' ? 404 : (error.message.includes('required') ? 400 : 500)).json({ success: false, message: error.message || 'Error fetching influencers' });
    }
  },`;

ctrlC = ctrlC.replace(/async getCampaignInfluencers\(req, res\) \{[\s\S]*?(?=\/\/\s*Get detailed contribution of an influencer)/m, s3Rep + '\n\n  ');

const s4Rep = `  async getInfluencerContribution(req, res) {
    try {
      const { campaignId, influencerId } = req.params;
      const brandId = req.session.user.id;
      
      const brandCampaignService = require('../../services/brand/brandCampaignService');
      const data = await brandCampaignService.getInfluencerContribution(campaignId, influencerId, brandId);

      res.json({
        success: true,
        ...data
      });
    } catch (error) {
      console.error('Error fetching influencer contribution:', error);
      res.status(error.message === 'Campaign not found' || error.message.includes('not part of') ? 404 : (error.message.includes('required') ? 400 : 500)).json({ success: false, message: error.message || 'Error fetching contribution details' });
    }
  },`;

ctrlC = ctrlC.replace(/async getInfluencerContribution\(req, res\) \{[\s\S]*?(?=\/\/\s*Get products for brand)/m, s4Rep + '\n\n  ');

fs.writeFileSync(ctrlPath, ctrlC);

