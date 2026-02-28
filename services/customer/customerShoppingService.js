const mongoose = require('mongoose');
const { Product, CampaignContent, Customer } = require('../../models/ProductMongo');
const { CampaignInfo, CampaignMetrics, CampaignPayments, CampaignInfluencers } = require('../../models/CampaignMongo');
const { BrandInfo, BrandSocials } = require('../../models/BrandMongo');
const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('../../models/InfluencerMongo');
const { Order } = require('../../models/OrderMongo');
const { sendOrderStatusEmail } = require('../../utils/emailService');
const brandProfileService = require('../brand/brandProfileService');

class CustomerShoppingService {
    static async getAllCampaignsData() {
        const campaigns = await CampaignInfo.find({
            status: 'active',
            $or: [
                { end_date: { $gte: new Date() } },
                { end_date: { $exists: false } },
                { end_date: null }
            ]
        }).populate('brand_id', 'brandName logoUrl').sort({ createdAt: -1 }).lean();

        // Fetch participating influencers per campaign (active/completed)
        const campaignIds = campaigns.map(c => c._id);
        const participation = await CampaignInfluencers.find({
            campaign_id: { $in: campaignIds },
            status: { $in: ['active', 'completed'] }
        }).populate('influencer_id', 'fullName displayName profilePicUrl').lean();

        const map = new Map();
        participation.forEach(p => {
            const key = p.campaign_id.toString();
            if (!map.has(key)) map.set(key, []);
            if (p.influencer_id) {
                map.get(key).push({
                    id: p.influencer_id._id,
                    name: p.influencer_id.displayName || p.influencer_id.fullName,
                    profilePicUrl: p.influencer_id.profilePicUrl || '/images/default-avatar.jpg'
                });
            }
        });

        const campaignsWithInfluencers = campaigns.map(c => ({
            ...c,
            influencers: map.get(c._id.toString()) || []
        }));

        return {
            campaigns: campaignsWithInfluencers,
            title: 'All Active Campaigns'
        };
    }

    static roundTo3(n) {
        const num = Number(n) || 0;
        return Math.round((num + Number.EPSILON) * 1000) / 1000;
    }

    static async getProductDetailsData(productId) {
        const product = await Product.findById(productId)
            .populate('brand_id', 'brandName logoUrl')
            .populate('campaign_id', 'title status')
            .lean();

        if (!product) throw new Error('Product not found');
        if (product.status && product.status !== 'active') throw new Error('Product is not available');
        if (!product.campaign_id || product.campaign_id.status !== 'active') throw new Error('Campaign is not active');

        const images = Array.isArray(product.images) ? product.images : [];
        const primary = images.find(i => i && i.is_primary && i.url) || images[0] || null;

        return {
            _id: product._id,
            name: product.name,
            description: product.description,
            brand: product.brand_id,
            campaign: product.campaign_id,
            images,
            primaryImageUrl: primary ? primary.url : null,
            original_price: product.original_price,
            campaign_price: product.campaign_price,
            discount_percentage: product.discount_percentage || 0,
            category: product.category,
            stock_quantity: product.sold_quantity !== undefined && product.target_quantity !== undefined
                ? Math.max(0, (product.target_quantity - product.sold_quantity))
                : (product.stock_quantity || 0),
            is_digital: product.is_digital,
            delivery_info: product.delivery_info || {}
        };
    }

