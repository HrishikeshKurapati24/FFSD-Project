/**
 * @swagger
 * tags:
 *   name: Landing
 *   description: Public-facing landing page routes — no authentication required.
 *
 * components:
 *   schemas:
 *     BrandSignupRequest:
 *       type: object
 *       required:
 *         - brandName
 *         - email
 *         - password
 *       properties:
 *         brandName:
 *           type: string
 *           example: Acme Corp
 *         email:
 *           type: string
 *           format: email
 *           example: brand@acme.com
 *         password:
 *           type: string
 *           format: password
 *           example: BrandPass123
 *         industry:
 *           type: string
 *           example: FMCG
 *         website:
 *           type: string
 *           example: https://acme.com
 *         phone:
 *           type: string
 *           example: "+919876543210"
 *         totalAudience:
 *           type: integer
 *           example: 5000000
 *
 *     InfluencerSignupRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - password
 *         - platform
 *         - socialHandle
 *       properties:
 *         fullName:
 *           type: string
 *           example: Jane Doe
 *         email:
 *           type: string
 *           format: email
 *           example: jane@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: InfluPass123
 *         platform:
 *           type: string
 *           enum: [instagram, youtube, tiktok, facebook, twitter, linkedin]
 *           example: instagram
 *         socialHandle:
 *           type: string
 *           example: "@janedoe"
 *         audience:
 *           type: integer
 *           example: 250000
 *         niche:
 *           type: string
 *           example: Beauty & Lifestyle
 *         phone:
 *           type: string
 *           example: "+919876543210"
 *
 *     PublicBrand:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         brandName:
 *           type: string
 *         industry:
 *           type: string
 *         logoUrl:
 *           type: string
 *         completedCampaigns:
 *           type: integer
 *         influencerPartnerships:
 *           type: integer
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *         avgCampaignRating:
 *           type: number
 *           format: float
 *
 *     PublicInfluencer:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         fullName:
 *           type: string
 *         niche:
 *           type: string
 *         profilePicUrl:
 *           type: string
 *         avgRating:
 *           type: number
 *           format: float
 *         completedCollabs:
 *           type: integer
 *         categories:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Render the landing home page
 *     tags: [Landing]
 *     responses:
 *       200:
 *         description: Landing home page (HTML or JSON depending on Accept header)
 */

/**
 * @swagger
 * /about:
 *   get:
 *     summary: Render the about page
 *     tags: [Landing]
 *     responses:
 *       200:
 *         description: About page content
 */

/**
 * @swagger
 * /Sup_role:
 *   get:
 *     summary: Render the role selection page (Brand / Influencer / Customer)
 *     tags: [Landing]
 *     responses:
 *       200:
 *         description: Role selection page
 */

/**
 * @swagger
 * /SignIn:
 *   get:
 *     summary: Render the sign-in page
 *     tags: [Landing]
 *     responses:
 *       200:
 *         description: Sign-in page
 */

/**
 * @swagger
 * /Lp_index:
 *   get:
 *     summary: Alias for the landing home page
 *     tags: [Landing]
 *     responses:
 *       200:
 *         description: Landing home page
 */

/**
 * @swagger
 * /influencer/Sup_i:
 *   get:
 *     summary: Render the influencer sign-up page
 *     tags: [Landing]
 *     responses:
 *       200:
 *         description: Influencer signup page
 */

/**
 * @swagger
 * /brand/Sup_b:
 *   get:
 *     summary: Render the brand sign-up page
 *     tags: [Landing]
 *     responses:
 *       200:
 *         description: Brand signup page
 */

/**
 * @swagger
 * /api/brands:
 *   get:
 *     summary: Get public list of active brands for landing page modals
 *     tags: [Landing]
 *     responses:
 *       200:
 *         description: Array of public brand summaries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PublicBrand'
 *       404:
 *         description: No brands found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/influencers:
 *   get:
 *     summary: Get public list of active influencers for landing page modals
 *     tags: [Landing]
 *     responses:
 *       200:
 *         description: Array of public influencer summaries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PublicInfluencer'
 *       404:
 *         description: No influencers found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /signup-form-brand:
 *   post:
 *     summary: Register a new brand account
 *     tags: [Landing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BrandSignupRequest'
 *     responses:
 *       201:
 *         description: Brand account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Brand account created successfully
 *                 brandId:
 *                   type: string
 *                 redirectTo:
 *                   type: string
 *                   example: /subscription/select-plan?userId=...&userType=brand
 *       400:
 *         description: Email already exists or validation error
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /signup-form-influencer:
 *   post:
 *     summary: Register a new influencer account
 *     tags: [Landing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InfluencerSignupRequest'
 *     responses:
 *       201:
 *         description: Influencer account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Influencer account created successfully
 *                 influencerId:
 *                   type: string
 *                 redirectTo:
 *                   type: string
 *                   example: /subscription/select-plan?userId=...&userType=influencer
 *       400:
 *         description: Email already exists, invalid platform, or validation error
 *       500:
 *         description: Server error
 */

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
