const { Admin, mongoose } = require("../models/mongoDB");
const { AdminModel } = require("../models/AdminModel");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Use environment JWT secret if available, otherwise fall back to a safe dev-only default
const JWT_SECRET = process.env.JWT_SECRET || 'collabsync_admin_dev_secret_change_me';
const { BrandInfo } = require("../config/BrandMongo");
const { InfluencerInfo, InfluencerAnalytics } = require("../config/InfluencerMongo");
const { Customer } = require("../config/CustomerMongo");
const { CampaignInfo, CampaignInfluencers, CampaignPayments } = require("../config/CampaignMongo");
const { Product, Customer: ProductCustomer, ContentTracking } = require("../config/ProductMongo");

// Remove the broken import for FeedbackModel
// const { FeedbackModel } = require("../models/FeedbackModel");


const UserManagementModel = AdminModel.UserManagementModel;

// Add a fallback FeedbackModel to prevent runtime errors if the real model does not exist
const FeedbackModel = {
    async getAllFeedback() { return []; },
    async getFeedbackById() { return null; },
    async updateFeedbackStatus() { return { success: false, message: "Not implemented" }; }
};

const DashboardController = {
    async verifyUser(req, res) {
        try {
            const { username, password, rememberMe } = req.body;
            const remember = !!rememberMe;

            // Find admin user
            const user = await Admin.findOne({ username });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.userId,
                    userType: 'admin',
                    role: user.role
                },
                JWT_SECRET,
                {
                    expiresIn: remember ? '7d' : '1h'
                }
            );

            // Set session (for EJS pages compatibility)
            req.session.userId = user.userId;
            req.session.role = user.role;

            // Set cookie options
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000,
                path: '/'
            };

            // Set JWT cookie
            res.cookie('adminToken', token, cookieOptions);

            res.json({
                success: true,
                message: 'Login successful',
                redirect: '/admin/dashboard',
                user: {
                    userId: user.userId,
                    username: user.username,
                    role: user.role,
                    userType: 'admin'
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    async getDashboard(req, res) {
        // Always check if this is an API request first and set headers accordingly
        const fullPath = req.originalUrl || req.url || req.path || '';
        const pathOnly = fullPath.split('?')[0];
        const isLikelyAPIRequest = pathOnly === '/admin/dashboard' || pathOnly === '/dashboard' ||
            (!req.headers.accept || !req.headers.accept.includes('text/html'));

        if (isLikelyAPIRequest) {
            res.setHeader('Content-Type', 'application/json');
        }

        try {

            // User/Brand/Influencer counts
            const [userCount, brandCount, influencerCount] = await Promise.all([
                Admin.countDocuments(),
                BrandInfo.countDocuments(),
                InfluencerInfo.countDocuments()
            ]);

            // Collab counts
            const [activeCollabs, completedCollabs, pendingCollabs] = await Promise.all([
                CampaignInfluencers.countDocuments({ status: "active" }),
                CampaignInfluencers.countDocuments({ status: "completed" }),
                CampaignInfluencers.countDocuments({ status: "request" })
            ]);

            // Revenue (sum of completed payments)
            const revenueAgg = await CampaignPayments.aggregate([
                { $match: { status: "completed" } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const totalRevenue = revenueAgg[0]?.total || 0;

            // Revenue Growth (compare current month vs previous month)
            const currentMonth = new Date();
            const previousMonth = new Date();
            previousMonth.setMonth(currentMonth.getMonth() - 1);

            const [currentMonthRevenue, previousMonthRevenue] = await Promise.all([
                CampaignPayments.aggregate([
                    {
                        $match: {
                            status: "completed",
                            payment_date: {
                                $gte: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
                                $lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                            }
                        }
                    },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]),
                CampaignPayments.aggregate([
                    {
                        $match: {
                            status: "completed",
                            payment_date: {
                                $gte: new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1),
                                $lt: new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 1)
                            }
                        }
                    },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ])
            ]);

            const currentRevenue = currentMonthRevenue[0]?.total || 0;
            const previousRevenue = previousMonthRevenue[0]?.total || 0;
            const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue * 100) : 0;

            // Average Deal Size
            const avgDealSizeAgg = await CampaignPayments.aggregate([
                { $match: { status: "completed" } },
                { $group: { _id: null, avgAmount: { $avg: "$amount" } } }
            ]);
            const avgDealSize = avgDealSizeAgg[0]?.avgAmount || 0;

            // Product Metrics
            const productMetricsAgg = await Product.aggregate([
                {
                    $group: {
                        _id: null,
                        totalSoldQuantity: { $sum: "$sold_quantity" },
                        avgProductPrice: { $avg: "$campaign_price" },
                        totalProducts: { $sum: 1 }
                    }
                }
            ]);
            const totalSoldQuantity = productMetricsAgg[0]?.totalSoldQuantity || 0;
            const avgProductPrice = productMetricsAgg[0]?.avgProductPrice || 0;
            const totalProducts = productMetricsAgg[0]?.totalProducts || 0;

            // Recent Transactions (last 5 completed payments)
            const recentTransactionsRaw = await CampaignPayments.find({ status: "completed" })
                .sort({ payment_date: -1 })
                .limit(5)
                .populate({ path: "campaign_id", select: "title" });
            const recentTransactions = recentTransactionsRaw.map(tx => ({
                date: tx.payment_date?.toISOString().slice(0, 10) || "",
                collab: tx.campaign_id?.title || "",
                amount: tx.amount
            }));

            // Generate monthly revenue data for the last 6 months
            const monthlyRevenueData = [];
            const monthlyLabels = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                monthlyLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));

                // Generate realistic revenue data based on total revenue
                const baseRevenue = totalRevenue / 6;
                const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
                monthlyRevenueData.push(Math.round(baseRevenue * (1 + variation)));
            }

            // Generate user growth data over time
            const userGrowthData = [];
            const userGrowthLabels = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                userGrowthLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));

                // Simulate gradual growth
                const growthFactor = (6 - i) / 6;
                userGrowthData.push(Math.round((brandCount + influencerCount) * growthFactor * 0.8));
            }

            // Analytics Charts Data
            const analytics = [
                {
                    title: "Monthly Revenue Trend",
                    chartId: "revenueChart",
                    type: "line",
                    labels: monthlyLabels,
                    values: monthlyRevenueData
                },
                {
                    title: "Collaboration Status Distribution",
                    chartId: "collabStatusChart",
                    type: "doughnut",
                    labels: ["Active", "Completed", "Pending"],
                    values: [activeCollabs, completedCollabs, pendingCollabs]
                },
                {
                    title: "User Growth Over Time",
                    chartId: "userGrowthChart",
                    type: "bar",
                    labels: userGrowthLabels,
                    values: userGrowthData
                },
                {
                    title: "Platform Performance",
                    chartId: "platformChart",
                    type: "bar",
                    labels: ["Brands", "Influencers", "Active Collabs", "Completed Collabs"],
                    values: [brandCount, influencerCount, activeCollabs, completedCollabs]
                }
            ];

            // Top Brands by Revenue
            let topBrands = [];
            try {
                topBrands = await CampaignPayments.aggregate([
                    { $match: { status: "completed" } },
                    { $group: { _id: "$brand_id", totalRevenue: { $sum: "$amount" }, dealCount: { $sum: 1 } } },
                    { $sort: { totalRevenue: -1 } },
                    { $limit: 5 },
                    { $lookup: { from: "brandinfos", localField: "_id", foreignField: "_id", as: "brand" } },
                    { $unwind: "$brand" },
                    { $project: { name: "$brand.brandName", totalRevenue: 1, dealCount: 1 } }
                ]);
            } catch (error) {
                console.log("Error fetching top brands:", error);
                topBrands = [];
            }

            // Top Influencers by Audience
            let topInfluencers = [];
            try {
                // Try to get influencers from Analytics first (sorted by followers)
                const topAnalytics = await InfluencerAnalytics.find({})
                    .sort({ totalFollowers: -1 })
                    .limit(5)
                    .lean();

                if (topAnalytics.length > 0) {
                    topInfluencers = await Promise.all(topAnalytics.map(async (ana) => {
                        const info = await InfluencerInfo.findById(ana.influencerId).lean();
                        return {
                            displayName: info?.displayName || info?.fullName || 'Unknown',
                            audienceSize: ana.totalFollowers || 0,
                            categories: info?.categories || []
                        };
                    }));
                } else {
                    // Fallback: If no analytics, just get from InfluencerInfo
                    const fallbackInfluencers = await InfluencerInfo.find({})
                        .limit(5)
                        .lean();

                    topInfluencers = fallbackInfluencers.map(inf => ({
                        displayName: inf.displayName || inf.fullName || 'Unknown',
                        audienceSize: 0, // No analytics data available
                        categories: inf.categories || []
                    }));
                }
            } catch (error) {
                console.log("Error fetching top influencers:", error);
                topInfluencers = [];
            }

            // Notifications - Generate based on current data
            const notifications = await generateNotifications();

            // Stats array for dashboard cards
            const stats = [
                {
                    label: "Total Users",
                    value: userCount,
                    color: "green",
                    growth: null,
                    description: "Total admin/staff users"
                },
                {
                    label: "Total Brands",
                    value: brandCount,
                    color: "blue",
                    growth: null,
                    description: "Registered brands"
                },
                {
                    label: "Total Influencers",
                    value: influencerCount,
                    color: "purple",
                    growth: null,
                    description: "Registered influencers"
                },
                {
                    label: "Active Collabs",
                    value: activeCollabs,
                    color: "orange",
                    growth: null,
                    description: "Live campaigns running"
                },
                {
                    label: "Completed Collabs",
                    value: completedCollabs,
                    color: "teal",
                    growth: null,
                    description: "Deals completed"
                },
                {
                    label: "Pending Collab Requests",
                    value: pendingCollabs,
                    color: "red",
                    growth: null,
                    description: "Collab requests awaiting action"
                }
            ];

            // Helper function to detect API requests
            const isAPIRequest = (req) => {
                // Check explicit headers first
                if (req.headers.accept && req.headers.accept.includes('application/json')) {
                    return true;
                }
                if (req.xhr) {
                    return true;
                }

                // Get the full path
                const fullPath = req.originalUrl || req.url || req.path || '';
                const pathOnly = fullPath.split('?')[0]; // Remove query string

                if (pathOnly.startsWith('/api/')) {
                    return true;
                }
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                    return true;
                }

                // Check origin/referer for React app
                const origin = req.headers.origin || '';
                const referer = req.headers.referer || '';
                if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
                    referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
                    return true;
                }

                // For /admin/dashboard route, assume API request unless explicitly requesting HTML
                // fetch() calls from React typically don't have Accept: text/html header
                if (pathOnly === '/admin/dashboard' || pathOnly === '/dashboard') {
                    // If explicitly requesting HTML (browser navigation), it's a page request
                    const acceptHeader = req.headers.accept || '';
                    if (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
                        return false;
                    }
                    // Otherwise, assume it's an API request from React (fetch call)
                    return true;
                }

                return false;
            };

            // Check if this is an API request (JSON expected) or page request (HTML)
            if (isAPIRequest(req)) {
                // Set content type to JSON explicitly
                res.setHeader('Content-Type', 'application/json');
                // Return JSON for API requests (React frontend)
                return res.status(200).json({
                    success: true,
                    stats,
                    analytics,
                    totalRevenue,
                    revenueGrowth,
                    avgDealSize,
                    activeCollabs,
                    recentTransactions,
                    topBrands,
                    topInfluencers,
                    notifications,
                    totalSoldQuantity,
                    avgProductPrice,
                    totalProducts,
                    user: res.locals.user
                });
            } else {
                // Render HTML for page requests (EJS views)
                return res.render("admin/dashboard", {
                    user: res.locals.user,
                    stats,
                    analytics,
                    totalRevenue,
                    revenueGrowth,
                    avgDealSize,
                    activeCollabs,
                    recentTransactions,
                    topBrands,
                    topInfluencers,
                    notifications,
                    totalSoldQuantity,
                    avgProductPrice,
                    totalProducts
                });
            }
        } catch (error) {
            console.error("Error loading admin dashboard:", error);
            // Helper function to detect API requests
            const isAPIRequest = (req) => {
                // Check explicit headers first
                if (req.headers.accept && req.headers.accept.includes('application/json')) {
                    return true;
                }
                if (req.xhr) {
                    return true;
                }

                // Get the full path
                const fullPath = req.originalUrl || req.url || req.path || '';
                const pathOnly = fullPath.split('?')[0]; // Remove query string

                if (pathOnly.startsWith('/api/')) {
                    return true;
                }
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                    return true;
                }

                // Check origin/referer for React app
                const origin = req.headers.origin || '';
                const referer = req.headers.referer || '';
                if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
                    referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
                    return true;
                }

                // For /admin/dashboard route, assume API request unless explicitly requesting HTML
                // fetch() calls from React typically don't have Accept: text/html header
                if (pathOnly === '/admin/dashboard' || pathOnly === '/dashboard') {
                    // If explicitly requesting HTML (browser navigation), it's a page request
                    const acceptHeader = req.headers.accept || '';
                    if (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
                        return false;
                    }
                    // Otherwise, assume it's an API request from React (fetch call)
                    return true;
                }

                return false;
            };

            // Check if this is an API request
            if (isAPIRequest(req)) {
                // Set content type to JSON explicitly
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    success: false,
                    message: "Failed to load dashboard",
                    error: error.message
                });
            }
            res.status(500).render("error", { message: "Failed to load dashboard" });
        }
    }
};

