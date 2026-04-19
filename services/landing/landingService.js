const bcrypt = require('bcrypt');
const { BrandInfo, BrandSocials, BrandAnalytics } = require('../../models/BrandMongo');
const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('../../models/InfluencerMongo');
const AdminRealtimeEmitter = require('../admin/AdminRealtimeEmitter');

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
            completedCampaigns: brand.performance_metrics?.totalCampaigns || 0,
            influencerPartnerships: brand.performance_metrics?.activeCampaigns || 0,
            categories: brand.categories || ['General'],
            avgCampaignRating: brand.performance_metrics?.avgROI || 0,
            totalFollowers: brand.performance_metrics?.totalReach || 0,
            avgEngagementRate: brand.performance_metrics?.totalImpressions || 0
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
            avgRating: influencer.analytics_snapshot?.avgRating || 0,
            completedCollabs: influencer.completedCollabs || 0,
            categories: influencer.categories || ['General'],
            socialPlatforms: influencer.socialProfiles?.map(s => s.platform) || [],
            totalFollowers: influencer.analytics_snapshot?.totalFollowers || 0,
            avgEngagementRate: influencer.analytics_snapshot?.avgEngagementRate || 0
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
            primaryMarket: 'Global',
            // High-Performance Embedding
            socialProfiles: [],
            performance_metrics: {
                totalCampaigns: 0,
                activeCampaigns: 0,
                totalSpend: 0,
                totalRevenue: 0,
                avgROI: 0
            }
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

        // Emit real-time notification for admin
        AdminRealtimeEmitter.emitNotification({
            type: 'user_registration',
            title: 'New Brand Registered',
            message: `${brandName} has just joined the platform.`
        });

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
            primaryMarket: 'Global',
            // High-Performance Embedding
            socialProfiles: [{
                platform: platform,
                handle: socialHandle,
                followers: audience || 0,
                lastUpdated: new Date()
            }],
            analytics_snapshot: {
                totalFollowers: audience || 0,
                avgEngagementRate: 0,
                monthlyEarnings: 0,
                avgRating: 0
            }
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

        // Emit real-time notification for admin
        AdminRealtimeEmitter.emitNotification({
            type: 'user_registration',
            title: 'New Influencer Registered',
            message: `${fullName} has just joined the platform.`
        });

        return influencer._id;
    }
}

module.exports = LandingService;