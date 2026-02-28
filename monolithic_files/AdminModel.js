const mongoose = require('mongoose');
const { Admin } = require('../mongoDB');
const { BrandAnalytics, BrandInfo } = require('../models/BrandMongo');
const { InfluencerAnalytics, InfluencerInfo } = require('../models/InfluencerMongo');
const { CampaignInfo, CampaignInfluencers, CampaignMetrics, CampaignPayments } = require('../models/CampaignMongo');

const AdminModel = {
    DashboardModel: class {
        static async getDashboardStats() {
            const totalUsers = await InfluencerInfo.countDocuments() + await BrandInfo.countDocuments();
            const activeUsers = await InfluencerInfo.countDocuments({ verified: true }) + await BrandInfo.countDocuments({ verified: true });
            const totalRevenueAgg = await CampaignPayments.aggregate([
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const totalRevenue = totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;
            const totalCollaborations = await CampaignInfo.countDocuments();

            return {
                totalUsers,
                userGrowth: 12,
                activeUsers,
                activeUserGrowth: 8,
                totalRevenue: `$${totalRevenue.toLocaleString()}`,
                revenueGrowth: 15,
                totalCollaborations,
                collabGrowth: 10
            };
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

        async checkSuspiciousActivity() {
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
    },

    AnalyticsModel: class {
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

                // Map highestCollabBrand with required fields
                const highestCollabBrand = {
                    name: highestCollabBrandInfo.brandName || 'N/A',
                    value: highestCollabBrandAnalytics.monthlyEarnings || 0,
                    logo: highestCollabBrandInfo.logoUrl || '/images/default-brand-logo.jpg'
                };

                // Map mostActiveBrand with required fields
                const mostActiveBrand = {
                    name: mostActiveBrandInfo.brandName || 'N/A',
                    totalCollabs: mostActiveBrandInfo.completedCampaigns || 0,
                    logo: mostActiveBrandInfo.logoUrl || '/images/default-brand-logo.jpg'
                };

                return { totalBrands, activeBrands, brandGrowth, highestCollabBrand, mostActiveBrand, topBrands };
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
                return { totalInfluencers, activeInfluencers, averageEngagement: averageEngagement.toFixed(2), topInfluencer, categoryBreakdown };
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

                return { totalCampaigns, activeCampaigns, campaignGrowth, successRate, topCampaigns };
            } catch (error) {
                console.error('Error in getCampaignAnalytics:', error);
                throw error;
            }
        }
    },

    FeedbackModel: class {
        static async getAllFeedback() {
            try { return db.feedback || []; }
            catch (error) { console.error('Error in getAllFeedback:', error); return []; }
        }
        static async getFeedbackById(id) {
            try { return db.feedback.find(feedback => feedback.id === parseInt(id)); }
            catch (error) { console.error('Error in getFeedbackById:', error); return null; }
        }
        static async updateFeedbackStatus(id, status) {
            try {
                const feedbackIndex = db.feedback.findIndex(feedback => feedback.id === parseInt(id));
                if (feedbackIndex !== -1) { db.feedback[feedbackIndex].status = status; return { success: true, message: 'Feedback status updated successfully' }; }
                return { success: false, message: 'Feedback not found' };
            } catch (error) { throw error; }
        }
    },

    UserManagementModel: class {
        static async getInfluencers() {
            try {
                // Aggregate influencers with their social handles and analytics - include all influencers (verified and unverified)
                const influencers = await InfluencerInfo.aggregate([
                    {
                        $lookup: {
                            from: 'influencersocials',
                            localField: '_id',
                            foreignField: 'influencerId',
                            as: 'socials'
                        }
                    },
                    {
                        $lookup: {
                            from: 'influenceranalytics',
                            localField: '_id',
                            foreignField: 'influencerId',
                            as: 'analytics'
                        }
                    },
                    {
                        $addFields: {
                            social_handles: {
                                $map: {
                                    input: '$socials',
                                    as: 'social',
                                    in: '$$social.socialHandle'
                                }
                            },
                            audienceSize: {
                                $ifNull: [
                                    { $arrayElemAt: ['$analytics.totalFollowers', 0] },
                                    0
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            fullName: 1,
                            displayName: 1,
                            email: 1,
                            niche: 1,
                            categories: 1,
                            social_handles: 1,
                            verified: 1,
                            audienceSize: 1
                        }
                    }
                ]);
                return influencers;
            } catch (error) {
                console.error('Error fetching influencers:', error);
                return [];
            }
        }

        static async getBrands() {
            try {
                return await BrandInfo.find()
                    .select('brandName displayName email website categories industry verified totalAudience')
                    .lean();
            } catch (error) {
                console.error('Error fetching brands:', error);
                return [];
            }
        }

        static async approveUser(id, userType) {
            try {
                if (userType === 'influencer') {
                    const result = await InfluencerInfo.findByIdAndUpdate(id, { verified: true }, { new: true });
                    if (result) return { success: true, message: 'Influencer approved successfully' };
                } else if (userType === 'brand') {
                    const result = await BrandInfo.findByIdAndUpdate(id, { verified: true }, { new: true });
                    if (result) return { success: true, message: 'Brand approved successfully' };
                }
                return { success: false, message: 'User not found or invalid userType' };
            } catch (error) {
                console.error('Error approving user:', error);
                return { success: false, message: 'Error approving user' };
            }
        }

        static async getBrandById(id) {
            try {
                const brand = await BrandInfo.findById(id).lean();
                if (!brand) {
                    return null;
                }
                return brand;
            } catch (error) {
                console.error('Error fetching brand by ID:', error);
                return null;
            }
        }

        static async getInfluencerById(id) {
            try {
                const influencer = await InfluencerInfo.findById(id).lean();
                if (!influencer) {
                    return null;
                }
                return influencer;
            } catch (error) {
                console.error('Error fetching influencer by ID:', error);
                return null;
            }
        }
    },

    PaymentModel: class {
        static async getAllPayments() {
            try {
                const payments = await CampaignPayments.find()
                    .select('_id payment_date brand_id influencer_id amount status payment_method collab_type')
                    .populate('brand_id', 'brandName')
                    .populate('influencer_id', 'fullName displayName categories')
                    .lean();

                return payments.map(payment => ({
                    transactionId: payment._id,
                    date: payment.payment_date ? payment.payment_date.toISOString().split('T')[0] : '',
                    brand: payment.brand_id ? payment.brand_id.brandName : '',
                    influencer: payment.influencer_id ? (payment.influencer_id.displayName || payment.influencer_id.fullName || '') : '',
                    amount: payment.amount,
                    status: payment.status,
                    paymentMethod: payment.payment_method || 'N/A',
                    collabType: payment.collab_type || 'N/A',
                    influencerCategory: payment.influencer_id ? (payment.influencer_id.categories || []) : []
                }));
            } catch (error) {
                console.error('Error in getAllPayments:', error);
                return [];
            }
        }

        static async getPaymentById(id) {
            try {
                const payment = await CampaignPayments.findById(id)
                    .populate('brand_id', 'brandName')
                    .populate('influencer_id', 'fullName displayName categories')
                    .lean();

                if (!payment) return null;

                return {
                    transactionId: payment._id,
                    date: payment.payment_date ? payment.payment_date.toISOString().split('T')[0] : '',
                    brand: payment.brand_id ? payment.brand_id.brandName : '',
                    influencer: payment.influencer_id ? (payment.influencer_id.displayName || payment.influencer_id.fullName || '') : '',
                    amount: payment.amount,
                    status: payment.status,
                    paymentMethod: payment.payment_method || 'N/A',
                    collabType: payment.collab_type || 'N/A',
                    influencerCategory: payment.influencer_id ? (payment.influencer_id.categories || []) : []
                };
            } catch (error) {
                console.error('Error in getPaymentById:', error);
                return null;
            }
        }

        static async updatePaymentStatus(id, status) {
            try {
                const result = await CampaignPayments.findByIdAndUpdate(id, { status }, { new: true });
                if (result) {
                    return { success: true, message: 'Payment status updated successfully' };
                } else {
                    return { success: false, message: 'Payment not found' };
                }
            } catch (error) {
                console.error('Error in updatePaymentStatus:', error);
                throw error;
            }
        }
    },

    CollaborationModel: class {
        static async getAllCollaborations() {
            try {
                const campaigns = await CampaignInfo.find()
                    .select('brand_id title status start_date end_date')
                    .populate('brand_id', 'brandName')
                    .lean();

                const collaborations = await Promise.all(campaigns.map(async campaign => {
                    const influencers = await CampaignInfluencers.find({ campaign_id: campaign._id })
                        .select('influencer_id engagement_rate progress')
                        .populate('influencer_id', 'fullName displayName')
                        .lean();

                    // Calculate revenue
                    const revenueAgg = await CampaignPayments.aggregate([
                        { $match: { campaign_id: campaign._id, status: 'completed' } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ]);
                    const revenue = revenueAgg[0]?.total || 0;

                    return {
                        id: campaign._id,
                        title: campaign.title,
                        brand: campaign.brand_id ? campaign.brand_id.brandName : '',
                        status: campaign.status,
                        startDate: campaign.start_date,
                        endDate: campaign.end_date,
                        revenue: revenue,
                        influencers: influencers.map(inf => ({
                            influencer: inf.influencer_id ? (inf.influencer_id.displayName || inf.influencer_id.fullName || '') : '',
                            engagementRate: inf.engagement_rate,
                            reach: inf.progress
                        }))
                    };
                }));

                return collaborations;
            } catch (error) {
                console.error('Error fetching collaborations:', error);
                return [];
            }
        }

        static async getCollaborationById(id) {
            try {
                const campaign = await CampaignInfo.findById(id)
                    .select('brand_id status')
                    .populate('brand_id', 'brandName')
                    .lean();

                if (!campaign) return null;

                const influencers = await CampaignInfluencers.find({ campaign_id: id })
                    .select('influencer_id engagement_rate progress deliverables')
                    .populate('influencer_id', 'fullName displayName')
                    .lean();

                return {
                    id: campaign._id,
                    brand: campaign.brand_id ? campaign.brand_id.brandName : '',
                    status: campaign.status,
                    influencers: influencers.map(inf => ({
                        influencer: inf.influencer_id ? (inf.influencer_id.displayName || inf.influencer_id.fullName || '') : '',
                        engagementRate: inf.engagement_rate,
                        reach: inf.progress,
                        deliverables: inf.deliverables || []
                    }))
                };
            } catch (error) {
                console.error('Error fetching collaboration details:', error);
                return null;
            }
        }
    }
};

module.exports = { AdminModel };