    static async getCampaignShoppingPageData(campaignId) {
        const campaign = await CampaignInfo.findById(campaignId)
            .populate('brand_id', 'brandName logoUrl')
            .lean();

        if (!campaign) throw new Error('Campaign not found');
        if (campaign.status !== 'active') throw new Error('Campaign is not active');

        const collabsWithInfluencers = await CampaignInfluencers.find({ campaign_id: campaignId })
            .populate('influencer_id', 'fullName displayName profilePicUrl')
            .lean();

        const content = [];
        collabsWithInfluencers.forEach(collab => {
            if (collab.deliverables && Array.isArray(collab.deliverables)) {
                collab.deliverables.forEach(d => {
                    if (d.status === 'published') {
                        content.push({
                            ...d,
                            influencer_id: collab.influencer_id,
                            _id: d._id || d.id
                        });
                    }
                });
            }
        });

        const products = await Product.find({ campaign_id: campaignId, status: 'active' })
            .populate('brand_id', 'brandName logoUrl')
            .select('name description images original_price campaign_price discount_percentage category tags target_quantity sold_quantity is_digital delivery_info specifications status special_instructions created_at updated_at')
            .lean();

        return {
            campaign: {
                id: campaign._id,
                title: campaign.title,
                description: campaign.description,
                brand: campaign.brand_id,
                start_date: campaign.start_date,
                end_date: campaign.end_date
            },
            content,
            products,
            title: `${campaign.title} - Shopping`,
            subtitle: `Shop ${campaign.brand_id?.brandName || 'Brand'} products`
        };
    }

    static async getCartPageData(sessionCart) {
        const cart = Array.isArray(sessionCart) ? sessionCart : [];
        const productIds = cart.map(item => item.productId);
        const products = productIds.length ? await Product.find({ _id: { $in: productIds } }).lean() : [];
        const productsMap = new Map(products.map(p => [p._id.toString(), p]));

        const items = cart.map(item => {
            const p = productsMap.get(item.productId);
            const unitPrice = p?.campaign_price || 0;
            return {
                productId: item.productId,
                quantity: item.quantity,
                name: p?.name || 'Product',
                image: (p?.images && p.images[0]?.url) || '/images/default-product.jpg',
                unitPrice: CustomerShoppingService.roundTo3(unitPrice),
                lineTotal: CustomerShoppingService.roundTo3(unitPrice * item.quantity)
            };
        });

        const subtotal = CustomerShoppingService.roundTo3(items.reduce((s, i) => s + i.lineTotal, 0));
        const shipping = CustomerShoppingService.roundTo3(subtotal * 0.05);
        const total = CustomerShoppingService.roundTo3(subtotal + shipping);

        return { items, subtotal, shipping, total, title: 'Your Cart' };
    }

    static async addToCartLogic(sessionCart, productId, quantity) {
        const trimmedProductId = productId.toString().trim();
        const product = await Product.findById(trimmedProductId)
            .select('status stock_quantity target_quantity sold_quantity')
            .lean();

        if (!product || product.status !== 'active') throw new Error('Product unavailable');

        const qty = Math.max(1, parseInt(quantity));
        const availableStock = (product.target_quantity != null && product.sold_quantity != null)
            ? Math.max(0, product.target_quantity - product.sold_quantity)
            : (product.stock_quantity || 0);

        if (!Array.isArray(sessionCart)) sessionCart = [];
        const existing = sessionCart.find(i => i.productId === trimmedProductId);
        const existingQty = existing ? existing.quantity : 0;
        const remainingStock = Math.max(0, availableStock - existingQty);

        if (qty > remainingStock) throw new Error(`Insufficient stock. Only ${remainingStock} left`);

        if (existing) existing.quantity += qty;
        else sessionCart.push({ productId: trimmedProductId, quantity: qty });

        return sessionCart;
    }

