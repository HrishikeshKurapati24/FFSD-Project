const brandCampaignService = require('../../services/brand/brandCampaignService');

const controller = {
  // Return campaign deliverables aggregated from CampaignInfluencers documents
  async getCampaignDeliverables(req, res) {
    try {
      const { campaignId } = req.params;
      const brandId = req.session.user.id;

      const data = await brandCampaignService.getCampaignDeliverables(campaignId, brandId);

      if (data.message) {
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
  ,
  async getCollabs(req, res) {
    try {
      const brandId = req.session.user.id;
      const collabs = await brandCampaignService.getCollabsData(brandId);
      res.json({ success: true, collabs, influencers: [] });
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ success: false, message: 'Error loading campaigns', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
  },

  async getReceivedRequests(req, res) {
    try {
      const brandId = req.session.user.id;
      const requests = await brandCampaignService.getReceivedRequestsData(brandId);
      return res.json({ success: true, requests });
    } catch (error) {
      console.error('Error fetching received requests:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch received requests' });
    }
  },

  createCollab(req, res) {
    res.json({ success: true });
  },

  async getTransaction(req, res) {
    try {
      const brandId = req.session.user.id;
      const { requestId1, requestId2 } = req.params;
      const data = await brandCampaignService.getTransactionData(requestId1, requestId2);

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found',
          requestItems: null,
          campaign_info: null,
          influencer_info: null
        });
      }

      res.json({
        success: true,
        requestItems: {
          id1: requestId1,
          id2: requestId2,
          status: data.status,
          progress: data.progress
        },
        campaign_info: data.campaign,
        influencer_info: data.influencer
      });
    } catch (error) {
      console.error('Error fetching Transaction:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  },

  async submitTransaction(req, res) {
    try {
      const brandId = req.session.user.id;
      const { requestId1, requestId2 } = req.params;
      const result = await brandCampaignService.submitTransaction(brandId, requestId1, requestId2, req.body, req.file);

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json(result);
      }
      req.session.successMessage = result.message;
      req.session.save(() => res.redirect('/brand/home'));
    } catch (error) {
      console.error('Error submitting transaction:', error);
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(error.message.includes('required') || error.message.includes('Invalid') ? 400 : 500).json({ success: false, message: error.message });
      }
      res.status(500).send(error.message);
    }
  },

  async createCampaign(req, res) {
    try {
      const brandId = req.session.user.id;
      const result = await brandCampaignService.createCampaign(brandId, req.body, req.files);

      if (!result.success && result.redirectToPayment) {
        return res.json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(error.message.includes('required') || error.message.includes('Invalid') ? 400 : 500).json({ success: false, message: error.message });
    }
  },

  async activateCampaign(req, res) {
    try {
      const brandId = req.session.user.id;
      const { campaignId } = req.params;
      const result = await brandCampaignService.activateCampaign(brandId, campaignId);
      res.json(result);
    } catch (error) {
      console.error('Error activating campaign:', error);
      res.status(error.message.includes('no accepted influencers') ? 400 : 500).json({ success: false, message: error.message });
    }
  },

  async getCampaignDetails(req, res) {
    try {
      const brandId = req.session.user.id;
      const { campaignId } = req.params;
      const details = await brandCampaignService.getCampaignDetails(brandId, campaignId);
      res.json({ success: true, campaign: details });
    } catch (error) {
      console.error('Error getting campaign details:', error);
      res.status(error.message === 'Campaign not found' ? 404 : 500).json({ success: false, message: error.message });
    }
  },

  async endCampaign(req, res) {
    try {
      const brandId = req.session.user.id;
      const { campaignId } = req.params;
      const result = await brandCampaignService.endCampaign(brandId, campaignId);
      res.json(result);
    } catch (error) {
      console.error('Error ending campaign:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({ success: false, message: error.message });
    }
  },

  async getDraftCampaigns(req, res) {
    try {
      const brandId = req.session.user.id;
      const drafts = await brandCampaignService.getDraftCampaigns(brandId);
      res.json({ success: true, drafts });
    } catch (error) {
      console.error('Error getting draft campaigns:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async declineRequest(req, res) {
    try {
      const brandId = req.session.user.id;
      const { requestId1, requestId2 } = req.params;
      const result = await brandCampaignService.declineRequest(brandId, requestId1, requestId2);
      res.json(result);
    } catch (error) {
      console.error('Error declining request:', error);
      res.status(error.message === 'Request not found' ? 404 : 500).json({ success: false, message: error.message });
    }
  }

};

module.exports = controller;
