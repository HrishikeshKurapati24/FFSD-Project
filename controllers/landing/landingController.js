const LandingService = require('../../services/landing/landingService');
const { asyncErrorWrapper } = require('../../middleware/asyncErrorWrapper');

class LandingController {
    // -----------------------------------------
    // RENDER ROUTES (EJS PAGES)
    // -----------------------------------------

    static renderHome(req, res) {
        res.json({ success: true, page: 'home' });
    }

    static renderAbout(req, res) {
        res.json({ success: true, page: 'about' });
    }

    static renderRoleSelection(req, res) {
        res.json({ success: true, page: 'role_selection' });
    }

    static renderSignIn(req, res) {
        res.json({ success: true, page: 'signin' });
    }

    static renderBrandSignup(req, res) {
        res.json({ success: true, page: 'brand_signup' });
    }

    static renderInfluencerSignup(req, res) {
        res.json({ success: true, page: 'influencer_signup' });
    }

    // -----------------------------------------
    // API ENDPOINTS
    // -----------------------------------------

    static getPublicBrands = asyncErrorWrapper(async (req, res) => {
        console.log('Fetching brands for landing page...');
        const { status } = req.query;

        const brands = await LandingService.fetchActiveBrands(status);
        console.log('Brands processed:', brands.length);
        res.json(brands);
    });

    static getPublicInfluencers = asyncErrorWrapper(async (req, res) => {
        console.log('Fetching influencers for landing page...');
        const { status } = req.query;

        const influencers = await LandingService.fetchActiveInfluencers(status);
        console.log('Influencers processed:', influencers.length);
        res.json(influencers);
    });

    // -----------------------------------------
    // SIGNUP HANDLING
    // -----------------------------------------

    static async brandSignup(req, res) {
        try {
            const brandId = await LandingService.registerBrand(req.body);

            res.status(201).json({
                message: 'Brand account created successfully',
                brandId: brandId,
                redirectTo: `/subscription/select-plan?userId=${brandId}&userType=brand`
            });
        } catch (err) {
            console.error('Brand signup error:', err);
            res.status(err.statusCode || 500).json({
                message: err.message || 'Server error',
                errors: err.errors // Include validation errors if any
            });
        }
    }

    static async influencerSignup(req, res) {
        try {
            const influencerId = await LandingService.registerInfluencer(req.body);

            res.status(201).json({
                message: 'Influencer account created successfully',
                influencerId: influencerId,
                redirectTo: `/subscription/select-plan?userId=${influencerId}&userType=influencer`
            });
        } catch (err) {
            console.error('Influencer signup error:', err);
            res.status(err.statusCode || 500).json({
                message: err.message || 'Server error',
                errors: err.errors
            });
        }
    }
}

module.exports = LandingController;
