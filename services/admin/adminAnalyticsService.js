const { BrandAnalytics, BrandInfo } = require('../../models/BrandMongo');
const { InfluencerAnalytics, InfluencerInfo } = require('../../models/InfluencerMongo');
const { CampaignInfo, CampaignMetrics } = require('../../models/CampaignMongo');

class adminAnalyticsService {
    static async getBrandAnalytics() {
        try {
            const totalBrands = await BrandInfo.countDocuments();
            const activeBrands = await BrandInfo.countDocuments({ verified: true });
            const brandGrowth = 5;

            // Fetch highest collaboration brand info and analytics
            const highestCollabBrandInfo = await BrandInfo.findOne().sort({ completedCampaigns: -1 }).lean() || {};
            const highestCollabBrandAnalytics = await BrandAnalytics.findOne({ brandId: highestCollabBrandInfo._id }).lean() || {};

            // Fetch most active brand info and analytics
            const mostActiveBrandInfo = await BrandInfo.findOne().sort({ completedCampaigns: -1 }).lean() || {};
            const mostActiveBrandAnalytics = await BrandAnalytics.findOne({ brandId: mostActiveBrandInfo._id }).lean() || {};

            const topBrands = await BrandInfo.find().limit(5).lean();

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

            const chartData = {
                brandGrowthData: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
                    data: [121, 1598, 220, 3987] // Mock Data
                },
                revenueData: {
                    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                    data: [1200, 1100, 25000, 30000] // Mock Data
                },
                categoryDistribution: {
                    labels: ['Fashion', 'Tech', 'Fitness', 'Food'],
                    data: [35, 25, 21, 18] // Mock Data
                }
            };

            return { totalBrands, activeBrands, brandGrowth, highestCollabBrand, mostActiveBrand, topBrands, chartData };
        } catch (error) {
            console.error('Error in getBrandAnalytics:', error);
            throw error;
        }
    }

    static async getInfluencerAnalytics() {
        try {
            const totalInfluencers = await InfluencerInfo.countDocuments();
            const activeInfluencers = await InfluencerInfo.countDocuments({ verified: true });
            const avgEngagementResult = await InfluencerAnalytics.aggregate([{ $group: { _id: null, avgEngagement: { $avg: "$avgEngagementRate" } } }]);
            const averageEngagement = avgEngagementResult.length > 0 ? avgEngagementResult[0].avgEngagement : 0;
            const topInfluencerData = await InfluencerAnalytics.findOne().sort({ avgEngagementRate: -1 }).lean();
            let topInfluencer = { name: "N/A", engagementRate: 0 };
            if (topInfluencerData && topInfluencerData.influencerId) {
                const influencerInfo = await InfluencerInfo.findById(topInfluencerData.influencerId).lean();
                if (influencerInfo) {
                    topInfluencer = { name: influencerInfo.displayName || influencerInfo.fullName || "Unknown", engagementRate: topInfluencerData.avgEngagementRate || 0 };
                }
            }
            const categoryAggregation = await InfluencerInfo.aggregate([{ $group: { _id: "$niche", count: { $sum: 1 } } }]);
            const categoryBreakdown = categoryAggregation.map(cat => ({ name: cat._id || "Uncategorized", count: cat.count, percentage: totalInfluencers > 0 ? ((cat.count / totalInfluencers) * 100).toFixed(2) : "0.00" }));

            // Mock Chart Data
            const performanceData = {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                engagement: [4.2, 4.5, 4.8, 4.3, 5.1, 5.4],
                collaborations: [45, 52, 48, 61, 58, 67],
                reach: [125000, 142000, 138000, 156000, 162000, 178000]
            };

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

            return {
                totalInfluencers,
                activeInfluencers,
                averageEngagement: averageEngagement.toFixed(2),
                topInfluencer,
                categoryBreakdown,
                performanceData,
                engagementTrends,
                followerGrowth,
                performance_analytic,
                topInfluencers: topInfluencer.name !== "N/A" ? [topInfluencer] : []
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
            const campaigns = await CampaignInfo.find().lean();
            const campaignMetrics = await CampaignMetrics.find().lean();

            // Fetch brand info for campaigns
            const brandIds = campaigns.map(c => c.brand_id);
            const brands = await BrandInfo.find({ _id: { $in: brandIds } }).lean();
            const brandMap = {};
            brands.forEach(brand => {
                brandMap[brand._id.toString()] = brand.brandName || 'N/A';
            });

            const topCampaigns = campaigns.map(campaign => {
                const metric = campaignMetrics.find(m => m.campaign_id.toString() === campaign._id.toString()) || {};
                return {
                    name: campaign.title,
                    brand: brandMap[campaign.brand_id.toString()] || 'N/A',
                    startDate: campaign.start_date ? campaign.start_date.toISOString().split('T')[0] : '',
                    endDate: campaign.end_date ? campaign.end_date.toISOString().split('T')[0] : '',
                    status: campaign.status,
                    engagementRate: metric.engagement_rate || 0
                };
            });

            const campaignTypesData = {
                labels: ['Active', 'Completed', 'Draft', 'Cancelled', 'Request'],
                counts: [10, 7, 5, 2, 3] // Mock values
            };

            const engagementTrendsData = {
                labels: ['January', 'February', 'March', 'April', 'May', 'June'],
                engagementRates: [25, 30, 28, 35, 40, 42], // Mock values
                reach: [1000, 1500, 1300, 1700, 2000, 2200]  // Mock values
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

    static async getMatchmakingRecommendations(brandId) {
        const brand = await BrandInfo.findById(brandId);
        if (!brand) throw new Error('Brand not found');

        const influencers = await InfluencerInfo.find({}).lean();

        const recommendations = influencers.map(inf => {
            let score = 0;
            let matches = [];

            const brandCats = Array.isArray(brand.categories) ? brand.categories : [];
            const infCats = Array.isArray(inf.categories) ? inf.categories : [];

            const matchedCats = brandCats.filter(cat =>
                infCats.some(infCat => (infCat || '').toLowerCase() === (cat || '').toLowerCase())
            );

            if (matchedCats.length > 0) {
                score += 50;
                matches.push(`Category Match: ${matchedCats[0]}${matchedCats.length > 1 ? ' +' + (matchedCats.length - 1) : ''}`);
            }

            const brandIndustry = (brand.industry || '').toLowerCase();
            const infNiche = (inf.niche || '').toLowerCase();
            if (brandIndustry && infNiche && (brandIndustry.includes(infNiche) || infNiche.includes(brandIndustry))) {
                score += 30;
                matches.push('Industry/Niche Match');
            }

            const targetInterests = Array.isArray(brand.targetInterests) ? brand.targetInterests : [];
            const interestMatches = targetInterests.filter(interest =>
                infCats.some(infCat => (infCat || '').toLowerCase() === (interest || '').toLowerCase()) ||
                (inf.niche || '').toLowerCase().includes((interest || '').toLowerCase())
            );
            if (interestMatches.length > 0) {
                score += 20;
                matches.push('Target Interest Match');
            }

            const brandLocation = (brand.location || '').toLowerCase();
            const infLocation = (inf.location || '').toLowerCase();
            const brandRegions = (brand.influenceRegions || '').toLowerCase();

            if (brandLocation && infLocation && (brandLocation.includes(infLocation) || infLocation.includes(brandLocation))) {
                score += 15;
                matches.push('Location Match');
            } else if (brandRegions && infLocation && brandRegions.includes(infLocation)) {
                score += 10;
                matches.push('Region Match');
            }

            if (brand.targetGender && inf.audienceGender &&
                (brand.targetGender === 'All' || brand.targetGender === inf.audienceGender)) {
                score += 15;
                matches.push('Audience Gender Match');
            }

            if (score === 0) score = Math.floor(Math.random() * 15);

            return {
                influencer: {
                    _id: inf._id,
                    fullName: inf.fullName,
                    influencerName: inf.fullName || inf.username,
                    username: inf.username,
                    profilePicUrl: inf.profilePicUrl,
                    profilePicture: inf.profilePicUrl,
                    niche: inf.niche,
                    categories: inf.categories,
                    totalFollowers: inf.totalFollowers
                },
                matchScore: Math.min(score, 100),
                score: Math.min(score, 100),
                matchReasons: matches
            };
        });

        recommendations.sort((a, b) => b.matchScore - a.matchScore);
        return recommendations.slice(0, 20);
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