    static async checkoutCartLogic(sessionCart, customerInfo, referralCode, authenticatedCustomerId) {
        if (sessionCart.length === 0) throw new Error('Cart is empty');

        const name = customerInfo?.name?.trim();
        const email = customerInfo?.email?.trim();
        const phone = customerInfo?.phone?.trim();
        if (!email || !name) throw new Error('Customer name and email are required');

        let subtotal = 0;
        let maxDeliveryDays = 0;

        for (const line of sessionCart) {
            const trimmedProductId = line.productId.toString().trim();
            const product = await Product.findById(trimmedProductId).populate('campaign_id', 'status').lean();
            if (!product || product.status !== 'active' || product.campaign_id?.status !== 'active') {
                throw new Error('One or more products unavailable');
            }
            const availableStock = (product.target_quantity != null && product.sold_quantity != null)
                ? Math.max(0, product.target_quantity - product.sold_quantity)
                : (product.stock_quantity || 0);
            if (availableStock < line.quantity) throw new Error('Insufficient stock for some items');

            subtotal += (product.campaign_price || 0) * line.quantity;
            const est = product?.delivery_info?.estimated_days;
            if (Number.isFinite(est)) maxDeliveryDays = Math.max(maxDeliveryDays, est);
        }

        subtotal = CustomerShoppingService.roundTo3(subtotal);
        const shipping = CustomerShoppingService.roundTo3(subtotal * 0.05);
        const grandTotal = CustomerShoppingService.roundTo3(subtotal + shipping);
        const mockPaymentId = new mongoose.Types.ObjectId().toString();

        for (const line of sessionCart) {
            const product = await Product.findById(line.productId.toString().trim());
            if (product) {
                if (product.target_quantity != null && product.sold_quantity != null) {
                    product.sold_quantity += line.quantity;
                } else if (product.stock_quantity != null) {
                    product.stock_quantity -= line.quantity;
                }
                await product.save();
            }
        }

        const updateFields = {
            $set: {
                name: name || undefined,
                phone: phone || undefined,
                last_purchase_date: new Date(),
                ...(authenticatedCustomerId && { customer_id: authenticatedCustomerId })
            },
            $inc: {
                total_purchases: sessionCart.reduce((s, i) => s + i.quantity, 0),
                total_spent: grandTotal
            }
        };

        await Customer.findOneAndUpdate({ email }, updateFields, { upsert: true, new: true });

        let attributedInfluencer = null;
        let finalReferralCode = referralCode;

        if (referralCode) {
            attributedInfluencer = await InfluencerInfo.findOne({ referralCode: referralCode.toUpperCase() });
            if (attributedInfluencer && authenticatedCustomerId) {
                if (attributedInfluencer._id.toString() === authenticatedCustomerId.toString()) {
                    attributedInfluencer = null;
                    finalReferralCode = undefined;
                }
            }
        }

        const newOrder = new Order({
            customer_id: authenticatedCustomerId || null,
            guest_info: !authenticatedCustomerId ? { name, email, phone } : undefined,
            items: sessionCart.map(item => ({ product_id: item.productId, quantity: item.quantity, price_at_purchase: 0, subtotal: 0 })),
            total_amount: grandTotal,
            shipping_cost: shipping,
            status: 'paid',
            payment_id: mockPaymentId,
            shipping_address: { name, address_line1: customerInfo?.address || '', address_line2: '', city: '', state: '', zip_code: '', country: '' },
            referral_code: attributedInfluencer ? finalReferralCode : undefined,
            influencer_id: attributedInfluencer ? attributedInfluencer._id : undefined,
            commission_amount: 0,
            attribution_status: attributedInfluencer ? 'pending' : 'pending',
            status_history: [{ status: 'paid', timestamp: new Date(), notes: 'Order placed and payment received' }],
            estimated_delivery_date: maxDeliveryDays > 0 ? new Date(Date.now() + maxDeliveryDays * 24 * 60 * 60 * 1000) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        });

        const productIds = sessionCart.map(i => i.productId);
        const productsForAttribution = await Product.find({ _id: { $in: productIds } }).populate('campaign_id').lean();
        const productMap = new Map(productsForAttribution.map(p => [p._id.toString(), p]));

        const campaignStatsUpdate = new Map();
        let totalCommission = 0;
        const orderItems = [];

        for (const line of sessionCart) {
            const p = productMap.get(line.productId.toString());
            if (p) {
                const lineTotal = (p.campaign_price || 0) * line.quantity;
                orderItems.push({ product_id: p._id, quantity: line.quantity, price_at_purchase: p.campaign_price, subtotal: lineTotal });

                if (p.campaign_id) {
                    const campId = p.campaign_id._id.toString();
                    const rate = p.campaign_id.commissionRate || 0;

                    if (!campaignStatsUpdate.has(campId)) {
                        campaignStatsUpdate.set(campId, { revenue: 0, commission: 0, doc: p.campaign_id });
                    }
                    const stat = campaignStatsUpdate.get(campId);
                    stat.revenue += lineTotal;

                    if (attributedInfluencer) {
                        const itemCommission = lineTotal * (rate / 100);
                        stat.commission += itemCommission;
                        totalCommission += itemCommission;
                    }
                }
            }
        }

        newOrder.items = orderItems;
        newOrder.commission_amount = CustomerShoppingService.roundTo3(totalCommission);
        await newOrder.save();

        for (const [campId, stats] of campaignStatsUpdate) {
            await CampaignMetrics.findOneAndUpdate(
                { campaign_id: campId },
                { $inc: { revenue: stats.revenue } },
                { upsert: true }
            );

            if (attributedInfluencer) {
                await CampaignInfluencers.findOneAndUpdate(
                    { campaign_id: campId, influencer_id: attributedInfluencer._id },
                    {
                        $inc: { revenue: stats.revenue, commission_earned: stats.commission, conversions: 1 },
                        $setOnInsert: { status: 'active', progress: 0, engagement_rate: 0, reach: 0, clicks: 0, timeliness_score: 100 }
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            }
        }

        try {
            const customerData = newOrder.customer_id ? await Customer.findById(newOrder.customer_id).select('name email') : newOrder.guest_info;
            await sendOrderStatusEmail(newOrder, customerData, 'paid');
        } catch (emailError) { }

        const deliveryDays = maxDeliveryDays || 5;
        return {
            message: `Payment completed successfully! Order will be delivered in ${deliveryDays} days.`,
            payment_id: mockPaymentId,
            amount: grandTotal
        };
    }

    static async getBrandProfileForCustomer(brandId) {
        const brand = await BrandInfo.findById(brandId).lean();
        if (!brand) throw new Error('Brand profile not found');

        const socialStats = await brandProfileService.getSocialStats(brandId);
        const topCampaigns = await brandProfileService.getTopCampaigns(brandId);

        const transformed = brandProfileService.transformBrandProfile(brand, socialStats, topCampaigns);

        // Normalize currentCampaigns field for frontend expectations
        const metricsBasedCampaigns = Array.isArray(topCampaigns)
            ? topCampaigns.map(c => ({ id: c.id || c._id, title: c.title, status: c.status || c.state || 'active' }))
            : [];

        const activeCampaigns = await CampaignInfo.find({
            brand_id: brandId,
            status: 'active'
        }).select('_id title status').lean();

        const existingIds = new Set(metricsBasedCampaigns.map(c => String(c.id)));
        const additionalCampaigns = (activeCampaigns || [])
            .filter(c => !existingIds.has(String(c._id)))
            .map(c => ({ id: c._id, title: c.title, status: c.status }));

        transformed.currentCampaigns = [...metricsBasedCampaigns, ...additionalCampaigns];
        return transformed;
    }

    static async getInfluencerProfileForCustomer(influencerId) {
        // We can reuse some logic from an influencer service if it existed, but let's implement for now
        const influencer = await InfluencerInfo.findById(influencerId).lean();
        if (!influencer) throw new Error('Influencer profile not found');

        const [socials, analytics] = await Promise.all([
            InfluencerSocials.findOne({ influencerId }).lean(),
            InfluencerAnalytics.findOne({ influencerId }).lean()
        ]);

        const currentCampaignsDocs = await CampaignInfluencers.find({
            influencer_id: influencerId,
            status: { $in: ['active', 'completed'] }
        }).populate({ path: 'campaign_id', select: 'title status' }).lean();

        const current = (currentCampaignsDocs || []).map(ci => ({
            id: ci.campaign_id?._id || ci.campaign_id,
            title: ci.campaign_id?.title,
            status: ci.campaign_id?.status
        }));

        const campaignIds = current.map(c => c.id).filter(Boolean);
        let promotedProducts = [];
        if (campaignIds.length > 0) {
            const products = await Product.find({ campaign_id: { $in: campaignIds }, status: 'active' }).lean();
            promotedProducts = products.map(p => ({
                id: p._id,
                title: p.name,
                price: p.campaign_price || p.original_price || 0
            }));
        }

        return {
            ...influencer,
            socials,
            analytics,
            currentCampaigns: current,
            promotedProducts
        };
    }
}

module.exports = CustomerShoppingService;
