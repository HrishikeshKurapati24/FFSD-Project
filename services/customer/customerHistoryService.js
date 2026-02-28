const mongoose = require('mongoose');
const { Product, CampaignContent } = require('../../models/ProductMongo');
const { CampaignInfo, CampaignInfluencers } = require('../../models/CampaignMongo');
const { BrandInfo } = require('../../models/BrandMongo');
const { InfluencerInfo } = require('../../models/InfluencerMongo');
const { Order } = require('../../models/OrderMongo');

class CustomerHistoryService {
    static async getOrderHistoryData(userId) {
        if (!userId) throw new Error('Unauthorized');

        const orders = await Order.find({ customer_id: userId })
            .sort({ created_at: -1 })
            .populate('items.product_id', 'name images campaign_price')
            .populate('influencer_id', 'displayName fullName')
            .lean();

        const influencerIds = new Set();
        const productIds = new Set();

        orders.forEach(order => {
            if (order.influencer_id) {
                influencerIds.add(order.influencer_id._id ? order.influencer_id._id.toString() : order.influencer_id.toString());
            }
            if (Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if (item.product_id) {
                        productIds.add(item.product_id._id ? item.product_id._id.toString() : item.product_id.toString());
                    }
                });
            }
        });

        const products = await Product.find({ _id: { $in: Array.from(productIds) } })
            .select('brand_id campaign_id')
            .lean();

        const brandIds = new Set(
            products.map(p => (p.brand_id ? p.brand_id.toString() : null)).filter(Boolean)
        );

        const purchasedBrands = await BrandInfo.find({ _id: { $in: Array.from(brandIds) } })
            .select('brandName logoUrl industry website')
            .lean();

        const campaignIds = new Set(
            products.map(p => (p.campaign_id ? p.campaign_id.toString() : null)).filter(Boolean)
        );

        if (campaignIds.size > 0) {
            const campaignInfluencerDocs = await CampaignInfluencers.find({
                campaign_id: { $in: Array.from(campaignIds) },
                status: { $in: ['active', 'completed'] }
            }).select('influencer_id').lean();

            campaignInfluencerDocs.forEach(ci => {
                if (ci.influencer_id) influencerIds.add(ci.influencer_id.toString());
            });
        }

        const purchasedInfluencers = influencerIds.size
            ? await InfluencerInfo.find({ _id: { $in: Array.from(influencerIds) } })
                .select('displayName fullName profilePicUrl niche')
                .lean()
            : [];

        const currentOrders = orders.filter(order => ['paid', 'shipped'].includes(order.status));
        const previousOrders = orders.filter(order => ['delivered', 'cancelled'].includes(order.status));

        return {
            title: 'My Orders & History',
            orders,
            currentOrders,
            previousOrders,
            purchasedInfluencers,
            purchasedBrands
        };
    }

    static async getRankingsPageData(brandCategory = 'revenue', influencerCategory = 'totalFollowers') {
        // Brands Rankings
        const revenueAgg = await CampaignInfo.aggregate([
            { $lookup: { from: 'campaignmetrics', localField: '_id', foreignField: 'campaign_id', as: 'metrics' } },
            { $unwind: { path: '$metrics', preserveNullAndEmptyArrays: true } },
            { $group: { _id: '$brand_id', revenue: { $sum: { $ifNull: ['$metrics.revenue', 0] } } } }
        ]);

        const brandIdSet = new Set(revenueAgg.map(r => r._id.toString()));
        const allBrands = await BrandInfo.find({}).select('brandName logoUrl completedCampaigns avgCampaignRating description industry website location categories mission tagline bannerUrl verified').lean();

        allBrands.forEach(b => brandIdSet.add(b._id.toString()));
        const ids = Array.from(brandIdSet);

        const brandsMap = new Map(allBrands.map(b => [b._id.toString(), b]));
        const revenueMap = new Map(revenueAgg.map(r => [r._id.toString(), r.revenue || 0]));

        const { BrandAnalytics } = require('../../models/BrandMongo');
        const analytics = await BrandAnalytics.find({ brandId: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } })
            .select('brandId avgEngagementRate rating').lean();

        const engRateMap = new Map(analytics.map(a => [a.brandId.toString(), a.avgEngagementRate || 0]));
        const ratingMap = new Map(analytics.map(a => [a.brandId.toString(), a.rating || 0]));

        let brandRankings = ids.map(id => {
            const info = brandsMap.get(id) || {};
            return {
                id,
                name: info.brandName || 'Brand',
                logoUrl: info.logoUrl,
                bannerUrl: info.bannerUrl || null,
                revenue: revenueMap.get(id) || 0,
                engagement_rate: engRateMap.get(id) || 0,
                rating: (info.avgCampaignRating != null ? info.avgCampaignRating : (ratingMap.get(id) || 0)),
                completedCampaigns: info.completedCampaigns || 0,
                description: info.description || '',
                industry: info.industry || '',
                website: info.website || '',
                location: info.location || '',
                categories: Array.isArray(info.categories) ? info.categories : [],
                mission: info.mission || '',
                tagline: info.tagline || '',
                verified: !!info.verified
            };
        });

        const brandSortKey = ['revenue', 'engagement_rate', 'rating', 'completedCampaigns'].includes(brandCategory) ? brandCategory : 'revenue';
        brandRankings.sort((a, b) => (b[brandSortKey] || 0) - (a[brandSortKey] || 0));
        brandRankings = brandRankings.slice(0, 20);

        // Influencers Rankings
        const { InfluencerAnalytics, InfluencerSocials } = require('../../models/InfluencerMongo');
        const infInfos = await InfluencerInfo.find({}).select('fullName profilePicUrl completedCollabs niche bio website location displayName bannerUrl').lean();
        const infIds = infInfos.map(i => i._id.toString());

        const infAnalytics = await InfluencerAnalytics.find({ influencerId: { $in: infIds.map(id => new mongoose.Types.ObjectId(id)) } })
            .select('influencerId totalFollowers avgEngagementRate').lean();

        const followersMap = new Map(infAnalytics.map(a => [a.influencerId.toString(), a.totalFollowers || 0]));
        const infEngMap = new Map(infAnalytics.map(a => [a.influencerId.toString(), a.avgEngagementRate || 0]));

        const socials = await InfluencerSocials.find({ influencerId: { $in: infIds.map(id => new mongoose.Types.ObjectId(id)) } }).select('influencerId platforms').lean();
        const platformCountMap = new Map(socials.map(s => [s.influencerId.toString(), Array.isArray(s.platforms) ? s.platforms.length : 0]));
        const socialsMap = new Map(socials.map(s => [s.influencerId.toString(), Array.isArray(s.platforms) ? s.platforms : []]));

        const recentContents = await CampaignContent.find({ influencer_id: { $in: infIds.map(id => new mongoose.Types.ObjectId(id)) }, status: 'published' })
            .populate('attached_products.product_id', 'name description images original_price campaign_price discount_percentage category tags is_digital target_quantity sold_quantity delivery_info specifications')
            .sort({ published_at: -1 })
            .limit(300)
            .lean();

        const topProductsMap = new Map();
        for (const c of recentContents) {
            const infId = c.influencer_id && c.influencer_id.toString();
            if (!infId) continue;
            if (!topProductsMap.has(infId)) topProductsMap.set(infId, []);
            const arr = topProductsMap.get(infId);
            const attached = Array.isArray(c.attached_products) ? c.attached_products : [];
            for (const ap of attached) {
                const p = ap.product_id;
                if (!p || !p._id) continue;
                if (!arr.find(x => x._id && x._id.toString() === p._id.toString())) {
                    const stock = (p.target_quantity != null && p.sold_quantity != null)
                        ? Math.max(0, p.target_quantity - p.sold_quantity) : 0;
                    arr.push({
                        _id: p._id,
                        name: p.name || '',
                        description: p.description || '',
                        image: (p.images && p.images[0] && p.images[0].url) || null,
                        original_price: p.original_price || 0,
                        campaign_price: p.campaign_price || 0,
                        discount_percentage: p.discount_percentage || 0,
                        category: p.category || '',
                        tags: Array.isArray(p.tags) ? p.tags : [],
                        is_digital: !!p.is_digital,
                        stock_available: stock,
                        estimated_delivery_days: (p.delivery_info && p.delivery_info.estimated_days) || null,
                        specifications: p.specifications || {}
                    });
                    if (arr.length >= 5) break;
                }
            }
        }

        let influencerRankings = infInfos.map(i => {
            const id = i._id.toString();
            return {
                id,
                name: i.fullName || 'Influencer',
                displayName: i.displayName || '',
                profilePicUrl: i.profilePicUrl,
                bannerUrl: i.bannerUrl || null,
                niche: i.niche || '',
                bio: i.bio || '',
                website: i.website || '',
                location: i.location || '',
                totalFollowers: followersMap.get(id) || 0,
                engagement_rate: infEngMap.get(id) || 0,
                platform_count: platformCountMap.get(id) || 0,
                socials: socialsMap.get(id) || [],
                topProducts: topProductsMap.get(id) || []
            };
        });

        const infSortKey = ['totalFollowers', 'engagement_rate', 'platform_count', 'completedCampaigns'].includes(influencerCategory) ? influencerCategory : 'totalFollowers';
        influencerRankings.sort((a, b) => (b[infSortKey] || 0) - (a[infSortKey] || 0));
        influencerRankings = influencerRankings.slice(0, 20);

        return {
            brandRankings,
            influencerRankings,
            brandCategory: brandSortKey,
            influencerCategory: infSortKey,
            title: 'Rankings'
        };
    }
}

module.exports = CustomerHistoryService;
