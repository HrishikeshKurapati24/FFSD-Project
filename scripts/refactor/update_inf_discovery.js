const fs = require('fs');
const svcPath = './services/influencer/influencerDiscoveryService.js';

let svcC = `const { BrandInfo } = require('../../models/BrandMongo');
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

        const brands = await BrandInfo.find(filter)
            .select('brandName username logoUrl bannerUrl industry location website mission tagline verified completedCampaigns influencerPartnerships avgCampaignRating primaryMarket influenceRegions')
            .sort({ verified: -1, avgCampaignRating: -1, completedCampaigns: -1 })
            .limit(50)
            .lean();

        const allIndustries = await BrandInfo.distinct('industry', { status: 'active' });
        const categories = allIndustries.filter(Boolean);
        const uniqueCategories = [...new Set(categories)].sort();

        return { brands, categories: uniqueCategories };
    }
}

module.exports = InfluencerDiscoveryService;
`;

fs.writeFileSync(svcPath, svcC);
