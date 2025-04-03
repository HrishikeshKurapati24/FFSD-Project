const express = require('express');
const router = express.Router();
const brandController = require("../controllers/brandController")

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

module.exports = router;