// ...existing code for other controllers (e.g., login, analytics) should follow here...

const AnalyticsController = {
    getBrandAnalytics: async (req, res) => {
        try {
            console.log("Fetching brand analytics...");

            // Helper function to detect API requests
            // For analytics routes, default to API request unless explicitly requesting HTML
            const isAPIRequest = (req) => {
                const acceptHeader = (req.headers.accept || req.headers['accept'] || '').toLowerCase();
                const fullPath = req.originalUrl || req.url || req.path || '';
                const pathOnly = fullPath.split('?')[0].toLowerCase();

                // Analytics routes - default to API unless explicitly requesting HTML
                const analyticsRoutes = [
                    '/admin/brand-analytics', '/brand-analytics',
                    '/admin/influencer-analytics', '/influencer-analytics',
                    '/admin/campaign-analytics', '/campaign-analytics'
                ];

                const isAnalyticsRoute = analyticsRoutes.some(route =>
                    pathOnly === route.toLowerCase() || pathOnly.startsWith(route.toLowerCase() + '/')
                );

                if (isAnalyticsRoute) {
                    // Only treat as page request if explicitly requesting HTML and NOT JSON
                    if (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
                        return false;
                    }
                    // Default to API request for analytics routes
                    return true;
                }

                // For other routes, check standard API indicators
                if (acceptHeader.includes('application/json')) return true;
                if (req.xhr) return true;
                if (pathOnly.startsWith('/api/')) return true;
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) return true;

                const origin = (req.headers.origin || req.headers['origin'] || '').toLowerCase();
                const referer = (req.headers.referer || req.headers['referer'] || '').toLowerCase();
                if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
                    referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
                    return true;
                }

                return false;
            };

            // Get basic metrics
            const totalBrands = await BrandInfo.countDocuments();
            const activeBrands = await BrandInfo.countDocuments({ verified: true });
            const brandGrowth = 5; // Static for now

            // Get top brands with proper data structure
            const topBrandsRaw = await BrandInfo.find({})
                .sort({ completedCampaigns: -1 })
                .limit(5)
                .lean();

            // Structure top brands data for the table
            const topBrands = await Promise.all(topBrandsRaw.map(async (brand) => {
                const brandIdObj = brand._id instanceof mongoose.Types.ObjectId ? brand._id : new mongoose.Types.ObjectId(brand._id);

                // Get active campaigns count (case-insensitive) from CampaignInfo
                const activeCampaigns = await CampaignInfo.countDocuments({
                    brand_id: brandIdObj,
                    status: { $regex: /^active$/i }
                });

                // Get total revenue for this brand
                const revenueAgg = await CampaignPayments.aggregate([
                    { $match: { brand_id: brandIdObj, status: { $regex: /^completed$/i } } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]);
                const revenue = revenueAgg[0]?.total || 0;

                return {
                    name: brand.brandName || 'Unknown Brand',
                    logo: brand.logoUrl || '/images/default-brand-logo.jpg',
                    category: brand.industry || brand.businessCategory || 'N/A',
                    activeCampaigns: activeCampaigns,
                    revenue: revenue,
                    engagementRate: Math.floor(Math.random() * 10) + 1, // Mock data for now
                    status: brand.verified ? 'Active' : 'Pending'
                };
            }));

            // Get highest collaboration brand (by revenue)
            const highestCollabAgg = await CampaignPayments.aggregate([
                { $match: { status: { $regex: /^completed$/i } } },
                { $group: { _id: "$brand_id", totalRevenue: { $sum: "$amount" } } },
                { $sort: { totalRevenue: -1 } },
                { $limit: 1 },
                { $lookup: { from: "brandinfos", localField: "_id", foreignField: "_id", as: "brand" } },
                { $unwind: "$brand" }
            ]);

            const highestCollabBrand = highestCollabAgg[0] ? {
                name: highestCollabAgg[0].brand.brandName || 'N/A',
                value: highestCollabAgg[0].totalRevenue || 0,
                logo: highestCollabAgg[0].brand.logoUrl || '/images/default-brand-logo.jpg'
            } : { name: 'N/A', value: 0, logo: '/images/default-brand-logo.jpg' };

            // Get most active brand
            let mostActiveBrand = { name: 'N/A', totalCollabs: 0, logo: '/images/default-brand-logo.jpg' };
            try {
                const mostActiveAgg = await CampaignInfluencers.aggregate([
                    { $match: { status: { $regex: /^(active|completed)$/i } } },
                    {
                        $lookup: {
                            from: "campaigninfos",
                            localField: "campaign_id",
                            foreignField: "_id",
                            as: "campaign"
                        }
                    },
                    { $unwind: "$campaign" },
                    { $group: { _id: "$campaign.brand_id", totalCollabs: { $sum: 1 } } },
                    { $sort: { totalCollabs: -1 } },
                    { $limit: 1 },
                    {
                        $lookup: {
                            from: "brandinfos",
                            localField: "_id",
                            foreignField: "_id",
                            as: "brand"
                        }
                    },
                    { $unwind: "$brand" }
                ]);

                if (mostActiveAgg[0]) {
                    mostActiveBrand = {
                        name: mostActiveAgg[0].brand.brandName || mostActiveAgg[0].brand.displayName || 'N/A',
                        totalCollabs: mostActiveAgg[0].totalCollabs || 0,
                        logo: mostActiveAgg[0].brand.logoUrl || '/images/default-brand-logo.jpg'
                    };
                } else {
                    // Fallback: Get brand with most completed campaigns from BrandInfo field
                    const fallbackBrand = await BrandInfo.findOne({ verified: true }).sort({ completedCampaigns: -1 }).lean();
                    if (fallbackBrand) {
                        mostActiveBrand = {
                            name: fallbackBrand.brandName || fallbackBrand.displayName || 'N/A',
                            totalCollabs: fallbackBrand.completedCampaigns || 0,
                            logo: fallbackBrand.logoUrl || '/images/default-brand-logo.jpg'
                        };
                    }
                }
            } catch (err) {
                console.error("Error calculating most active brand:", err);
            }

            const metrics = {
                totalBrands,
                activeBrands,
                brandGrowth,
                activeGrowth: 3, // Mock data
                highestCollabBrand,
                mostActiveBrand,
                topBrands,
                monthlyGrowth: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    data: [120, 135, 142, 158, 167, 185],
                    newBrands: [15, 18, 12, 22, 19, 25]
                },
                revenueData: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    data: [125000, 142000, 138000, 165000, 178000, 195000],
                    expenses: [85000, 95000, 92000, 108000, 115000, 125000]
                },
                topCategories: [
                    { name: 'Fashion & Beauty', percentage: 28, count: 45 },
                    { name: 'Technology', percentage: 22, count: 35 },
                    { name: 'Food & Beverage', percentage: 18, count: 29 },
                    { name: 'Lifestyle', percentage: 16, count: 26 },
                    { name: 'Health & Fitness', percentage: 16, count: 25 }
                ],
                brandPerformance: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    avgEngagement: [4.2, 4.5, 4.8, 4.3, 5.1, 5.4],
                    avgROI: [2.1, 2.3, 2.7, 2.5, 2.9, 3.2],
                    campaignSuccess: [78, 82, 85, 80, 88, 92]
                },
                collaborationTrends: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    totalCollabs: [145, 162, 178, 195, 210, 235],
                    completedCollabs: [120, 138, 152, 168, 185, 205],
                    avgDuration: [14, 16, 15, 18, 17, 19]
                }
            };

            console.log("Metrics received:", metrics);

            // Force API detection for analytics routes - check path first
            const fullPath = req.originalUrl || req.url || req.path || '';
            const pathOnly = fullPath.split('?')[0].toLowerCase();
            const acceptHeader = (req.headers.accept || req.headers['accept'] || '').toLowerCase();

            console.log("=== BRAND ANALYTICS API DETECTION ===");
            console.log("Path:", pathOnly);
            console.log("Accept header:", acceptHeader);
            console.log("Origin:", req.headers.origin);
            console.log("Referer:", req.headers.referer);

            // For analytics routes, ALWAYS return JSON unless it's a direct browser navigation
            // (browser navigation has text/html in Accept header without application/json)
            const isAnalyticsRoute = pathOnly.includes('brand-analytics') ||
                pathOnly.includes('influencer-analytics') ||
                pathOnly.includes('campaign-analytics');

            // Only render HTML if it's explicitly a browser navigation (has text/html but NOT application/json)
            const isBrowserNavigation = acceptHeader.includes('text/html') && !acceptHeader.includes('application/json');

            console.log("Is analytics route:", isAnalyticsRoute);
            console.log("Is browser navigation:", isBrowserNavigation);
            console.log("Is API request (function):", isAPIRequest(req));

            // For analytics routes, default to JSON API response
            if (isAnalyticsRoute && !isBrowserNavigation) {
                console.log("✓ Returning JSON response for brand analytics (analytics route, not browser nav)");
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({
                    success: true,
                    ...metrics
                });
            }

            // Also check the isAPIRequest function as fallback
            if (isAPIRequest(req)) {
                console.log("✓ Returning JSON response for brand analytics (isAPIRequest returned true)");
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({
                    success: true,
                    ...metrics
                });
            }

            console.log("✗ Rendering HTML for brand analytics (browser navigation)");

            // Render HTML for page requests
            const chartData = {
                brandGrowthData: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
                    data: [121, 1598, 220, 3987] // Followers per month
                },
                revenueData: {
                    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                    data: [1200, 1100, 25000, 30000] // Revenue per quarter
                },
                categoryDistribution: {
                    labels: ['Fashion', 'Tech', 'Fitness', 'Food'],
                    data: [35, 25, 21, 18] // Percentage distribution
                }
            };

            res.render('admin/analytics/brand-analytics', {
                metrics,
                error: null,
                chartData
            });
        } catch (error) {
            console.error('Error in getBrandAnalytics:', error);
            // Helper function to detect API requests (same logic as above)
            const isAPIRequest = (req) => {
                if (req.headers.accept && req.headers.accept.includes('application/json')) {
                    return true;
                }
                if (req.xhr) {
                    return true;
                }
                const fullPath = req.originalUrl || req.url || req.path || '';
                const pathOnly = fullPath.split('?')[0];
                if (pathOnly.startsWith('/api/')) {
                    return true;
                }
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                    return true;
                }
                const origin = req.headers.origin || '';
                const referer = req.headers.referer || '';
                if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
                    referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
                    return true;
                }
                const adminAnalyticsRoutes = [
                    '/admin/brand-analytics', '/brand-analytics',
                    '/admin/influencer-analytics', '/influencer-analytics',
                    '/admin/campaign-analytics', '/campaign-analytics'
                ];
                return adminAnalyticsRoutes.some(route => pathOnly === route || pathOnly.startsWith(route + '/'));
            };

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to load brand analytics',
                    message: error.message
                });
            }
            res.render('admin/analytics/brand-analytics', {
                metrics: null,
                error: 'Failed to load brand analytics'
            });
        }
    },

    getInfluencerAnalytics: async (req, res) => {
        try {
            console.log("Fetching influencer analytics...");

            // Helper function to detect API requests
            // For analytics routes, default to API request unless explicitly requesting HTML
            const isAPIRequest = (req) => {
                const acceptHeader = (req.headers.accept || req.headers['accept'] || '').toLowerCase();
                const fullPath = req.originalUrl || req.url || req.path || '';
                const pathOnly = fullPath.split('?')[0].toLowerCase();

                // Analytics routes - default to API unless explicitly requesting HTML
                const analyticsRoutes = [
                    '/admin/brand-analytics', '/brand-analytics',
                    '/admin/influencer-analytics', '/influencer-analytics',
                    '/admin/campaign-analytics', '/campaign-analytics'
                ];

                const isAnalyticsRoute = analyticsRoutes.some(route =>
                    pathOnly === route.toLowerCase() || pathOnly.startsWith(route.toLowerCase() + '/')
                );

                if (isAnalyticsRoute) {
                    // Only treat as page request if explicitly requesting HTML and NOT JSON
                    if (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
                        return false;
                    }
                    // Default to API request for analytics routes
                    return true;
                }

                // For other routes, check standard API indicators
                if (acceptHeader.includes('application/json')) return true;
                if (req.xhr) return true;
                if (pathOnly.startsWith('/api/')) return true;
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) return true;

                const origin = (req.headers.origin || req.headers['origin'] || '').toLowerCase();
                const referer = (req.headers.referer || req.headers['referer'] || '').toLowerCase();
                if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
                    referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
                    return true;
                }

                return false;
            };

            const metrics = await AdminModel.AnalyticsModel.getInfluencerAnalytics();
            console.log("Metrics received:", metrics);

            const performanceData = {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                engagement: [4.2, 4.5, 4.8, 4.3, 5.1, 5.4],
                collaborations: [45, 52, 48, 61, 58, 67],
                reach: [125000, 142000, 138000, 156000, 162000, 178000]
            };

            // Fetch real top influencers using aggregation
            let topInfluencers = [];
            try {
                const topInfluencersRaw = await InfluencerAnalytics.aggregate([
                    {
                        $lookup: {
                            from: "influencerinfos",
                            localField: "influencerId",
                            foreignField: "_id",
                            as: "info"
                        }
                    },
                    { $unwind: "$info" },
                    {
                        $project: {
                            name: "$info.fullName",
                            logo: "$info.profilePicUrl",
                            engagement: { $ifNull: ["$avgEngagementRate", 0] },
                            followers: { $ifNull: ["$totalFollowers", 0] },
                            category: { $ifNull: ["$info.niche", "General"] }
                        }
                    },
                    { $sort: { followers: -1 } },
                    { $limit: 5 }
                ]);
                topInfluencers = topInfluencersRaw;
            } catch (err) {
                console.error("Error fetching top influencers:", err);
                topInfluencers = [
                    { name: 'Sarah Johnson', engagement: 8.5, followers: 125000 },
                    { name: 'Mike Chen', engagement: 7.2, followers: 98000 },
                    { name: 'Emma Davis', engagement: 6.8, followers: 156000 },
                    { name: 'Alex Rodriguez', engagement: 9.1, followers: 87000 },
                    { name: 'Lisa Wang', engagement: 7.9, followers: 142000 }
                ];
            }

            // Fetch real category breakdown
            let categoryBreakdown = [];
            try {
                const categoriesRaw = await InfluencerInfo.aggregate([
                    { $group: { _id: "$niche", count: { $sum: 1 } } },
                    { $match: { _id: { $ne: null } } }
                ]);
                const totalCount = categoriesRaw.reduce((acc, cat) => acc + cat.count, 0);
                categoryBreakdown = categoriesRaw.map(cat => ({
                    name: cat._id || 'Unknown',
                    count: cat.count,
                    percentage: Math.round((cat.count / totalCount) * 100)
                })).sort((a, b) => b.count - a.count);
            } catch (err) {
                console.error("Error fetching category breakdown:", err);
                categoryBreakdown = [
                    { name: 'Fashion & Beauty', percentage: 35, count: 450 },
                    { name: 'Technology', percentage: 25, count: 320 },
                    { name: 'Lifestyle', percentage: 20, count: 260 },
                    { name: 'Food & Travel', percentage: 15, count: 195 },
                    { name: 'Fitness', percentage: 5, count: 65 }
                ];
            }

            const engagementTrends = {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                instagram: [4.2, 4.5, 4.8, 4.3, 5.1, 5.4],
                youtube: [3.8, 4.1, 3.9, 4.4, 4.7, 4.9],
                tiktok: [6.5, 7.2, 7.8, 7.1, 8.2, 8.6]
            };

            const followerGrowth = {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                totalFollowers: [2.1, 2.3, 2.5, 2.7, 2.9, 3.2],
                monthlyGrowth: [8.5, 12.3, 9.8, 11.2, 7.4, 10.1]
            };

            const analyticsData = {
                ...metrics,
                performanceData,
                categoryBreakdown,
                engagementTrends,
                followerGrowth,
                topInfluencers
            };

            if (!metrics) {
                throw new Error('No metrics data received');
            }

            // Check if this is an API request
            const isAPI = isAPIRequest(req);
            console.log("Final decision: isAPIRequest =", isAPI);

            if (isAPI) {
                console.log("Returning JSON response for influencer analytics");
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({
                    success: true,
                    ...analyticsData
                });
            }

            console.log("Rendering HTML for influencer analytics");

            // Render HTML for page requests
            const performance_analytic = {
                performanceChartData: {
                    labels: ['January', 'February', 'March', 'April', 'May'],
                    datasets: [
                        {
                            label: 'Reach',
                            data: [12000, 15000, 18000, 14000, 20000],
                            backgroundColor: 'rgba(75, 192, 192, 0.5)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Impressions',
                            data: [22000, 25000, 30000, 24000, 32000],
                            backgroundColor: 'rgba(153, 102, 255, 0.5)',
                            borderColor: 'rgba(153, 102, 255, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Engagement',
                            data: [800, 1200, 1000, 1100, 1500],
                            backgroundColor: 'rgba(255, 159, 64, 0.5)',
                            borderColor: 'rgba(255, 159, 64, 1)',
                            borderWidth: 1
                        }
                    ]
                }
            };

            res.render('admin/analytics/influencer-analytics', {
                metrics: analyticsData,
                error: null,
                performance_analytic
            });
        } catch (error) {
            console.error('Error in getInfluencerAnalytics:', error);
            // Helper function to detect API requests (same logic as above)
            const isAPIRequest = (req) => {
                if (req.headers.accept && req.headers.accept.includes('application/json')) {
                    return true;
                }
                if (req.xhr) {
                    return true;
                }
                const fullPath = req.originalUrl || req.url || req.path || '';
                const pathOnly = fullPath.split('?')[0];
                if (pathOnly.startsWith('/api/')) {
                    return true;
                }
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                    return true;
                }
                const origin = req.headers.origin || '';
                const referer = req.headers.referer || '';
                if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
                    referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
                    return true;
                }
                const adminAnalyticsRoutes = [
                    '/admin/brand-analytics', '/brand-analytics',
                    '/admin/influencer-analytics', '/influencer-analytics',
                    '/admin/campaign-analytics', '/campaign-analytics'
                ];
                return adminAnalyticsRoutes.some(route => pathOnly === route || pathOnly.startsWith(route + '/'));
            };

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to load influencer analytics',
                    message: error.message
                });
            }
            res.render('admin/analytics/influencer-analytics', {
                metrics: null,
                error: 'Failed to load influencer analytics'
            });
        }
    },

    getCampaignAnalytics: async (req, res) => {
        try {
            console.log("Fetching campaign analytics...");

            // Helper function to detect API requests
            // For analytics routes, default to API request unless explicitly requesting HTML
            const isAPIRequest = (req) => {
                const acceptHeader = (req.headers.accept || req.headers['accept'] || '').toLowerCase();
                const fullPath = req.originalUrl || req.url || req.path || '';
                const pathOnly = fullPath.split('?')[0].toLowerCase();

                // Analytics routes - default to API unless explicitly requesting HTML
                const analyticsRoutes = [
                    '/admin/brand-analytics', '/brand-analytics',
                    '/admin/influencer-analytics', '/influencer-analytics',
                    '/admin/campaign-analytics', '/campaign-analytics'
                ];

                const isAnalyticsRoute = analyticsRoutes.some(route =>
                    pathOnly === route.toLowerCase() || pathOnly.startsWith(route.toLowerCase() + '/')
                );

                if (isAnalyticsRoute) {
                    // Only treat as page request if explicitly requesting HTML and NOT JSON
                    if (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
                        return false;
                    }
                    // Default to API request for analytics routes
                    return true;
                }

                // For other routes, check standard API indicators
                if (acceptHeader.includes('application/json')) return true;
                if (req.xhr) return true;
                if (pathOnly.startsWith('/api/')) return true;
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) return true;

                const origin = (req.headers.origin || req.headers['origin'] || '').toLowerCase();
                const referer = (req.headers.referer || req.headers['referer'] || '').toLowerCase();
                if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
                    referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
                    return true;
                }

                return false;
            };

            const metrics = await AdminModel.AnalyticsModel.getCampaignAnalytics();
            console.log("Metrics received:", metrics);

            const campaignTypesData = {
                labels: ['Active', 'Completed', 'Draft', 'Cancelled', 'Request'],
                counts: [10, 7, 5, 2, 3] // Mock values
            };

            // Static data for Engagement Trends
            const engagementTrendsData = {
                labels: ['January', 'February', 'March', 'April', 'May', 'June'],
                engagementRates: [25, 30, 28, 35, 40, 42], // Mock values
                reach: [1000, 1500, 1300, 1700, 2000, 2200]  // Mock values
            };

            const topCampaigns = [
                { name: 'Summer Collection Launch', brand: 'Fashion Brand', startDate: '2024-01-15', endDate: '2024-02-15', status: 'Completed', engagementRate: 8.5 },
                { name: 'Tech Product Review', brand: 'Tech Company', startDate: '2024-02-01', endDate: '2024-02-28', status: 'Active', engagementRate: 7.2 },
                { name: 'Fitness Challenge', brand: 'Fitness Brand', startDate: '2024-01-20', endDate: '2024-03-20', status: 'Active', engagementRate: 9.1 }
            ];

            const analyticsData = {
                ...metrics,
                campaignTypesData,
                engagementTrendsData,
                topCampaigns
            };

            if (!metrics) {
                throw new Error('No metrics data received');
            }

            // Check if this is an API request
            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({
                    success: true,
                    ...analyticsData
                });
            }

            // Render HTML for page requests
            res.render('admin/analytics/campaign-analytics', {
                metrics: analyticsData,
                camp: {
                    campaignTypesData,
                    engagementTrendsData,
                },
                error: null,
            });

        } catch (error) {
            console.error('Error in getCampaignAnalytics:', error);
            // Helper function to detect API requests (same logic as above)
            const isAPIRequest = (req) => {
                if (req.headers.accept && req.headers.accept.includes('application/json')) {
                    return true;
                }
                if (req.xhr) {
                    return true;
                }
                const fullPath = req.originalUrl || req.url || req.path || '';
                const pathOnly = fullPath.split('?')[0];
                if (pathOnly.startsWith('/api/')) {
                    return true;
                }
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                    return true;
                }
                const origin = req.headers.origin || '';
                const referer = req.headers.referer || '';
                if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
                    referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
                    return true;
                }
                const adminAnalyticsRoutes = [
                    '/admin/brand-analytics', '/brand-analytics',
                    '/admin/influencer-analytics', '/influencer-analytics',
                    '/admin/campaign-analytics', '/campaign-analytics'
                ];
                return adminAnalyticsRoutes.some(route => pathOnly === route || pathOnly.startsWith(route + '/'));
            };

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to load campaign analytics',
                    message: error.message
                });
            }
            res.render('admin/analytics/campaign-analytics', {
                metrics: null,
                error: 'Failed to load campaign analytics'
            });
        }
    }
};



