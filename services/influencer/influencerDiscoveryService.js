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

    static async getBrandProfileData(brandId) {
        if (!brandId) throw new Error('Brand ID is required');

        const brandProfileService = require('../brand/brandProfileService');
        const brand = await brandProfileService.getBrandById(brandId);

        if (!brand) throw new Error('Brand not found');

        const socialStats = await brandProfileService.getSocialStats(brandId);
        const topCampaigns = await brandProfileService.getTopCampaigns(brandId);
        const previousCollaborations = await brandProfileService.getPreviousCollaborations(brandId);
        const currentPartnerships = await brandProfileService.getCurrentPartnerships(brandId);

        return {
            ...brand.toObject ? brand.toObject() : brand,
            name: brand.displayName || brand.name,
            username: brand.username,
            description: brand.bio,
            logoUrl: brand.logoUrl,
            bannerUrl: brand.bannerUrl,
            verified: brand.verified,
            primaryMarket: brand.location,
            values: brand.values || [],
            mission: brand.mission || brand.bio,
            currentCampaign: brand.currentCampaign || '',
            socialLinks: socialStats.map(stat => ({
                platform: stat.platform,
                url: `https://${stat.platform}.com/${brand.username}`,
                followers: stat.followers
            })),
            totalAudience: socialStats.reduce((sum, stat) => sum + stat.followers, 0),
            website: brand.website || `https://${brand.username}.com`,
            targetAgeRange: brand.targetAgeRange,
            targetGender: brand.targetGender,
            completedCampaigns: topCampaigns.length,
            influencerPartnerships: Math.round(topCampaigns.length * 2.5),
            avgCampaignRating: brand.rating || 4.5,
            topCampaigns: topCampaigns.map(campaign => ({
                id: campaign.id,
                title: campaign.title,
                status: campaign.status || 'Active',
                performance_score: campaign.performance_score || 0,
                reach: campaign.reach || 0
            })),
            previousCollaborations,
            currentPartnerships
        };
    }

}

module.exports = InfluencerDiscoveryService;
