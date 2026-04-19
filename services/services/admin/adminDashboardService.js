const { BrandInfo } = require('../../models/BrandMongo');
const { InfluencerInfo, InfluencerAnalytics } = require('../../models/InfluencerMongo');
const { CampaignInfo, CampaignInfluencers, CampaignPayments } = require('../../models/CampaignMongo');
const { Product } = require('../../models/ProductMongo');
const { Admin, mongoose } = require('../../mongoDB');
const bcrypt = require('bcrypt');

class adminDashboardService {
    /**
     * Verifies admin credentials
     */
    static async verifyAdminUser(username, password) {
        const user = await Admin.findOne({ username }).select('+password');
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        return user;
    }

    /**
     * Fetches all metrics for the admin dashboard
     */
    static async getDashboardMetrics() {
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

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        // Real Monthly Revenue Data
        const revenueGrowthAgg = await CampaignPayments.aggregate([
            { $match: { status: "completed", payment_date: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$payment_date" } },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Real User Growth Data (Brands + Influencers combined)
        const brandGrowthAgg = await BrandInfo.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } }
        ]);
        const influencerGrowthAgg = await InfluencerInfo.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } }
        ]);

        const monthsMapping = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyRevenueData = [];
        const userGrowthData = [];
        const monthlyLabels = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            monthlyLabels.push(monthsMapping[d.getMonth()]);

            const revFound = revenueGrowthAgg.find(a => a._id === key);
            monthlyRevenueData.push(revFound ? revFound.total : 0);

            const bFound = brandGrowthAgg.find(a => a._id === key);
            const iFound = influencerGrowthAgg.find(a => a._id === key);
            userGrowthData.push((bFound ? bFound.count : 0) + (iFound ? iFound.count : 0));
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
                labels: monthlyLabels,
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
            // High-Performance Embedding: Use the performance_metrics snapshot
            topBrands = await BrandInfo.find({ status: 'active' })
                .sort({ 'performance_metrics.totalRevenue': -1 })
                .limit(5)
                .select('brandName performance_metrics')
                .lean();

            topBrands = topBrands.map(brand => ({
                name: brand.brandName,
                totalRevenue: brand.performance_metrics?.totalRevenue || 0,
                dealCount: brand.performance_metrics?.totalCampaigns || 0
            }));
        } catch (error) {
            console.log("Error fetching top brands:", error);
            topBrands = [];
        }

        let topInfluencers = [];
        try {
            // High-Performance Embedding: Use the analytics_snapshot directly
            const topProfiles = await InfluencerInfo.find({ status: 'active' })
                .sort({ 'analytics_snapshot.totalFollowers': -1 })
                .limit(5)
                .lean();

            topInfluencers = topProfiles.map(inf => ({
                displayName: inf.displayName || inf.fullName || 'Unknown',
                audienceSize: inf.analytics_snapshot?.totalFollowers || 0,
                categories: inf.categories || []
            }));
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
            userGrowthData, userGrowthLabels: monthlyLabels, analytics,
            topBrands, topInfluencers, stats
        };
    }

    /**
     * Helper to generate dashboard notifications
     */
    static async generateNotifications() {
        const notifications = [];

        const [pendingCollabs, flaggedBrands, flaggedInfluencers] = await Promise.all([
            CampaignInfluencers.countDocuments({ status: "request" }),
            BrandInfo.countDocuments({ verified: false }),
            InfluencerInfo.countDocuments({ verified: false })
        ]);

        if (pendingCollabs > 0) {
            notifications.push({
                type: "collab",
                message: `${pendingCollabs} collaboration requests are pending approval.`,
                time: "Real-time"
            });
        }
        if (flaggedBrands > 0) {
            notifications.push({
                type: "verification",
                message: `${flaggedBrands} brands are awaiting verification.`,
                time: "Pending"
            });
        }
        if (flaggedInfluencers > 0) {
            notifications.push({
                type: "verification",
                message: `${flaggedInfluencers} influencers are awaiting verification.`,
                time: "Pending"
            });
        }

        // Add dummy notification for system health
        notifications.push({
            type: "system",
            message: "All systems operational. Last sync: 2 mins ago.",
            time: "2m ago"
        });

        return notifications;
    }

    static async getDashboardStats() {
        return this.getDashboardMetrics();
    }

    static async getAnalyticsData() {
        return [
            { title: "Engagement Rate", chartId: "engagementRateChart" },
            { title: "Click-Through Rate (CTR)", chartId: "ctrChart" },
            { title: "Conversion Rate", chartId: "conversionRateChart" },
            { title: "Total Reach & Impressions", chartId: "reachImpressionsChart" },
            { title: "Campaign ROI", chartId: "roiChart" }
        ];
    }

    static async getProfiles() {
        const influencerProfile = {
            title: "Influencer Profile",
            details: [
                { label: "Growth Trends", value: "10% increase" },
                { label: "Past Collaborations", value: await CampaignInfluencers.countDocuments() },
                { label: "Audience Demographics", value: "18-34 years" },
                { label: "Authenticity Score", value: "95%" }
            ]
        };
        const brandProfile = {
            title: "Brand Profile",
            details: [
                { label: "Growth Trends", value: "12% increase" },
                { label: "Past Collaborations", value: await CampaignInfo.countDocuments() },
                { label: "Audience Demographics", value: "25-45 years" },
                { label: "Authenticity Score", value: "90%" }
            ]
        };
        return [influencerProfile, brandProfile];
    }

    static async getCampaigns() {
        return [
            {
                title: "Campaign Performance",
                metrics: [
                    { label: "Clicks", value: "1200" },
                    { label: "Conversions", value: "300" },
                    { label: "Sales Generated", value: "$10K" },
                    { label: "Best-Performing Content", value: "Video Ads" },
                    { label: "Hashtag & Mention Tracking", value: "#BestCampaign" },
                    { label: "A/B Testing Results", value: "Variant B performed better" }
                ]
            }
        ];
    }

    static async checkSuspiciousActivity() {
        const suspiciousActivities = { brands: [], influencers: [] };
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const brandCampaigns = await CampaignInfo.aggregate([
                { $match: { createdAt: { $gte: oneHourAgo } } },
                { $group: { _id: "$brandId", count: { $sum: 1 } } },
                { $match: { count: { $gt: 5 } } }
            ]);
            suspiciousActivities.brands = brandCampaigns.map(item => item._id);
            const influencerApplications = await CampaignInfluencers.aggregate([
                { $match: { appliedAt: { $gte: oneHourAgo } } },
                { $group: { _id: "$influencerId", count: { $sum: 1 } } },
                { $match: { count: { $gt: 5 } } }
            ]);
            suspiciousActivities.influencers = influencerApplications.map(item => item._id);
            return suspiciousActivities;
        } catch (error) {
            console.error("Error checking suspicious activity:", error);
            return suspiciousActivities;
        }
    }
}

module.exports = adminDashboardService;
