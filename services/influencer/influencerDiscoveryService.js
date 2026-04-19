const { BrandInfo } = require('../../models/BrandMongo');
const { CampaignInfluencers, CampaignPayments, CampaignInfo, CampaignMetrics } = require('../../models/CampaignMongo');
const { Product } = require('../../models/ProductMongo');
const influencerProfileService = require('./influencerProfileService');
const mongoose = require('mongoose');

class InfluencerDiscoveryService {
    static async getInfluencersForExploreData() {
        return await influencerProfileService.getAllInfluencers();
    }

    static async getBrandExploreData(category, search) {
        let filter = { status: 'active' };

        if (category && category !== 'all') {
            filter.industry = { $regex: category, $options: 'i' };
        }

        if (search) {
            filter.$or = [
                { brandName: { $regex: search, $options: 'i' } },
                { industry: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        let brands = [];
        try {
            const ElasticsearchService = require('../search/elasticsearchService');
            const esResults = await ElasticsearchService.search('brands', search, {
                industry: category && category !== 'all' ? category : undefined
            }, 0, 50);

            if (esResults.hits.length > 0) {
                const brandIds = esResults.hits.map(h => h._id);
                brands = await BrandInfo.find({ _id: { $in: brandIds } })
                    .select('brandName username logoUrl bannerUrl industry location website mission tagline verified completedCampaigns influencerPartnerships avgCampaignRating primaryMarket influenceRegions')
                    .lean();

                // Sort by ES relevance
                brands.sort((a, b) => {
                    return brandIds.indexOf(a._id.toString()) - brandIds.indexOf(b._id.toString());
                });
            }
        } catch (error) {
            console.error('Error in Elasticsearch brand search, falling back to MongoDB:', error);
            brands = await BrandInfo.find(filter)
                .select('brandName username logoUrl bannerUrl industry location website mission tagline verified completedCampaigns influencerPartnerships avgCampaignRating primaryMarket influenceRegions')
                .collation({ locale: 'en', strength: 2 })
                .sort({ verified: -1, avgCampaignRating: -1, completedCampaigns: -1 })
                .limit(50)
                .lean();
        }

        const allIndustries = await BrandInfo.distinct('industry', { status: 'active' });
        const categories = allIndustries.filter(Boolean);
        const uniqueCategories = [...new Set(categories)].sort();

        return { brands, categories: uniqueCategories };
    }

    static async getBrandProfileData(brandId) {
        if (!brandId) throw new Error('Brand ID is required');

        const brandProfileService = require('../brand/brandProfileService');
        const brand = await brandProfileService.getBrandById(brandId);

        if (!brand) throw new Error('Brand not found');

        const [socialStats, topCampaigns, previousCollaborations, currentPartnerships] = await Promise.all([
            brandProfileService.getSocialStats(brandId),
            brandProfileService.getTopCampaigns(brandId),
            brandProfileService.getPreviousCollaborations(brandId),
            brandProfileService.getCurrentPartnerships(brandId)
        ]);

        // Use shared transformBrandProfile which correctly maps:
        //   totalFollowers  (from socialStats sum)       -> BrandProfileHeader.brand.totalFollowers
        //   avgEngagementRate (from BrandSocials avg)    -> BrandProfileHeader.brand.avgEngagementRate
        //   completedCollabs  (= topCampaigns.length)    -> BrandProfileHeader.brand.completedCollabs
        //   rating            (= avgCampaignRating)      -> BrandProfileHeader.brand.rating
        const transformed = brandProfileService.transformBrandProfile(brand, socialStats, topCampaigns);

        return {
            ...transformed,
            previousCollaborations,
            currentPartnerships
        };
    }

}

module.exports = InfluencerDiscoveryService;
