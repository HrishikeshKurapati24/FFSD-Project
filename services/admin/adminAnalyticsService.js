const { BrandAnalytics, BrandInfo } = require('../../models/BrandMongo');
const { InfluencerAnalytics, InfluencerInfo } = require('../../models/InfluencerMongo');
const { CampaignInfo, CampaignMetrics, CampaignPayments } = require('../../models/CampaignMongo');

class adminAnalyticsService {
    static async getBrandAnalytics() {
        try {
            const totalBrands = await BrandInfo.countDocuments();
            const activeBrands = await BrandInfo.countDocuments({ verified: true });
            const brandGrowth = 5;
            const activeGrowth = 5; // Growth percentage for active brands

            // Fetch highest collaboration brand info and analytics
            const highestCollabBrandInfo = await BrandInfo.findOne().sort({ completedCampaigns: -1 }).lean() || {};
            const highestCollabBrandAnalytics = await BrandAnalytics.findOne({ brandId: highestCollabBrandInfo._id }).lean() || {};

            // Fetch most active brand info and analytics
            const mostActiveBrandInfo = await BrandInfo.findOne().sort({ completedCampaigns: -1 }).lean() || {};

            // Map highestCollabBrand
            const highestCollabBrand = {
                name: highestCollabBrandInfo.brandName || 'N/A',
                value: highestCollabBrandAnalytics.monthlyEarnings || 0,
                logo: highestCollabBrandInfo.logoUrl || '/images/default-brand-logo.jpg'
            };

            // Map mostActiveBrand
            const mostActiveBrand = {
                name: mostActiveBrandInfo.brandName || 'N/A',
                totalCollabs: mostActiveBrandInfo.completedCampaigns || 0,
                logo: mostActiveBrandInfo.logoUrl || '/images/default-brand-logo.jpg'
            };

            // High-Performance Embedding: Zero-Join Read from BrandInfo snapshots
            const topBrands = await BrandInfo.find({ status: 'active' })
                .sort({ 'performance_metrics.totalRevenue': -1 })
                .limit(5)
                .select('brandName industry performance_metrics verified logoUrl')
                .lean();

            const formattedTopBrands = topBrands.map(brand => {
                const metrics = brand.performance_metrics || {};
                return {
                    name: brand.brandName || 'N/A',
                    category: brand.industry || 'N/A',
                    activeCampaigns: metrics.activeCampaigns || 0,
                    revenue: metrics.totalRevenue || 0,
                    engagementRate: metrics.engagementRate || 0,
                    status: brand.verified ? 'Active' : 'Pending',
                    logo: brand.logoUrl || '/images/default-brand-logo.jpg'
                };
            });

            // Chart data: Monthly Growth
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);

            const growthAgg = await BrandInfo.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const last6Months = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                last6Months.push({
                    key: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`,
                    label: months[d.getMonth()]
                });
            }

            const monthlyGrowth = {
                labels: last6Months.map(m => m.label),
                data: last6Months.map(m => {
                    const found = growthAgg.find(a => a._id === m.key);
                    return found ? found.count : (Math.floor(Math.random() * 5)); // Minimal jitter for empty data
                }),
                newBrands: last6Months.map(m => {
                    const found = growthAgg.find(a => a._id === m.key);
                    return found ? found.count : 0;
                })
            };

            // Revenue Data aggregation
            const revenueAgg = await CampaignPayments.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo }, status: 'completed' } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        total: { $sum: "$amount" }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const revenueData = {
                labels: last6Months.map(m => m.label),
                data: last6Months.map(m => {
                    const found = revenueAgg.find(a => a._id === m.key);
                    return found ? found.total : 0;
                }),
                expenses: last6Months.map((m, idx) => {
                    const found = revenueAgg.find(a => a._id === m.key);
                    const rev = found ? found.total : 0;
                    return Math.floor(rev * 0.65); // Mock expenses as % of revenue for now
                })
            };

            // topCategories shaped as array of { name, percentage, count }
            const topCategories = [
                { name: 'Fashion & Beauty', percentage: 28, count: Math.ceil(totalBrands * 0.28) || 45 },
                { name: 'Technology', percentage: 22, count: Math.ceil(totalBrands * 0.22) || 35 },
                { name: 'Food & Beverage', percentage: 18, count: Math.ceil(totalBrands * 0.18) || 29 },
                { name: 'Lifestyle', percentage: 16, count: Math.ceil(totalBrands * 0.16) || 26 },
                { name: 'Health & Fitness', percentage: 16, count: Math.ceil(totalBrands * 0.16) || 25 }
            ];

            const brandPerformance = {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                avgEngagement: [4.2, 4.5, 4.8, 4.3, 5.1, 5.4],
                avgROI: [2.1, 2.3, 2.7, 2.5, 2.9, 3.2],
                campaignSuccess: [78, 82, 85, 80, 88, 92]
            };

            return {
                totalBrands,
                activeBrands,
                brandGrowth,
                activeGrowth,
                highestCollabBrand,
                mostActiveBrand,
                topBrands,
                monthlyGrowth,
                revenueData,
                topCategories,
                brandPerformance
            };
        } catch (error) {
            console.error('Error in getBrandAnalytics:', error);
            throw error;
        }
    }

    static async getInfluencerAnalytics() {
        try {
            const totalInfluencers = await InfluencerInfo.countDocuments();
            const activeInfluencers = await InfluencerInfo.countDocuments({ verified: true });
            
            // High-Performance Embedding: Use snapshots from InfluencerInfo for stats
            const avgEngagementResult = await InfluencerInfo.aggregate([
                { $match: { 'analytics_snapshot.avgEngagementRate': { $exists: true } } },
                { $group: { _id: null, avgEngagement: { $avg: "$analytics_snapshot.avgEngagementRate" } } }
            ]);
            const averageEngagement = avgEngagementResult.length > 0 ? avgEngagementResult[0].avgEngagement : 0;

            // Find top influencer (highest engagement rate) from embedded snapshot
            const topInfluencerInfo = await InfluencerInfo.findOne({ 'analytics_snapshot.avgEngagementRate': { $exists: true } })
                .sort({ 'analytics_snapshot.avgEngagementRate': -1 })
                .lean();
            
            let topInfluencer = { name: "N/A", engagementRate: 0 };
            if (topInfluencerInfo) {
                topInfluencer = {
                    name: topInfluencerInfo.displayName || topInfluencerInfo.fullName || "Unknown",
                    engagementRate: topInfluencerInfo.analytics_snapshot?.avgEngagementRate || 0
                };
            }

            // Category breakdown from real data
            const categoryAggregation = await InfluencerInfo.aggregate([{ $group: { _id: "$niche", count: { $sum: 1 } } }]);
            const categoryBreakdown = categoryAggregation.map(cat => ({
                name: cat._id || "Uncategorized",
                count: cat.count,
                percentage: totalInfluencers > 0 ? ((cat.count / totalInfluencers) * 100).toFixed(2) : "0.00"
            }));

            // Build topInfluencers list: Fetch top 5 using embedded analytics snapshots
            const topInfluencerList = await InfluencerInfo.find({ 'analytics_snapshot.avgEngagementRate': { $exists: true } })
                .sort({ 'analytics_snapshot.avgEngagementRate': -1 })
                .limit(5)
                .select('displayName fullName niche categories analytics_snapshot profilePicUrl')
                .lean();

            const topInfluencers = topInfluencerList.map(inf => {
                const analytics = inf.analytics_snapshot || {};
                return {
                    name: inf.displayName || inf.fullName || 'N/A',
                    category: inf.niche || inf.categories?.[0] || 'N/A',
                    followers: analytics.totalFollowers || 0,
                    engagement: analytics.avgEngagementRate || 0,
                    commissionEarned: analytics.performanceMetrics?.totalEarnings || 0,
                    logo: inf.profilePicUrl || '/images/default-profile.png'
                };
            });

            // Chart data: Performance & Trends
            const infGrowthAgg = await InfluencerInfo.aggregate([
                { $match: { createdAt: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const performanceData = {
                labels: last6Months.map(m => m.label),
                engagement: [4.2, 4.5, 4.8, 4.3, 5.1, 5.4], // Still mock as engagement over time needs historical analytics snapshots
                collaborations: last6Months.map(m => Math.floor(Math.random() * 20) + 30),
                reach: [125000, 142000, 138000, 156000, 162000, 178000]
            };

            const followerGrowth = {
                labels: last6Months.map(m => m.label),
                totalFollowers: [2.1, 2.3, 2.5, 2.7, 2.9, 3.2],
                monthlyGrowth: last6Months.map(m => {
                    const found = infGrowthAgg.find(a => a._id === m.key);
                    return found ? found.count : 2;
                })
            };

            return {
                totalInfluencers,
                activeInfluencers,
                averageEngagement: averageEngagement.toFixed(2),
                topInfluencer,
                categoryBreakdown,
                performanceData,
                engagementTrends,
                followerGrowth,
                topInfluencers
            };
        } catch (error) {
            console.error('Error in getInfluencerAnalytics:', error);
            throw error;
        }
    }

    static async getCustomerAnalytics() {
        try {
            // Aggregate customer-related data from existing collections
            const totalUsers = await BrandInfo.countDocuments() + await InfluencerInfo.countDocuments();
            const activeUsers = await BrandInfo.countDocuments({ verified: true }) + await InfluencerInfo.countDocuments({ verified: true });
            const customerGrowth = 7; // Dummy growth percentage
            const topCustomers = await BrandInfo.find().limit(5).lean(); // Using BrandInfo as placeholder for customers

            return { totalUsers, activeUsers, customerGrowth, topCustomers };
        } catch (error) {
            console.error('Error in getCustomerAnalytics:', error);
            throw error;
        }
    }

    static async getCampaignAnalytics() {
        try {
            const totalCampaigns = await CampaignInfo.countDocuments();
            const activeCampaigns = await CampaignInfo.countDocuments({ status: 'active' });
            const campaignGrowth = 7;
            const successRate = 85;

            // High-Performance Embedding: Use metrics and brandName snapshot from CampaignInfo
            const campaigns = await CampaignInfo.find()
                .select('title brandName start_date end_date status metrics')
                .lean();

            const topCampaigns = campaigns.map(campaign => {
                const metric = campaign.metrics || {};
                return {
                    name: campaign.title,
                    brand: campaign.brandName || 'N/A',
                    startDate: campaign.start_date ? campaign.start_date.toISOString().split('T')[0] : '',
                    endDate: campaign.end_date ? campaign.end_date.toISOString().split('T')[0] : '',
                    status: campaign.status,
                    engagementRate: metric.engagement_rate || 0
                };
            });

            const campaignTypesData = {
                labels: ['Active', 'Completed', 'Draft', 'Cancelled', 'Request'],
                counts: [activeCampaigns, 7, 5, 2, 3] // Still partially mock for status counts not tracked, but active is real
            };

            // Fetch actual historical trends from Intelligence Layer (AnalyticsSnapshots)
            const { AnalyticsSnapshot } = require('../../models/AnalyticsSnapshot');
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const snapshots = await AnalyticsSnapshot.aggregate([
                { $match: { timestamp: { $gte: sixMonthsAgo } } },
                {
                    $group: {
                        _id: {
                            month: { $month: "$timestamp" },
                            year: { $year: "$timestamp" }
                        },
                        avgEngagement: { $avg: "$metrics.avgEngagementRate" },
                        totalReach: { $sum: "$metrics.totalReach" },
                        timestamp: { $first: "$timestamp" }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]);

            const engagementTrendsData = {
                labels: snapshots.map(s => s.timestamp.toLocaleString('default', { month: 'short' })),
                engagementRates: snapshots.map(s => parseFloat((s.avgEngagement || 0).toFixed(2))),
                reach: snapshots.map(s => s.totalReach || 0)
            };

            return {
                totalCampaigns,
                activeCampaigns,
                campaignGrowth,
                successRate,
                topCampaigns,
                campaignTypesData,
                engagementTrendsData
            };
        } catch (error) {
            console.error('Error in getCampaignAnalytics:', error);
            throw error;
        }
    }

    static async getInfluencerROI() {
        const { mongoose } = require('../../mongoDB');
        const roiData = await mongoose.model('Order').aggregate([
            {
                $match: {
                    status: { $in: ['paid', 'shipped', 'delivered'] }
                }
            },
            {
                $group: {
                    _id: '$influencer_id',
                    totalRevenue: { $sum: '$total_amount' },
                    totalCommission: { $sum: '$commission_amount' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'influencerinfos',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'influencer'
                }
            },
            {
                $unwind: '$influencer'
            },
            {
                $project: {
                    _id: 0,
                    influencerId: '$_id',
                    influencerName: {
                        $ifNull: ['$influencer.fullName', '$influencer.username']
                    },
                    username: '$influencer.username',
                    totalRevenue: 1,
                    totalCommission: 1,
                    orderCount: 1,
                    campaignCount: '$orderCount',
                    avgOrderValue: {
                        $cond: [
                            { $eq: ['$orderCount', 0] },
                            0,
                            { $divide: ['$totalRevenue', '$orderCount'] }
                        ]
                    },
                    roiScore: {
                        $cond: [
                            { $eq: ['$totalCommission', 0] },
                            0,
                            { $divide: [{ $subtract: ['$totalRevenue', '$totalCommission'] }, '$totalCommission'] }
                        ]
                    }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);
        return roiData;
    }

    static async getCampaignRevenueLeaderboard() {
        const leaderboard = await CampaignMetrics.aggregate([
            {
                $group: {
                    _id: '$campaign_id',
                    totalRevenue: { $sum: { $ifNull: ['$revenue', 0] } },
                    avgEngagementRate: { $avg: { $ifNull: ['$engagement_rate', 0] } },
                    totalClicks: { $sum: { $ifNull: ['$clicks', 0] } },
                    totalImpressions: { $sum: { $ifNull: ['$impressions', 0] } }
                }
            },
            {
                $lookup: {
                    from: 'campaigninfos',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'campaign'
                }
            },
            { $unwind: '$campaign' },
            {
                $project: {
                    _id: 0,
                    campaignId: '$_id',
                    title: '$campaign.title',
                    revenue: '$totalRevenue',
                    totalRevenue: 1,
                    avgEngagementRate: 1,
                    totalClicks: 1,
                    totalImpressions: 1,
                    roi: {
                        $cond: [
                            { $eq: ['$campaign.budget', 0] },
                            0,
                            { $divide: ['$totalRevenue', '$campaign.budget'] }
                        ]
                    }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 10 }
        ]);
        return leaderboard;
    }

    static async getMatchmakingRecommendations(brandId, queryParams = {}) {
        const { page = 1, limit = 20 } = queryParams;
        const brand = await BrandInfo.findById(brandId);
        if (!brand) throw new Error('Brand not found');

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const brandCats = Array.isArray(brand.categories) ? brand.categories.map(c => (c || '').toLowerCase()) : [];
        const brandIndustry = (brand.industry || '').toLowerCase();
        const brandLocation = (brand.location || '').toLowerCase();
        const brandRegions = (brand.influenceRegions || '').toLowerCase();
        const brandTargetGender = brand.targetGender || 'All';

        const pipeline = [
            {
                $addFields: {
                    matchScore: {
                        $add: [
                            // Category Match (50 points if any category matches)
                            {
                                $cond: [
                                    {
                                        $gt: [
                                            { $size: { $setIntersection: [{ $map: { input: { $ifNull: ["$categories", []] }, as: "c", in: { $toLower: "$$c" } } }, brandCats] } },
                                            0
                                        ]
                                    },
                                    50,
                                    0
                                ]
                            },
                            // Industry/Niche Match (30 points)
                            {
                                $cond: [
                                    {
                                        $or: [
                                            { $regexMatch: { input: { $toLower: { $ifNull: ["$niche", ""] } }, regex: brandIndustry || "____never_match____", options: "i" } },
                                            { $regexMatch: { input: brandIndustry || "____never_match____", regex: { $toLower: { $ifNull: ["$niche", ""] } }, options: "i" } }
                                        ]
                                    },
                                    30,
                                    0
                                ]
                            },
                            // Location Match (15 points)
                            {
                                $cond: [
                                    {
                                        $or: [
                                            { $regexMatch: { input: { $toLower: { $ifNull: ["$location", ""] } }, regex: brandLocation || "____never_match____", options: "i" } },
                                            { $regexMatch: { input: brandLocation || "____never_match____", regex: { $toLower: { $ifNull: ["$location", ""] } }, options: "i" } }
                                        ]
                                    },
                                    15,
                                    0
                                ]
                            },
                            // Gender Match (15 points)
                            {
                                $cond: [
                                    {
                                        $or: [
                                            { $eq: [brandTargetGender, "All"] },
                                            { $eq: ["$audienceGender", brandTargetGender] }
                                        ]
                                    },
                                    15,
                                    0
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    matchScore: {
                        $cond: [
                            { $eq: ["$matchScore", 0] },
                            { $floor: { $multiply: [{ $rand: {} }, 15] } }, // Keep some random variance for non-matches
                            "$matchScore"
                        ]
                    }
                }
            },
            { $sort: { matchScore: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $project: {
                    influencer: {
                        _id: "$_id",
                        fullName: 1,
                        displayName: { $ifNull: ["$displayName", "$fullName"] },
                        influencerName: { $ifNull: ["$fullName", "$username"] },
                        username: 1,
                        profilePicUrl: 1,
                        profilePicture: "$profilePicUrl",
                        niche: 1,
                        categories: 1,
                        totalFollowers: 1
                    },
                    matchScore: 1,
                    score: "$matchScore",
                    matchReasons: [] // Aggregation based match reasons is complex to implement fully here, can be computed if needed
                }
            }
        ];

        const recommendations = await InfluencerInfo.aggregate(pipeline);
        return recommendations;
    }

    static async getBrandMatchmakingRecommendations(influencerId, queryParams = {}) {
        const { page = 1, limit = 20 } = queryParams;
        const influencer = await InfluencerInfo.findById(influencerId);
        if (!influencer) throw new Error('Influencer not found');

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const infCats = Array.isArray(influencer.categories) ? influencer.categories.map(c => (c || '').toLowerCase()) : [];
        const infNiche = (influencer.niche || '').toLowerCase();
        const infLocation = (influencer.location || '').toLowerCase();
        const infGender = influencer.audienceGender || 'All';

        const pipeline = [
            { $match: { status: 'active' } },
            {
                $addFields: {
                    matchScore: {
                        $add: [
                            // Category Match (50 points)
                            {
                                $cond: [
                                    {
                                        $gt: [
                                            { $size: { $setIntersection: [{ $map: { input: { $ifNull: ["$categories", []] }, as: "c", in: { $toLower: "$$c" } } }, infCats] } },
                                            0
                                        ]
                                    },
                                    50,
                                    0
                                ]
                            },
                            // Industry/Niche Match (30 points)
                            {
                                $cond: [
                                    {
                                        $or: [
                                            { $regexMatch: { input: { $toLower: { $ifNull: ["$industry", ""] } }, regex: infNiche || "____never_match____", options: "i" } },
                                            { $regexMatch: { input: infNiche || "____never_match____", regex: { $toLower: { $ifNull: ["$industry", ""] } }, options: "i" } }
                                        ]
                                    },
                                    30,
                                    0
                                ]
                            },
                            // Location Match (15 points)
                            {
                                $cond: [
                                    {
                                        $or: [
                                            { $regexMatch: { input: { $toLower: { $ifNull: ["$location", ""] } }, regex: infLocation || "____never_match____", options: "i" } },
                                            { $regexMatch: { input: infLocation || "____never_match____", regex: { $toLower: { $ifNull: ["$location", ""] } }, options: "i" } },
                                            { $regexMatch: { input: { $toLower: { $ifNull: ["$influenceRegions", ""] } }, regex: infLocation || "____never_match____", options: "i" } }
                                        ]
                                    },
                                    15,
                                    0
                                ]
                            },
                            // Audience Gender Match (15 points)
                            {
                                $cond: [
                                    {
                                        $or: [
                                            { $eq: ["$targetGender", "All"] },
                                            { $eq: ["$targetGender", infGender] }
                                        ]
                                    },
                                    15,
                                    0
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    matchScore: {
                        $cond: [
                            { $eq: ["$matchScore", 0] },
                            { $floor: { $multiply: [{ $rand: {} }, 15] } },
                            "$matchScore"
                        ]
                    }
                }
            },
            { $sort: { matchScore: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $project: {
                    brand: {
                        _id: "$_id",
                        brandName: 1,
                        logoUrl: 1,
                        industry: 1,
                        categories: 1,
                        verified: 1
                    },
                    matchScore: 1,
                    score: "$matchScore",
                    matchReasons: []
                }
            }
        ];

        const recommendations = await BrandInfo.aggregate(pipeline);
        return recommendations;
    }

    static async getEcosystemGraphData() {
        const { CampaignInfluencers } = require('../../models/CampaignMongo');
        const brands = await BrandInfo.find({}).select('brandName logoUrl industry').lean();
        const brandNodes = brands.map(b => ({
            id: b._id.toString(),
            group: 'brand',
            label: b.brandName,
            image: b.logoUrl,
            value: 20
        }));

        const influencers = await InfluencerInfo.find({}).select('fullName profilePicUrl niche').lean();
        const influencerNodes = influencers.map(i => ({
            id: i._id.toString(),
            group: 'influencer',
            label: i.fullName || i.username,
            image: i.profilePicUrl,
            value: 15
        }));

        const collaborations = await CampaignInfluencers.find({
            status: { $in: ['active', 'completed'] }
        })
            .populate('campaign_id', 'brand_id budget')
            .select('influencer_id revenue')
            .lean();

        const links = collaborations
            .filter(c => c.campaign_id && c.campaign_id.brand_id)
            .map(c => ({
                from: c.campaign_id.brand_id.toString(),
                to: c.influencer_id.toString(),
                value: 2,
                color: { color: '#4CAF50', opacity: 0.8 },
                title: `Revenue: $${c.revenue || 0}`,
                status: c.status
            }));

        return {
            nodes: [...brandNodes, ...influencerNodes],
            links: links,
            edges: links
        };
    }
}

module.exports = adminAnalyticsService;
