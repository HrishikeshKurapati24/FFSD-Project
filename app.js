require('dotenv').config();
const express = require('express');
const app = express();
const session = require("express-session");
const adminRoutes = require("./routes/adminRoutes");
const influencerRoutes = require("./routes/influencerRoutes");
const brandRoutes = require("./routes/brandRoutes");
const customerRoutes = require("./routes/customerRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const { router: authRouter, isAuthenticated, isBrand, isInfluencer } = require('./routes/authRoutes');
const path = require('path');
const { connectDB, initializeAdminUsers } = require('./models/mongoDB');
const { BrandInfo, BrandSocials, BrandAnalytics } = require('./config/BrandMongo');
const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('./config/InfluencerMongo');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Debug middleware
app.use((req, res, next) => {
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);
    next();
});

// Update the middleware section
app.use((req, res, next) => {
    // Make user data available to all views
    res.locals.user = req.session.user || null;
    next();
});

// Route for the Landing_page
app.get('/', (req, res) => {
    res.render('landing/landing_page');
});

// Route for the about_page
app.get('/about', (req, res) => {
    res.render('landing/about');
});

// Route for the role selection
app.get('/Sup_role', (req, res) => {
    res.render('landing/role_selection');
});

// Route for the SignIn
app.get('/SignIn', (req, res) => {
    res.render('landing/signin');
});

// Route for the Home icon
app.get('/Lp_index', (req, res) => {
    res.render('landing/landing_page');
});

// Route for the influencer signup
app.get('/influencer/Sup_i', (req, res) => {
    res.render('landing/influencer_signup');
});

// Route for the brand signup
app.get('/brand/Sup_b', (req, res) => {
    res.render('landing/brand_signup');
});

// API routes for landing page modals
app.get('/api/brands', async (req, res) => {
    try {
        console.log('Fetching brands...');

        // First try to find brands with active status, if none found, get all brands
        let brands = await BrandInfo.find({ status: 'active' })
            .select('brandName industry logoUrl completedCampaigns influencerPartnerships categories avgCampaignRating')
            .lean();

        console.log('Active brands found:', brands.length);

        // If no active brands found, get all brands
        if (brands.length === 0) {
            brands = await BrandInfo.find({})
                .select('brandName industry logoUrl completedCampaigns influencerPartnerships categories avgCampaignRating')
                .lean();
            console.log('All brands found:', brands.length);
        }

        const brandsWithStats = brands.map(brand => {
            return {
                _id: brand._id,
                brandName: brand.brandName,
                industry: brand.industry,
                logoUrl: brand.logoUrl,
                completedCampaigns: brand.completedCampaigns || 0,
                influencerPartnerships: brand.influencerPartnerships || 0,
                categories: brand.categories || ['General'],
                avgCampaignRating: brand.avgCampaignRating || 0,
                totalFollowers: 0, // Simplified for now
                avgEngagementRate: 0 // Simplified for now
            };
        });

        console.log('Brands processed:', brandsWithStats.length);
        res.json(brandsWithStats);
    } catch (error) {
        console.error('Error fetching brands:', error);
        res.status(500).json({ error: 'Failed to fetch brands', details: error.message });
    }
});

app.get('/api/influencers', async (req, res) => {
    try {
        console.log('Fetching influencers...');

        // First try to find influencers with active status, if none found, get all influencers
        let influencers = await InfluencerInfo.find({ status: 'active' })
            .select('fullName niche profilePicUrl avgRating completedCollabs categories')
            .lean();

        console.log('Active influencers found:', influencers.length);

        // If no active influencers found, get all influencers
        if (influencers.length === 0) {
            influencers = await InfluencerInfo.find({})
                .select('fullName niche profilePicUrl avgRating completedCollabs categories')
                .lean();
            console.log('All influencers found:', influencers.length);
        }

        const influencersWithStats = influencers.map(influencer => {
            return {
                _id: influencer._id,
                fullName: influencer.fullName,
                niche: influencer.niche,
                profilePicUrl: influencer.profilePicUrl,
                avgRating: influencer.avgRating || 0,
                completedCollabs: influencer.completedCollabs || 0,
                categories: influencer.categories || ['General'],
                socialPlatforms: ['instagram', 'youtube'], // Simplified for now
                totalFollowers: Math.floor(Math.random() * 1000000) + 10000, // Random for demo
                avgEngagementRate: Math.floor(Math.random() * 10) + 3 // Random for demo
            };
        });

        console.log('Influencers processed:', influencersWithStats.length);
        res.json(influencersWithStats);
    } catch (error) {
        console.error('Error fetching influencers:', error);
        res.status(500).json({ error: 'Failed to fetch influencers', details: error.message });
    }
});