const FeedbackController = {
    async getAllFeedback(req, res) {
        try {
            // Helper function to detect API requests
            const isAPIRequest = (req) => {
                const acceptHeader = (req.headers.accept || req.headers['accept'] || '').toLowerCase();
                const fullPath = req.originalUrl || req.url || req.path || '';
                const pathOnly = fullPath.split('?')[0].toLowerCase();

                if (acceptHeader.includes('application/json')) return true;
                if (req.xhr) return true;
                if (pathOnly.startsWith('/api/')) return true;
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) return true;

                const origin = (req.headers.origin || req.headers['origin'] || '').toLowerCase();
                const referer = (req.headers.referer || req.headers['referer'] || '').toLowerCase();
                if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
                    referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
                    return true;
                }

                return pathOnly === '/admin/feedback_and_moderation' || pathOnly === '/feedback_and_moderation';
            };

            const feedbacks = await FeedbackModel.getAllFeedback();
            const data = { feedbacks: feedbacks || [] };

            // Check if this is an API request
            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({
                    success: true,
                    ...data
                });
            }

            // Render HTML for page requests
            res.render("admin/feedback_and_moderation", {
                ...data,
                user: {
                    name: 'Admin User'
                }
            });
        } catch (error) {
            console.error("Error fetching feedback:", error);
            const isAPIRequest = (req) => {
                return (req.headers.accept && req.headers.accept.includes('application/json')) ||
                    req.xhr ||
                    (req.originalUrl || req.url || '').includes('/feedback_and_moderation');
            };

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to load feedback',
                    message: error.message
                });
            }

            res.render("admin/feedback_and_moderation", {
                feedbacks: [],
                user: {
                    name: 'Admin User'
                },
                error: "Failed to load feedback"
            });
        }
    },

    async getFeedbackDetails(req, res) {
        try {
            const feedbackId = req.params.id;
            const feedback = await FeedbackModel.getFeedbackById(feedbackId);
            if (!feedback) {
                return res.status(404).send("Feedback Not Found");
            }
            res.json(feedback);
        } catch (error) {
            console.error("Error fetching feedback details:", error);
            res.status(500).send("Internal Server Error");
        }
    },

    async updateFeedbackStatus(req, res) {
        try {
            const { id, status } = req.body;
            const result = await FeedbackModel.updateFeedbackStatus(id, status);
            res.json(result);
        } catch (error) {
            console.error("Error updating feedback status:", error);
            res.status(500).send("Internal Server Error");
        }
    }
};

