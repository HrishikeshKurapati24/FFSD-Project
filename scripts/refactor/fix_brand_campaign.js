const fs = require('fs');

const ctrlPath = './controllers/brand/brandCampaignController.js';
let ctrlC = fs.readFileSync(ctrlPath, 'utf8');

const s1Match = /async getCampaignDeliverables\(req, res\) \{[\s\S]*?(?=try \{[\s\S]*?const payload[\s\S]*?res\.json\(\{)/m;
const m1 = ctrlC.match(s1Match);

if(m1) {
    const s1Rep = `async getCampaignDeliverables(req, res) {
    try {
      const { campaignId } = req.params;
      const brandId = req.session.user.id;
      
      const brandCampaignService = require('../../services/brand/brandCampaignService');
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
  },`;
    ctrlC = ctrlC.replace(/async getCampaignDeliverables\(req, res\) \{[\s\S]*?(?=\/\/\s*Update deliverables for one or more)/, s1Rep + '\n\n  ');
}

const s2Match = /async updateCampaignDeliverables\(req, res\) \{[\s\S]*?(?=try \{[\s\S]*?const results[\s\S]*?res\.json\(\{)/m;
const m2 = ctrlC.match(s2Match);
if(m2) {
    const s2Rep = `async updateCampaignDeliverables(req, res) {
    try {
      const { campaignId } = req.params;
      const brandId = req.session.user.id;
      const { updates } = req.body;

      const brandCampaignService = require('../../services/brand/brandCampaignService');
      const results = await brandCampaignService.updateCampaignDeliverables(campaignId, brandId, updates);
      
      res.json({ success: true, results });
    } catch (err) {
      console.error('Error updating campaign deliverables:', err);
      res.status(err.message === 'Campaign not found' ? 404 : (err.message.includes('required') || err.message.includes('provided') ? 400 : 500)).json({ success: false, message: err.message || 'Error updating campaign deliverables' });
    }
  },`;
    // Using simple replacement for the next method.
    // The previous method was updateCampaignDeliverables
    ctrlC = ctrlC.replace(/async updateCampaignDeliverables\(req, res\) \{[\s\S]*?(?=\/\/\s*Get explore page|\/\*\*\s*Get explore page|\s*async getExplorePage)/, s2Rep + '\n\n  ');
}

// Next is getCampaignInfluencers
// Wait, getExplorePage, getBrandProfile, updateBrandProfile, requestVerification, getVerificationStatus, updateSocialLinks, getBrandStats, getTopCampaigns, getBrandAnalytics, getBrandDashboard, getCampaignHistory
// are actually in brandProfileController, NOT brandCampaignController!
// Let me verify the brandCampaignController file path. Wait, I was looking at brandProfileController earlier!