app.post('/signup-form-brand', async (req, res) => {
    try {
        const { brandName, email, password, industry, website, phone, totalAudience } = req.body;

        // Check if brand already exists
        const existingBrand = await BrandInfo.findOne({ email });
        if (existingBrand) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Generate a safe username
        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;

        // Create new brand with required fields
        const brand = new BrandInfo({
            brandName,
            email,
            password: hashedPassword,
            industry,
            website,
            budget: 0,
            totalAudience: totalAudience ? parseInt(totalAudience) : 0,
            phone,
            status: 'active',
            verified: false,
            // Set default values for other required fields
            username: username, // Generate username from email
            displayName: brandName,
            influenceRegions: 'Global',
            primaryMarket: 'Global'
        });

        // Create associated socials document
        const brandSocials = new BrandSocials({
            brandId: brand._id,
            platforms: []
        });

        // Create associated analytics document
        const brandAnalytics = new BrandAnalytics({
            brandId: brand._id,
            totalFollowers: 0,
            avgEngagementRate: 0,
            monthlyEarnings: 0,
            earningsChange: 0,
            rating: 0
        });

        // Save all documents
        await Promise.all([
            brand.save(),
            brandSocials.save(),
            brandAnalytics.save()
        ]);

        // Create default free subscription for the new brand
        try {
            const { SubscriptionService } = require('./models/brandModel');
            await SubscriptionService.createDefaultFreeSubscription(brand._id, 'brand');
        } catch (subscriptionError) {
            console.error('Error creating default subscription for brand:', subscriptionError);
            // Continue even if subscription creation fails
        }

        res.status(201).json({
            message: 'Brand account created successfully',
            brandId: brand._id,
            redirectTo: `/subscription/select-plan?userId=${brand._id}&userType=brand`
        });
    } catch (err) {
        console.error('Brand signup error:', err);
        res.status(500).json({
            message: err.message || 'Server error',
            errors: err.errors // Include validation errors if any
        });
    }
});

app.post('/signup-form-influencer', async (req, res) => {
    try {
        const { fullName, email, password, platform, socialHandle, audience, niche, phone } = req.body;

        // Validate platform selection
        const validPlatforms = ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'linkedin'];
        if (!platform || !validPlatforms.includes(platform)) {
            return res.status(400).json({ message: 'Please select a valid social media platform' });
        }

        // Check if influencer already exists
        const existingInfluencer = await InfluencerInfo.findOne({ email });
        if (existingInfluencer) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate a safe username
        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;

        // Create new influencer with required fields
        const influencer = new InfluencerInfo({
            fullName,
            email,
            password: hashedPassword,
            phone,
            niche,
            username: username, // Generate username from email
            displayName: fullName,
            verified: false,
            status: 'active',
            // Set default values for other required fields
            influenceRegions: 'Global',
            primaryMarket: 'Global'
        });

        // Create associated socials document
        const influencerSocials = new InfluencerSocials({
            influencerId: influencer._id,
            socialHandle,
            platforms: [{
                platform: platform,
                handle: socialHandle,
                followers: audience || 0
            }]
        });

        // Create associated analytics document
        const influencerAnalytics = new InfluencerAnalytics({
            influencerId: influencer._id,
            totalFollowers: audience || 0,
            avgEngagementRate: 0,
            monthlyEarnings: 0,
            earningsChange: 0,
            rating: 0
        });

        // Save all documents
        await Promise.all([
            influencer.save(),
            influencerSocials.save(),
            influencerAnalytics.save()
        ]);

        // Create default free subscription for the new influencer
        try {
            const { SubscriptionService } = require('./models/brandModel');
            await SubscriptionService.createDefaultFreeSubscription(influencer._id, 'influencer');
        } catch (subscriptionError) {
            console.error('Error creating default subscription for influencer:', subscriptionError);
            // Continue even if subscription creation fails
        }

        res.status(201).json({
            message: 'Influencer account created successfully',
            influencerId: influencer._id,
            redirectTo: `/subscription/select-plan?userId=${influencer._id}&userType=influencer`
        });
    } catch (err) {
        console.error('Influencer signup error:', err);
        res.status(500).json({
            message: err.message || 'Server error',
            errors: err.errors // Include validation errors if any
        });
    }
});

// Use routers
app.use('/admin', adminRoutes);
app.use('/influencer', influencerRoutes);
app.use('/brand', brandRoutes);
app.use('/customer', customerRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/auth', authRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { error: err.message });
});

// Start the server
const PORT = process.env.PORT || 3000;

// Initialize database and admin users
const initializeApp = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('✅ MongoDB connected successfully');

        // Initialize subscription plans
        const { SubscriptionService } = require('./models/brandModel');
        await SubscriptionService.initializeDefaultPlans();

        console.log('✅ Application initialized successfully');
    } catch (error) {
        console.error('Error during application initialization:', error);
        process.exit(1);
    }
};

// Start the server
const startServer = async () => {
    try {
        await initializeApp();
        app.listen(PORT, () => {
            console.log(`✅ Server is running on port ${PORT}`);
        });

        // Schedule periodic subscription expiry check (every hour)
        const { SubscriptionService } = require('./models/brandModel');
        
        // Run immediately on startup
        console.log('🔍 Running initial subscription expiry check...');
        await SubscriptionService.checkAndExpireSubscriptions();
        
        // Then run every hour
        setInterval(async () => {
            console.log('🔍 Running scheduled subscription expiry check...');
            await SubscriptionService.checkAndExpireSubscriptions();
        }, 60 * 60 * 1000); // 1 hour in milliseconds
        
        console.log('✅ Subscription expiry checker scheduled (runs every hour)');
    } catch (err) {
        console.error('❌ Error starting server:', err);
        process.exit(1);
    }
};

startServer();

module.exports = app;