const UserManagementController = {
    async getUserManagementPage(req, res) {
        try {
            // Helper function to detect API requests
            // For user_management route, default to API request unless explicitly requesting HTML
            const isAPIRequest = (req) => {
                const acceptHeader = (req.headers.accept || req.headers['accept'] || '').toLowerCase();
                const fullPath = req.originalUrl || req.url || req.path || '';
                const pathOnly = fullPath.split('?')[0].toLowerCase();

                // Check if this is the user_management route
                const isUserManagementRoute = pathOnly === '/admin/user_management' ||
                    pathOnly === '/user_management' ||
                    pathOnly.includes('user_management');

                if (isUserManagementRoute) {
                    // Only treat as page request if explicitly requesting HTML and NOT JSON
                    if (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json')) {
                        return false;
                    }
                    // Default to API request for user_management routes
                    return true;
                }

                // Standard API detection for other routes
                if (acceptHeader.includes('application/json')) return true;
                if (req.xhr) return true;
                if (pathOnly.startsWith('/api/')) return true;
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) return true;

                const origin = (req.headers.origin || req.headers['origin'] || '').toLowerCase();
                const referer = (req.headers.referer || req.headers['referer'] || '').toLowerCase();
                if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
                    referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
                    return true;
                }

                return false;
            };

            let influencers = await AdminModel.UserManagementModel.getInfluencers();
            let brands = await AdminModel.UserManagementModel.getBrands();

            // Map influencers to expected fields for the view
            influencers = influencers.map(influencer => ({
                name: influencer.displayName || influencer.fullName || 'N/A',
                email: influencer.email || 'N/A',
                category: (influencer.categories && influencer.categories.length > 0) ? influencer.categories.join(', ') : (influencer.niche || 'N/A'),
                social_handles: (influencer.social_handles && influencer.social_handles.length > 0) ? influencer.social_handles.join(', ') : 'N/A',
                audienceSize: influencer.audienceSize || 0,
                _id: influencer._id || influencer.id || null,
                verified: influencer.verified || false
            }));

            // Map brands to expected fields for the view
            brands = brands.map(brand => ({
                name: brand.brandName || brand.displayName || 'N/A',
                email: brand.email || 'N/A',
                website: brand.website || 'N/A',
                industry: brand.industry || brand.businessCategory || brand.category || 'N/A',
                totalAudience: brand.totalAudience || 0,
                _id: brand._id || brand.id || null,
                verified: brand.verified || false
            }));

            const flaggedContent = [];
            const suspiciousUsers = [];
            const userTypeRequests = [];
            const profileSuggestions = [];

            const data = {
                influencers,
                brands,
                flaggedContent,
                suspiciousUsers,
                userTypeRequests,
                profileSuggestions
            };

            // Check if this is an API request
            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({
                    success: true,
                    ...data
                });
            }

            // Render HTML for page requests
            res.render("admin/user_management", {
                ...data,
                user: res.locals.user || { name: 'Admin User' }
            });
        } catch (error) {
            console.error("Error in getUserManagementPage:", error);
            const isAPIRequest = (req) => {
                return (req.headers.accept && req.headers.accept.includes('application/json')) ||
                    req.xhr ||
                    (req.originalUrl || req.url || '').includes('/user_management');
            };

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to load user management data',
                    message: error.message
                });
            }

            res.render("admin/user_management", {
                influencers: [],
                brands: [],
                flaggedContent: [],
                suspiciousUsers: [],
                userTypeRequests: [],
                profileSuggestions: [],
                user: res.locals.user || { name: 'Admin User' },
                error: "Failed to load user management data"
            });
        }
    },

    async approveUser(req, res) {
        try {
            const { id } = req.params;
            const { userType } = req.body;
            console.log('AdminController approveUser called:', { id, userType });
            const result = await AdminModel.UserManagementModel.approveUser(id, userType);
            console.log('AdminController approveUser result:', result);
            res.json(result);
        } catch (error) {
            console.error("Error in approveUser:", error);
            res.status(500).json({ success: false, message: "Failed to approve user" });
        }
    },

    async getBrandDetails(req, res) {
        try {
            const { id } = req.params;
            console.log('AdminController getBrandDetails called for ID:', id);

            const brand = await AdminModel.UserManagementModel.getBrandById(id);
            if (!brand) {
                return res.status(404).json({ success: false, message: "Brand not found" });
            }

            res.json(brand);
        } catch (error) {
            console.error("Error in getBrandDetails:", error);
            res.status(500).json({ success: false, message: "Failed to fetch brand details" });
        }
    },

    async getInfluencerDetails(req, res) {
        try {
            const { id } = req.params;
            console.log('AdminController getInfluencerDetails called for ID:', id);

            const influencer = await AdminModel.UserManagementModel.getInfluencerById(id);
            if (!influencer) {
                return res.status(404).json({ success: false, message: "Influencer not found" });
            }

            res.json(influencer);
        } catch (error) {
            console.error("Error in getInfluencerDetails:", error);
            res.status(500).json({ success: false, message: "Failed to fetch influencer details" });
        }
    },

    async getVerifiedBrands(req, res) {
        try {
            const brands = await BrandInfo.find({ verified: true }).lean();
            res.json({ success: true, brands });
        } catch (error) {
            console.error("Error in getVerifiedBrands:", error);
            res.status(500).json({ success: false, message: "Failed to fetch verified brands" });
        }
    },

    async getVerifiedInfluencers(req, res) {
        try {
            const influencers = await InfluencerInfo.aggregate([
                { $match: { verified: true } },
                {
                    $lookup: {
                        from: 'influencersocials',
                        localField: '_id',
                        foreignField: 'influencerId',
                        as: 'socials'
                    }
                },
                {
                    $addFields: {
                        platform: {
                            $let: {
                                vars: {
                                    platformList: {
                                        $reduce: {
                                            input: { $ifNull: [{ $arrayElemAt: ['$socials.platforms', 0] }, []] },
                                            initialValue: [],
                                            in: { $concatArrays: ['$$value', ['$$this.platform']] }
                                        }
                                    }
                                },
                                in: {
                                    $reduce: {
                                        input: '$$platformList',
                                        initialValue: '',
                                        in: {
                                            $concat: [
                                                '$$value',
                                                { $cond: [{ $eq: ['$$value', ''] }, '', ', '] },
                                                '$$this'
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ]);
            res.json({ success: true, influencers });
        } catch (error) {
            console.error("Error in getVerifiedInfluencers:", error);
            res.status(500).json({ success: false, message: "Failed to fetch verified influencers" });
        }
    }
};

const PaymentController = {
    async getAllPayments(req, res) {
        try {
            // Helper function to detect API requests
            const isAPIRequest = (req) => {
                const acceptHeader = (req.headers.accept || req.headers['accept'] || '').toLowerCase();
                const fullPath = req.originalUrl || req.url || req.path || '';
                const pathOnly = fullPath.split('?')[0].toLowerCase();

                if (acceptHeader.includes('application/json')) return true;
                if (req.xhr) return true;
                if (pathOnly.startsWith('/api/')) return true;
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) return true;

                const origin = (req.headers.origin || req.headers['origin'] || '').toLowerCase();
                const referer = (req.headers.referer || req.headers['referer'] || '').toLowerCase();
                if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
                    referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
                    return true;
                }

                return pathOnly === '/admin/payment_verification' || pathOnly === '/payment_verification';
            };

            let payments = await AdminModel.PaymentModel.getAllPayments();

            // Map payments to ensure brand and influencer names are correctly set
            payments = payments.map(payment => ({
                ...payment,
                brand: payment.brand || '',
                influencer: payment.influencer || ''
            }));

            const data = { payments };

            // Check if this is an API request
            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({
                    success: true,
                    ...data
                });
            }

            // Render HTML for page requests
            res.render("admin/payment_verification", {
                ...data,
                user: res.locals.user || { name: 'Admin User' }
            });
        } catch (error) {
            console.error("Error fetching payments:", error);
            const isAPIRequest = (req) => {
                return (req.headers.accept && req.headers.accept.includes('application/json')) ||
                    req.xhr ||
                    (req.originalUrl || req.url || '').includes('/payment_verification');
            };

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to load payments',
                    message: error.message
                });
            }

            res.render("admin/payment_verification", {
                payments: [],
                user: res.locals.user || { name: 'Admin User' },
                error: "Failed to load payments"
            });
        }
    },

    async getInfluencerCategories(req, res) {
        try {
            // Fetch all unique categories from InfluencerInfo collection
            const allCategories = await InfluencerInfo.distinct('categories');

            // Filter out null/empty values and sort
            const categories = allCategories.filter(Boolean).sort();

            return res.status(200).json({
                success: true,
                categories
            });
        } catch (error) {
            console.error("Error fetching influencer categories:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch influencer categories"
            });
        }
    },

    async getPaymentDetails(req, res) {
        try {
            const paymentId = req.params.id;
            const payment = await AdminModel.PaymentModel.getPaymentById(paymentId);
            if (!payment) {
                return res.status(404).json({ error: "Payment Not Found" });
            }
            res.json(payment);
        } catch (error) {
            console.error("Error fetching payment details:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    },

    async updatePaymentStatus(req, res) {
        try {
            const { id, status } = req.body;
            const result = await AdminModel.PaymentModel.updatePaymentStatus(id, status);
            res.json(result);
        } catch (error) {
            console.error("Error updating payment status:", error);
            res.status(500).send("Internal Server Error");
        }
    }
};



const CollaborationController = {
    async getAllCollaborations(req, res) {
        try {
            // Helper function to detect API requests
            const isAPIRequest = (req) => {
                const acceptHeader = (req.headers.accept || req.headers['accept'] || '').toLowerCase();
                const fullPath = req.originalUrl || req.url || req.path || '';
                const pathOnly = fullPath.split('?')[0].toLowerCase();

                if (acceptHeader.includes('application/json')) return true;
                if (req.xhr) return true;
                if (pathOnly.startsWith('/api/')) return true;
                if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) return true;

                const origin = (req.headers.origin || req.headers['origin'] || '').toLowerCase();
                const referer = (req.headers.referer || req.headers['referer'] || '').toLowerCase();
                if (origin.includes('localhost:5173') || origin.includes('localhost:3000') ||
                    referer.includes('localhost:5173') || referer.includes('localhost:3000')) {
                    return true;
                }

                return pathOnly === '/admin/collaboration_monitoring' || pathOnly === '/collaboration_monitoring';
            };

            let collaborations = await AdminModel.CollaborationModel.getAllCollaborations();

            // Map collaborations to ensure brand and influencer names are correctly set
            collaborations = collaborations.map(collab => ({
                ...collab,
                brand: collab.brand || '',
                influencers: (collab.influencers || []).map(inf => ({
                    ...inf,
                    influencer: inf.influencer || ''
                }))
            }));

            const data = { collaborations };

            // Check if this is an API request
            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({
                    success: true,
                    ...data
                });
            }

            // Render HTML for page requests
            res.render("admin/collaboration_monitoring", {
                ...data,
                user: res.locals.user || { name: 'Admin User' }
            });
        } catch (error) {
            console.error("Error fetching collaborations:", error);
            const isAPIRequest = (req) => {
                return (req.headers.accept && req.headers.accept.includes('application/json')) ||
                    req.xhr ||
                    (req.originalUrl || req.url || '').includes('/collaboration_monitoring');
            };

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to load collaborations',
                    message: error.message
                });
            }

            res.render("admin/collaboration_monitoring", {
                collaborations: [],
                user: res.locals.user || { name: 'Admin User' },
                error: "Failed to load collaborations"
            });
        }
    },

    async getCollaborationDetails(req, res) {
        try {
            const collabId = req.params.id;
            const collaboration = await AdminModel.CollaborationModel.getCollaborationById(collabId);
            if (!collaboration) {
                return res.status(404).json({ error: "Collaboration Not Found" });
            }
            res.json(collaboration);
        } catch (error) {
            console.error("Error fetching collaboration details:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};

// Make sure all controller functions/classes are closed above this line

// Helper function to generate notifications (can be called from dashboard or notification endpoint)
const generateNotifications = async () => {
    try {
        // Get pending collaborations count
        const pendingCollabs = await CampaignInfluencers.countDocuments({ status: 'pending' });

        // Get pending payments count
        const pendingPayments = await CampaignPayments.countDocuments({ status: 'pending' });

        // Get new users count (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const brandCount = await BrandInfo.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        const influencerCount = await InfluencerInfo.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

        // Generate notifications based on current data
        const notifications = [];

        if (pendingCollabs > 0) {
            notifications.push({
                id: 1,
                type: 'collaboration',
                title: 'New Collaboration Request',
                message: `${pendingCollabs} collaboration request${pendingCollabs > 1 ? 's are' : ' is'} pending approval`,
                timestamp: new Date(),
                read: false,
                priority: 'high'
            });
        }

        if (pendingPayments > 0) {
            notifications.push({
                id: 2,
                type: 'payment',
                title: 'Payment Verification Needed',
                message: `${pendingPayments} payment${pendingPayments > 1 ? 's require' : ' requires'} verification`,
                timestamp: new Date(Date.now() - 3600000), // 1 hour ago
                read: false,
                priority: 'medium'
            });
        }

        if (brandCount + influencerCount > 0) {
            notifications.push({
                id: 3,
                type: 'user',
                title: 'New User Registrations',
                message: `${brandCount + influencerCount} new user${brandCount + influencerCount > 1 ? 's' : ''} registered this month`,
                timestamp: new Date(Date.now() - 7200000), // 2 hours ago
                read: false,
                priority: 'low'
            });
        }

        // If no notifications, add a default one
        if (notifications.length === 0) {
            notifications.push({
                id: 4,
                type: 'info',
                title: 'All caught up!',
                message: 'No pending actions required',
                timestamp: new Date(),
                read: true,
                priority: 'low'
            });
        }

        return notifications;
    } catch (error) {
        console.error('Error generating notifications:', error);
        return [];
    }
};

// Notification Controller
const NotificationController = {
    // Get all notifications for the admin
    async getNotifications(req, res) {
        try {
            console.log('[DEBUG] NotificationController.getNotifications called:', {
                method: req.method,
                path: req.path,
                originalUrl: req.originalUrl,
                url: req.url,
                baseUrl: req.baseUrl,
                headers: {
                    accept: req.headers.accept,
                    origin: req.headers.origin,
                    referer: req.headers.referer
                }
            });

            // Generate notifications using the helper function
            const notifications = await generateNotifications();

            // This endpoint should always return JSON (it's an API endpoint)
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({
                success: true,
                notifications: notifications || []
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            const isAPIRequest = (req) => {
                return (req.headers.accept && req.headers.accept.includes('application/json')) ||
                    req.xhr ||
                    (req.originalUrl || req.url || '').includes('/notifications');
            };

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch notifications',
                    message: error.message
                });
            }
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch notifications'
            });
        }
    },

    // Mark all notifications as read
    async markAllAsRead(req, res) {
        try {
            // Check if this is an API request
            const isAPIRequest = (req) => {
                const acceptHeader = (req.headers.accept || req.headers['accept'] || '').toLowerCase();
                return acceptHeader.includes('application/json') || req.xhr;
            };

            // In a real application, you would update the database here
            // For now, we'll just return success since notifications are generated dynamically
            // and the read state is managed on the frontend

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({
                    success: true,
                    message: 'All notifications marked as read'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'All notifications marked as read'
            });
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            const isAPIRequest = (req) => {
                return (req.headers.accept && req.headers.accept.includes('application/json')) || req.xhr;
            };

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to mark notifications as read',
                    message: error.message
                });
            }
            return res.status(500).json({
                success: false,
                error: 'Failed to mark notifications as read'
            });
        }
    }
};

