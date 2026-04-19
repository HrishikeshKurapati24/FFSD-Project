const { InfluencerInfo } = require('../../models/InfluencerMongo');
const { BrandInfo } = require('../../models/BrandMongo');
const { CampaignInfo } = require('../../models/CampaignMongo');

class AdminSearchService {
    /**
     * Performs a unified search across multiple collections.
     * Returns categorized results for Brands, Influencers, and Campaigns.
     */
    static async globalSearch(query) {
        if (!query || query.length < 2) {
            return { brands: [], influencers: [], campaigns: [] };
        }

        const searchRegex = new RegExp(query, 'i');

        // Note: For extreme performance on millions of docs, 
        // we would use Atlas Search ($search) with Lucene indexes.
        // For current scale, $facet with indexed regex is highly efficient.
        
        const [brands, influencers, campaigns] = await Promise.all([
            BrandInfo.find({
                $or: [
                    { brandName: searchRegex },
                    { industry: searchRegex }
                ]
            }).limit(5).select('brandName logoUrl industry verified').lean(),

            InfluencerInfo.find({
                $or: [
                    { fullName: searchRegex },
                    { username: searchRegex },
                    { categories: { $in: [searchRegex] } }
                ]
            }).limit(5).select('fullName username profilePicUrl niche verified').lean(),

            CampaignInfo.find({
                title: searchRegex
            }).limit(5).select('title brandName status budget').lean()
        ]);

        return {
            brands,
            influencers,
            campaigns
        };
    }
}

module.exports = AdminSearchService;
