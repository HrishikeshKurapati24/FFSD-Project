const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const influencerController = require('../controllers/influencerController');
const collabController = require('../controllers/collabController');
const requestController = require('../controllers/requestController');


// Route for the influencer explore page
router.get('/explore', influencerController.getInfluencerExplorePage);

// Route for the brand collab page
router.get('/collab', collabController.getB2CollabPage);

// Route for the received requests page
router.get('/recievedRequests', requestController.getReceivedRequestsPage);

module.exports = router;