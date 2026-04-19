const { CampaignInfo, CampaignInfluencers, CampaignPayments } = require('../../models/CampaignMongo');

class adminCollaborationService {
    static async getAllCollaborations(queryParams = {}) {
        try {
            const { search = '', status = 'all', page = 1, limit = 12 } = queryParams;
            const skip = (parseInt(page) - 1) * parseInt(limit);
            
            const matchQuery = {};
            if (status !== 'all') matchQuery.status = status;
            
            if (search) {
                const searchRegex = { $regex: search, $options: 'i' };
                matchQuery.$or = [
                    { title: searchRegex },
                    { 'brandInfo.brandName': searchRegex } // Will handle this after lookup or use $lookup with inner match
                ];
            }

            const pipeline = [
                { $match: matchQuery },
                { $sort: { createdAt: -1 } },
                {
                    $lookup: {
                        from: 'brandinfos',
                        localField: 'brand_id',
                        foreignField: '_id',
                        as: 'brandInfo'
                    }
                },
                { $unwind: { path: '$brandInfo', preserveNullAndEmptyArrays: true } },
                // Final search filter if searching by brand name
                {
                    $match: search ? {
                        $or: [
                            { title: { $regex: search, $options: 'i' } },
                            { 'brandInfo.brandName': { $regex: search, $options: 'i' } }
                        ]
                    } : {}
                },
                {
                    $lookup: {
                        from: 'campaigninfluencers',
                        localField: '_id',
                        foreignField: 'campaign_id',
                        as: 'influencerDocs'
                    }
                },
                {
                    $lookup: {
                        from: 'campaignpayments',
                        localField: '_id',
                        foreignField: 'campaign_id',
                        as: 'paymentDocs'
                    }
                },
                {
                    $facet: {
                        metadata: [{ $count: "total" }],
                        data: [
                            { $skip: skip },
                            { $limit: parseInt(limit) },
                            {
                                $lookup: {
                                    from: 'influencerinfos',
                                    localField: 'influencerDocs.influencer_id',
                                    foreignField: '_id',
                                    as: 'influencerProfiles'
                                }
                            },
                            {
                                $addFields: {
                                    revenue: {
                                        $sum: {
                                            $map: {
                                                input: {
                                                    $filter: {
                                                        input: "$paymentDocs",
                                                        as: "p",
                                                        cond: { $eq: ["$$p.status", "completed"] }
                                                    }
                                                },
                                                as: "item",
                                                in: "$$item.amount"
                                            }
                                        }
                                    },
                                    influencers: {
                                        $map: {
                                            input: "$influencerDocs",
                                            as: "inf",
                                            in: {
                                                engagementRate: "$$inf.engagement_rate",
                                                reach: "$$inf.progress",
                                                influencer: {
                                                    $let: {
                                                        vars: {
                                                            prof: {
                                                                $arrayElemAt: [
                                                                    {
                                                                        $filter: {
                                                                            input: "$influencerProfiles",
                                                                            as: "p",
                                                                            cond: { $eq: ["$$p._id", "$$inf.influencer_id"] }
                                                                        }
                                                                    },
                                                                    0
                                                                ]
                                                            }
                                                        },
                                                        in: { $ifNull: ["$$prof.displayName", { $ifNull: ["$$prof.fullName", "Unknown"] }] }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                $project: {
                                    id: "$_id",
                                    title: 1,
                                    brand: "$brandInfo.brandName",
                                    status: 1,
                                    startDate: "$start_date",
                                    endDate: "$end_date",
                                    revenue: 1,
                                    influencers: 1
                                }
                            }
                        ]
                    }
                }
            ];

            const result = await CampaignInfo.aggregate(pipeline).collation({ locale: 'en', strength: 2 });
            const collaborations = result[0].data;
            const totalDocs = result[0].metadata[0]?.total || 0;

            return {
                collaborations,
                meta: {
                    totalDocs,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalDocs / limit)
                }
            };
        } catch (error) {
            console.error('Error fetching collaborations:', error);
            return { collaborations: [], meta: { totalDocs: 0, currentPage: 1, totalPages: 0 } };
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

module.exports = adminCollaborationService;
