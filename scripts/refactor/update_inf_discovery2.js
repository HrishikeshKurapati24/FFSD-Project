const fs = require('fs');
const svcPath = './services/influencer/influencerDiscoveryService.js';
let svcC = fs.readFileSync(svcPath, 'utf8');

const additionalMethods = `
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
                url: \`https://\${stat.platform}.com/\${brand.username}\`,
                followers: stat.followers
            })),
            totalAudience: socialStats.reduce((sum, stat) => sum + stat.followers, 0),
            website: brand.website || \`https://\${brand.username}.com\`,
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
`;

svcC = svcC.replace(/}\s*module\.exports = InfluencerDiscoveryService;/, additionalMethods + '\n}\n\nmodule.exports = InfluencerDiscoveryService;');
fs.writeFileSync(svcPath, svcC);

