const { BrandInfo } = require('../../models/BrandMongo');
const { InfluencerInfo } = require('../../models/InfluencerMongo');
const AdminDashboardService = require('./adminDashboardService');

class adminUserService {
    static BrandInfo = require("../../models/BrandMongo").BrandInfo;
    static InfluencerInfo = require("../../models/InfluencerMongo").InfluencerInfo;
    static async getInfluencers(search = '', page = 1, limit = 50) {
        try {
            const skip = (page - 1) * limit;
            const query = {};

            if (search) {
                const searchRegex = { $regex: search, $options: 'i' };
                query.$or = [
                    { fullName: searchRegex },
                    { displayName: searchRegex },
                    { email: searchRegex },
                    { username: searchRegex }
                ];
            }

            const influencers = await InfluencerInfo.aggregate([
                { $match: query },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
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
            ]).collation({ locale: 'en', strength: 2 });

            const totalDocs = await InfluencerInfo.countDocuments(query);

            return { influencers, totalDocs };
        } catch (error) {
            console.error('Error fetching influencers:', error);
            return { influencers: [], totalDocs: 0 };
        }
    }

    static async getBrands(search = '', page = 1, limit = 50) {
        try {
            const skip = (page - 1) * limit;
            const query = {};

            if (search) {
                const searchRegex = { $regex: search, $options: 'i' };
                query.$or = [
                    { brandName: searchRegex },
                    { displayName: searchRegex },
                    { email: searchRegex }
                ];
            }

            const brands = await BrandInfo.find(query)
                .select('brandName displayName email website categories industry verified totalAudience')
                .collation({ locale: 'en', strength: 2 })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const totalDocs = await BrandInfo.countDocuments(query);

            return { brands, totalDocs };
        } catch (error) {
            console.error('Error fetching brands:', error);
            return { brands: [], totalDocs: 0 };
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

    static async getVerifiedBrands() {
        return await this.BrandInfo.find({ verified: true }).lean();
    }

    static async getVerifiedInfluencers() {
        return await this.InfluencerInfo.aggregate([
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
                                        in: { $concatArrays: ['$value', ['$this.platform']] }
                                    }
                                }
                            },
                            in: {
                                $reduce: {
                                    input: '$platformList',
                                    initialValue: '',
                                    in: {
                                        $concat: [
                                            '$value',
                                            { $cond: [{ $eq: ['$value', ''] }, '', ', '] },
                                            '$this'
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    audienceSize: {
                        $reduce: {
                            input: { $ifNull: [{ $arrayElemAt: ['$socials.platforms', 0] }, []] },
                            initialValue: 0,
                            in: { $add: ['$value', { $ifNull: ['$this.followers', 0] }] }
                        }
                    }
                }
            }
        ]);
    }
    static async getUserManagementData(queryParams = {}) {
        try {
            const { search = '', page = 1, limit = 50 } = queryParams;

            const { influencers: influencersRaw, totalDocs: totalInfluencers } = await this.getInfluencers(search, parseInt(page), parseInt(limit));
            const { brands: brandsRaw, totalDocs: totalBrands } = await this.getBrands(search, parseInt(page), parseInt(limit));

            const influencers = influencersRaw.map(influencer => ({
                name: influencer.displayName || influencer.fullName || 'N/A',
                email: influencer.email || 'N/A',
                category: (influencer.categories && influencer.categories.length > 0) ? influencer.categories.join(', ') : (influencer.niche || 'N/A'),
                social_handles: (influencer.social_handles && influencer.social_handles.length > 0) ? influencer.social_handles.join(', ') : 'N/A',
                audienceSize: influencer.audienceSize || 0,
                _id: influencer._id || influencer.id || null,
                verified: influencer.verified || false,
                userType: 'influencer'
            }));

            const brands = brandsRaw.map(brand => ({
                name: brand.brandName || brand.displayName || 'N/A',
                email: brand.email || 'N/A',
                website: brand.website || 'N/A',
                industry: brand.industry || brand.businessCategory || brand.category || 'N/A',
                totalAudience: brand.totalAudience || 0,
                _id: brand._id || brand.id || null,
                verified: brand.verified || false,
                userType: 'brand'
            }));

            // --- Suspicious Activity Logic ---
            let suspiciousUsers = [];
            // ... suspicious users logic stays same for now as it's targeted ...
            try {
                const activity = await AdminDashboardService.checkSuspiciousActivity();

                if (activity.brands && activity.brands.length > 0) {
                    const sBrands = await BrandInfo.find({ _id: { $in: activity.brands } }).select('brandName email').lean();
                    suspiciousUsers.push(...sBrands.map(b => ({
                        _id: b._id,
                        name: b.brandName,
                        email: b.email,
                        userType: 'brand',
                        reason: 'High Campaign Creation Rate (Possible Spam)'
                    })));
                }

                if (activity.influencers && activity.influencers.length > 0) {
                    const sInfs = await InfluencerInfo.find({ _id: { $in: activity.influencers } }).select('displayName fullName email').lean();
                    suspiciousUsers.push(...sInfs.map(i => ({
                        _id: i._id,
                        name: i.displayName || i.fullName,
                        email: i.email,
                        userType: 'influencer',
                        reason: 'High Application Rate (Possible Bot)'
                    })));
                }
            } catch (err) {
                console.error("Error fetching suspicious activity in service:", err);
            }

            const flaggedContent = [
                {
                    _id: 'mock_flag_1',
                    contentId: 'camp_123',
                    contentType: 'Campaign',
                    reason: 'Inappropriate Title',
                    reportedBy: 'System AI',
                    status: 'Pending'
                }
            ];

            const userTypeRequests = [];
            const profileSuggestions = [];

            return {
                influencers,
                brands,
                flaggedContent,
                suspiciousUsers,
                userTypeRequests,
                profileSuggestions,
                meta: {
                    totalInfluencers,
                    totalBrands,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(Math.max(totalInfluencers, totalBrands) / limit)
                }
            };
        } catch (error) {
            console.error('Error in getUserManagementData service:', error);
            throw error;
        }
    }
}

module.exports = adminUserService;
