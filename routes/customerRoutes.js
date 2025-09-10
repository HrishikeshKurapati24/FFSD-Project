const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');

// Offers routes
router.get('/offers', offerController.getOffers);
router.get('/offers/:offerId', offerController.getOfferDetails);

module.exports = router;