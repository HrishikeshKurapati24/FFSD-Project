const express = require('express');
const router = express.Router();
const LandingController = require('../controllers/landing/landingController');

// -----------------------------------------
// RENDER ROUTES (EJS PAGES)
// -----------------------------------------
router.get('/', LandingController.renderHome);
router.get('/about', LandingController.renderAbout);
router.get('/Sup_role', LandingController.renderRoleSelection);
router.get('/SignIn', LandingController.renderSignIn);
router.get('/Lp_index', LandingController.renderHome);
router.get('/influencer/Sup_i', LandingController.renderInfluencerSignup);
router.get('/brand/Sup_b', LandingController.renderBrandSignup);

// -----------------------------------------
// API ROUTES FOR LANDING MODALS
// -----------------------------------------
router.get('/api/brands', LandingController.getPublicBrands);
router.get('/api/influencers', LandingController.getPublicInfluencers);

// -----------------------------------------
// FORM SUBMISSIONS FOR SIGNUP
// -----------------------------------------
router.post('/signup-form-brand', LandingController.brandSignup);
router.post('/signup-form-influencer', LandingController.influencerSignup);

module.exports = router;