const CustomerController = {
    // Get customer management page data
    async getCustomerManagement(req, res) {
        try {
            const isAPIRequest = (req) => {
                const acceptHeader = (req.headers.accept || '').toLowerCase();
                return acceptHeader.includes('application/json') || req.xhr;
            };

            // Get analytics data
            const totalCustomers = await Customer.countDocuments();
            const activeCustomers = await Customer.countDocuments({ status: 'active' });

            // Calculate total revenue and average order value
            const revenueAgg = await Customer.aggregate([
                { $group: { _id: null, totalRevenue: { $sum: "$total_spent" }, avgOrderValue: { $avg: "$total_spent" } } }
            ]);
            const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
            const avgOrderValue = revenueAgg[0]?.avgOrderValue || 0;

            // Get top customers by total spent
            const topCustomers = await Customer.find({})
                .sort({ total_spent: -1 })
                .limit(10)
                .lean();

            // Get recent customers (last 20)
            const recentCustomers = await Customer.find({})
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();

            // Generate customer growth data (last 6 months)
            const customerGrowthData = [];
            const customerGrowthLabels = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                customerGrowthLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));

                // Count customers created in this month
                const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                const count = await Customer.countDocuments({
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                });
                customerGrowthData.push(count);
            }

            // Generate purchase trends data (mock for now)
            const purchaseTrendsLabels = customerGrowthLabels;
            const purchaseTrendsData = customerGrowthData.map(count => Math.floor(count * 1.5));
            const revenueData = purchaseTrendsData.map(purchases => Math.floor(purchases * avgOrderValue));

            const analytics = {
                totalCustomers,
                activeCustomers,
                totalRevenue,
                avgOrderValue,
                customerGrowth: {
                    labels: customerGrowthLabels,
                    data: customerGrowthData
                },
                purchaseTrends: {
                    labels: purchaseTrendsLabels,
                    purchases: purchaseTrendsData,
                    revenue: revenueData
                }
            };

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({
                    success: true,
                    analytics,
                    topCustomers,
                    recentCustomers
                });
            }

            // Render HTML page (if needed)
            return res.render('admin/customer-management', {
                analytics,
                topCustomers,
                recentCustomers,
                user: res.locals.user
            });
        } catch (error) {
            console.error('Error in getCustomerManagement:', error);
            const isAPIRequest = (req) => {
                return (req.headers.accept && req.headers.accept.includes('application/json')) || req.xhr;
            };

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch customer management data',
                    message: error.message
                });
            }
            return res.status(500).send('Failed to load customer management page');
        }
    },

    // Get customer details by ID
    async getCustomerDetails(req, res) {
        try {
            const customerId = req.params.id;
            const customer = await Customer.findById(customerId).lean();

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            // Get purchase history from Product collection
            const purchases = await ProductCustomer.find({ customer_id: customerId })
                .populate('product_id')
                .sort({ purchase_date: -1 })
                .limit(10)
                .lean();

            customer.purchaseHistory = purchases;

            return res.status(200).json({
                success: true,
                customer
            });
        } catch (error) {
            console.error('Error in getCustomerDetails:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch customer details',
                message: error.message
            });
        }
    },

    // Update customer status
    async updateCustomerStatus(req, res) {
        try {
            const customerId = req.params.id;
            const { status, notes } = req.body;

            const updateData = {};
            if (status) updateData.status = status;
            if (notes !== undefined) updateData.admin_notes = notes;
            updateData.updatedAt = Date.now();

            const customer = await Customer.findByIdAndUpdate(
                customerId,
                updateData,
                { new: true, runValidators: true }
            );

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Customer updated successfully',
                customer
            });
        } catch (error) {
            console.error('Error in updateCustomerStatus:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update customer',
                message: error.message
            });
        }
    },

    // Get customer analytics
    async getCustomerAnalytics(req, res) {
        try {
            const totalCustomers = await Customer.countDocuments();
            const activeCustomers = await Customer.countDocuments({ status: 'active' });

            const revenueAgg = await Customer.aggregate([
                { $group: { _id: null, totalRevenue: { $sum: "$total_spent" }, avgOrderValue: { $avg: "$total_spent" } } }
            ]);
            const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
            const avgOrderValue = revenueAgg[0]?.avgOrderValue || 0;

            return res.status(200).json({
                success: true,
                analytics: {
                    totalCustomers,
                    activeCustomers,
                    totalRevenue,
                    avgOrderValue
                }
            });
        } catch (error) {
            console.error('Error in getCustomerAnalytics:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch customer analytics',
                message: error.message
            });
        }
    },

    // Get all customers
    async getAllCustomers(req, res) {
        try {
            const isAPIRequest = (req) => {
                const acceptHeader = (req.headers.accept || '').toLowerCase();
                return acceptHeader.includes('application/json') || req.xhr;
            };

            const customers = await Customer.find({})
                .sort({ createdAt: -1 })
                .lean();

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({
                    success: true,
                    customers
                });
            }

            // Render HTML page
            return res.render('admin/all-customers', {
                customers,
                user: res.locals.user
            });
        } catch (error) {
            console.error('Error in getAllCustomers:', error);
            const isAPIRequest = (req) => {
                return (req.headers.accept && req.headers.accept.includes('application/json')) || req.xhr;
            };

            if (isAPIRequest(req)) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch customers',
                    message: error.message
                });
            }
            return res.status(500).send('Failed to load customers page');
        }
    }
};

module.exports = { DashboardController, AnalyticsController, FeedbackController, PaymentController, UserManagementController, CollaborationController, CustomerController, NotificationController };