const bcrypt = require('bcrypt');
const { BrandInfo, BrandSocials, BrandAnalytics } = require('../../models/BrandMongo');
const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('../../models/InfluencerMongo');

class LandingService {
    /**
     * Fetch active brands for landing page display
     * @param {string} status - Optional filter for brand status
     * @returns {Array} List of formatted brand objects
     */
    static async fetchActiveBrands(status) {
        if (status && !['active', 'inactive', 'pending'].includes(status)) {
            const error = new Error(`Invalid status parameter: ${status}. Must be 'active', 'inactive', or 'pending'`);
            error.statusCode = 500;
            throw error;
        }

        // Try getting active brands first
        let brands = await BrandInfo.find(status ? { status } : { status: 'active' })
            .select('brandName industry logoUrl completedCampaigns influencerPartnerships categories avgCampaignRating')
            .lean();

        // Fallback to all brands if no matching status
        if (!brands || brands.length === 0) {
            brands = await BrandInfo.find({})
                .select('brandName industry logoUrl completedCampaigns influencerPartnerships categories avgCampaignRating')
                .lean();
        }

        if (!brands || brands.length === 0) {
            const error = new Error('No brands found in database');
            error.statusCode = 404;
            throw error;
        }

        return brands.map(brand => ({
            _id: brand._id,
            brandName: brand.brandName,
            industry: brand.industry,
            logoUrl: brand.logoUrl,
            completedCampaigns: brand.completedCampaigns || 0,
            influencerPartnerships: brand.influencerPartnerships || 0,
            categories: brand.categories || ['General'],
            avgCampaignRating: brand.avgCampaignRating || 0,
            totalFollowers: 0, // Simplified for now
            avgEngagementRate: 0 // Simplified for now
        }));
    }

    /**
     * Fetch active influencers for landing page display
     * @param {string} status - Optional filter for influencer status 
     * @returns {Array} List of formatted influencer objects
     */
    static async fetchActiveInfluencers(status) {
        if (status && !['active', 'inactive', 'pending'].includes(status)) {
            const error = new Error(`Invalid status parameter: ${status}. Must be 'active', 'inactive', or 'pending'`);
            error.statusCode = 500;
            throw error;
        }

        // Try getting active influencers first
        let influencers = await InfluencerInfo.find(status ? { status } : { status: 'active' })
            .select('fullName niche profilePicUrl avgRating completedCollabs categories')
            .lean();

        // Fallback to all influencers if no matching status
        if (!influencers || influencers.length === 0) {
            influencers = await InfluencerInfo.find({})
                .select('fullName niche profilePicUrl avgRating completedCollabs categories')
                .lean();
        }

        if (!influencers || influencers.length === 0) {
            const error = new Error('No influencers found in database');
            error.statusCode = 404;
            throw error;
        }

        return influencers.map(influencer => ({
            _id: influencer._id,
            fullName: influencer.fullName,
            niche: influencer.niche,
            profilePicUrl: influencer.profilePicUrl,
            avgRating: influencer.avgRating || 0,
            completedCollabs: influencer.completedCollabs || 0,
            categories: influencer.categories || ['General'],
            socialPlatforms: ['instagram', 'youtube'], // Simplified for now
            totalFollowers: Math.floor(Math.random() * 1000000) + 10000, // Random for demo
            avgEngagementRate: Math.floor(Math.random() * 10) + 3 // Random for demo
        }));
    }

    /**
     * Register a new brand
     * @param {Object} brandData 
     * @returns {string} newly created brand ID
     */
    static async registerBrand(brandData) {
        const { brandName, email, password, industry, website, phone, totalAudience } = brandData;

        const existingBrand = await BrandInfo.findOne({ email });
        if (existingBrand) {
            const error = new Error('Email already exists');
            error.statusCode = 400;
            throw error;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;

        const brand = new BrandInfo({
            brandName,
            email,
            password: hashedPassword,
            industry,
            website,
            budget: 0,
            totalAudience: totalAudience ? parseInt(totalAudience) : 0,
            phone,
            status: 'active',
            verified: false,
            username: username,
            displayName: brandName,
            influenceRegions: 'Global',
            primaryMarket: 'Global'
        });

        const brandSocials = new BrandSocials({
            brandId: brand._id,
            platforms: []
        });

        const brandAnalytics = new BrandAnalytics({
            brandId: brand._id,
            totalFollowers: 0,
            avgEngagementRate: 0,
            monthlyEarnings: 0,
            earningsChange: 0,
            rating: 0
        });

        await Promise.all([
            brand.save(),
            brandSocials.save(),
            brandAnalytics.save()
        ]);

        return brand._id;
    }

    /**
     * Register a new influencer
     * @param {Object} influencerData 
     * @returns {string} newly created influencer ID
     */
    static async registerInfluencer(influencerData) {
        const { fullName, email, password, platform, socialHandle, audience, niche, phone } = influencerData;

        const validPlatforms = ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'linkedin'];
        if (!platform || !validPlatforms.includes(platform)) {
            const error = new Error('Please select a valid social media platform');
            error.statusCode = 400;
            throw error;
        }

        const existingInfluencer = await InfluencerInfo.findOne({ email });
        if (existingInfluencer) {
            const error = new Error('Email already exists');
            error.statusCode = 400;
            throw error;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;

        const influencer = new InfluencerInfo({
            fullName,
            email,
            password: hashedPassword,
            phone,
            niche,
            username: username,
            displayName: fullName,
            verified: false,
            status: 'active',
            influenceRegions: 'Global',
            primaryMarket: 'Global'
        });

        const influencerSocials = new InfluencerSocials({
            influencerId: influencer._id,
            socialHandle,
            platforms: [{
                platform: platform,
                handle: socialHandle,
                followers: audience || 0
            }]
        });

        const influencerAnalytics = new InfluencerAnalytics({
            influencerId: influencer._id,
            totalFollowers: audience || 0,
            avgEngagementRate: 0,
            monthlyEarnings: 0,
            earningsChange: 0,
            rating: 0
        });

        await Promise.all([
            influencer.save(),
            influencerSocials.save(),
            influencerAnalytics.save()
        ]);

        return influencer._id;
    }
}

module.exports = LandingService;
