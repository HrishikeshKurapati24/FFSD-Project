const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const influencerController = require('../controllers/influencerController');
const collabController = require('../controllers/collabController');
const requestController = require('../controllers/requestController');

// Admin Auth Middleware
const influencerAuth = (req, res, next) => {
    // Add user data to all admin routes
    res.locals.user = {
        name: 'Influencer User',
        email: 'influencer@example.com',
        role: 'influencer'
    };
    next();
};

// Route for the I_explore
router.get('/explore', brandController.getExplorePage);


// Route for the influencer collab page
router.get('/collab', collabController.getCollabPage);


// Route for the collab detail page
router.get('/Collab_form_open', collabController.getCollabDetailPage);

module.exports = router;