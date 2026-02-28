const fs = require('fs');

const svcPath = './services/brand/brandProfileService.js';
const ctrlPath = './controllers/brand/brandProfileController.js';

let svcC = '';
if(fs.existsSync(svcPath)) {
    svcC = fs.readFileSync(svcPath, 'utf8');
} else {
    svcC = `const { BrandInfo } = require('../../models/BrandMongo');
const { InfluencerInfo } = require('../../models/InfluencerMongo');
const { CampaignInfo, CampaignInfluencers } = require('../../models/CampaignMongo');

class brandProfileService {

}
module.exports = brandProfileService;
`;
}

// I will just use a node script to add some methods.
const methodsToAdd = `
    static async getExplorePageData(brandId, category, search) {
        const searchQuery = search || '';
        const selectedCategory = category || 'all';

        // Get all influencers
        let allInfluencers = [];
        try {
            allInfluencers = await InfluencerInfo.find({}).lean();
        } catch(e) { console.error(e); }

        const categoriesSet = new Set();
        allInfluencers.forEach(influencer => {
            if (influencer.categories && Array.isArray(influencer.categories)) {
                influencer.categories.forEach(cat => categoriesSet.add(cat.trim()));
            }
        });
        const categories = Array.from(categoriesSet).sort();

        let filteredInfluencers = allInfluencers;
        if (selectedCategory && selectedCategory !== 'all') {
            filteredInfluencers = filteredInfluencers.filter(influencer =>
                influencer.categories && influencer.categories.some(cat =>
                    cat.toLowerCase().includes(selectedCategory.toLowerCase())
                )
            );
        }

        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            filteredInfluencers = filteredInfluencers.filter(influencer =>
                (influencer.fullName && influencer.fullName.toLowerCase().includes(searchLower)) ||
                (influencer.username && influencer.username.toLowerCase().includes(searchLower)) ||
                (influencer.bio && influencer.bio.toLowerCase().includes(searchLower)) ||
                (influencer.categories && influencer.categories.some(cat =>
                    cat.toLowerCase().includes(searchLower)
                ))
            );
        }

        let influencersWithCollaboration = filteredInfluencers;

        if (brandId) {
            const collaborations = await CampaignInfluencers.find({
                campaign_id: {
                    $in: await CampaignInfo.find({ brand_id: brandId }).distinct('_id')
                },
                status: { $in: ['active', 'completed'] }
            }).populate('campaign_id', 'title').populate('influencer_id', '_id').lean();

            const collaborationMap = {};
            collaborations.forEach(collab => {
                if(!collab || !collab.influencer_id) return;
                const influencerId = collab.influencer_id._id.toString();
                if (!collaborationMap[influencerId]) {
                    collaborationMap[influencerId] = [];
                }
                collaborationMap[influencerId].push({
                    campaignTitle: collab.campaign_id ? collab.campaign_id.title : '',
                    revenue: collab.revenue || 0
                });
            });

            influencersWithCollaboration = filteredInfluencers.map(influencer => ({
                ...influencer,
                previousCollaborations: collaborationMap[influencer._id.toString()] || []
            }));

            const demoInfluencer = {
                _id: 'demo-rohan-joshi',
                fullName: 'Rohan Joshi',
                displayName: 'Rohan Joshi',
                profilePicUrl: '/images/default-profile.jpg',
                verified: true,
                categories: ['Comedy', 'Writing', 'Acting', 'Entertainment'],
                totalFollowers: 2200000,
                avgEngagementRate: 4.10,
                audienceDemographics: {
                    gender: 'Mixed',
                    ageRange: '20-40'
                },
                previousCollaborations: [
                    { campaignTitle: 'Summer Fashion Campaign', revenue: 25000 },
                    { campaignTitle: 'Tech Gadgets Review', revenue: 18000 }
                ]
            };

            influencersWithCollaboration = [demoInfluencer, ...influencersWithCollaboration];
        }

        return {
            influencers: influencersWithCollaboration,
            searchQuery,
            selectedCategory,
            categories
        };
    }
`;

svcC = svcC.replace(/}\s*module\.exports/, methodsToAdd + '\n}\nmodule.exports');
fs.writeFileSync(svcPath, svcC);

