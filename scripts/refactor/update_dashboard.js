const fs = require('fs');

const svcPath = './services/admin/adminDashboardService.js';
const ctrlPath = './controllers/admin/adminDashboardController.js';

let svcC = fs.readFileSync(svcPath, 'utf8');

const newMethods = `
    static async verifyAdminUser(username, password) {
        const { Admin } = require('../../mongoDB');
        const bcrypt = require('bcrypt');
        
        const user = await Admin.findOne({ username });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        return user;
    }

    static async getDashboardMetrics() {
        const { Admin, mongoose } = require('../../mongoDB');
        const { BrandInfo } = require('../../models/BrandMongo');
        const { InfluencerInfo, InfluencerAnalytics } = require('../../models/InfluencerMongo');
        const { CampaignInfo, CampaignInfluencers, CampaignPayments } = require('../../models/CampaignMongo');
        const { Product } = require('../../models/ProductMongo');

        const [userCount, brandCount, influencerCount] = await Promise.all([
            Admin.countDocuments(),
            BrandInfo.countDocuments(),
            InfluencerInfo.countDocuments()
        ]);

        const [activeCollabs, completedCollabs, pendingCollabs] = await Promise.all([
            CampaignInfluencers.countDocuments({ status: "active" }),
            CampaignInfluencers.countDocuments({ status: "completed" }),
            CampaignInfluencers.countDocuments({ status: "request" })
        ]);

        const revenueAgg = await CampaignPayments.aggregate([
            { $match: { status: "completed" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalRevenue = revenueAgg[0]?.total || 0;

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

        const avgDealSizeAgg = await CampaignPayments.aggregate([
            { $match: { status: "completed" } },
            { $group: { _id: null, avgAmount: { $avg: "$amount" } } }
        ]);
        const avgDealSize = avgDealSizeAgg[0]?.avgAmount || 0;

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

        const recentTransactionsRaw = await CampaignPayments.find({ status: "completed" })
            .sort({ payment_date: -1 })
            .limit(5)
            .populate({ path: "campaign_id", select: "title" });
        const recentTransactions = recentTransactionsRaw.map(tx => ({
            date: tx.payment_date?.toISOString().slice(0, 10) || "",
            collab: tx.campaign_id?.title || "",
            amount: tx.amount
        }));

        const monthlyRevenueData = [];
        const monthlyLabels = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            monthlyLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));

            const baseRevenue = totalRevenue / 6;
            const variation = (Math.random() - 0.5) * 0.4;
            monthlyRevenueData.push(Math.round(baseRevenue * (1 + variation)));
        }

        const userGrowthData = [];
        const userGrowthLabels = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            userGrowthLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));
            const growthFactor = (6 - i) / 6;
            userGrowthData.push(Math.round((brandCount + influencerCount) * growthFactor * 0.8));
        }

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

        let topInfluencers = [];
        try {
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
                const fallbackInfluencers = await InfluencerInfo.find({})
                    .limit(5)
                    .lean();

                topInfluencers = fallbackInfluencers.map(inf => ({
                    displayName: inf.displayName || inf.fullName || 'Unknown',
                    audienceSize: 0,
                    categories: inf.categories || []
                }));
            }
        } catch (error) {
            console.log("Error fetching top influencers:", error);
            topInfluencers = [];
        }

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

        return {
            userCount, brandCount, influencerCount,
            activeCollabs, completedCollabs, pendingCollabs,
            totalRevenue, revenueGrowth, avgDealSize,
            totalSoldQuantity, avgProductPrice, totalProducts,
            recentTransactions, monthlyRevenueData, monthlyLabels,
            userGrowthData, userGrowthLabels, analytics,
            topBrands, topInfluencers, stats
        };
    }
`;

svcC = svcC.replace('class adminDashboardService {', 'class adminDashboardService {' + newMethods);
fs.writeFileSync(svcPath, svcC);

let ctrlC = fs.readFileSync(ctrlPath, 'utf8');

// Replace verifyUser body
const verifyUserOldStart = `
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

            // Generate JWT token`;

const verifyUserNewStart = `
    async verifyUser(req, res) {
        try {
            const { username, password, rememberMe } = req.body;
            const remember = !!rememberMe;

            let user;
            try {
                user = await AdminDashboardService.verifyAdminUser(username, password);
            } catch (err) {
                return res.status(401).json({
                    success: false,
                    message: err.message || 'Invalid credentials'
                });
            }

            // Generate JWT token`;

ctrlC = ctrlC.replace(verifyUserOldStart, verifyUserNewStart);

// Replace getDashboard body
const getDashboardRegex = /async getDashboard\(req, res\) \{[\s\S]*?(?=\/\/ Helper function to detect API requests)/m;
const match = ctrlC.match(getDashboardRegex);
if(match) {
    const replacement = `async getDashboard(req, res) {
        // Always check if this is an API request first and set headers accordingly
        const fullPath = req.originalUrl || req.url || req.path || '';
        const pathOnly = fullPath.split('?')[0];
        const isLikelyAPIRequest = pathOnly === '/admin/dashboard' || pathOnly === '/dashboard' ||
            (!req.headers.accept || !req.headers.accept.includes('text/html'));

        if (isLikelyAPIRequest) {
            res.setHeader('Content-Type', 'application/json');
        }

        try {
            const metrics = await AdminDashboardService.getDashboardMetrics();
            const {
                userCount, brandCount, influencerCount,
                activeCollabs, completedCollabs, pendingCollabs,
                totalRevenue, revenueGrowth, avgDealSize,
                totalSoldQuantity, avgProductPrice, totalProducts,
                recentTransactions, monthlyRevenueData, monthlyLabels,
                userGrowthData, userGrowthLabels, analytics,
                topBrands, topInfluencers, stats
            } = metrics;

            // Notifications - Generate based on current data
            const generateNotifications = require('../../utils/notifications');
            let notifications = [];
            try {
                if (typeof generateNotifications === 'function') {
                    notifications = await generateNotifications();
                }
            } catch(e) { console.error('Notifications generation error:', e); }

            `;
    ctrlC = ctrlC.replace(match[0], replacement);
    fs.writeFileSync(ctrlPath, ctrlC);
}

