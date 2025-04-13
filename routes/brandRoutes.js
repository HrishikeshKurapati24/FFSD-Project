const express = require('express');
const router = express.Router();
const { uploadProfilePic, uploadBanner, handleUploadError } = require('../utils/imageUpload');
const brandController = require('../controllers/brandController');
const influencerController = require('../controllers/influencerController');
const collabController = require('../controllers/collabController');
const requestController = require('../controllers/requestController');

router.get('/home', brandController.getBrandDashboard);

// Route for the influencer explore page
router.get('/explore', influencerController.getInfluencerExplorePage);

// Route for the brand collab page
router.get('/collab', collabController.getB2CollabPage);

// Route for the received requests page
router.get('/recievedRequests', requestController.getReceivedRequestsPage);

// Brand profile routes
// Update brand profile with profile picture
router.post('/profile/update', uploadProfilePic, uploadBanner, handleUploadError, brandController.updateBrandProfile);
router.get('/profile', brandController.getBrandProfile);
router.post('/verify', brandController.requestVerification);
router.get('/verification-status', brandController.getVerificationStatus);
router.post('/social-links', brandController.updateSocialLinks);
router.get('/stats', brandController.getBrandStats);
router.get('/campaigns', brandController.getTopCampaigns);
router.get('/analytics', brandController.getBrandAnalytics);

module.exports = router;