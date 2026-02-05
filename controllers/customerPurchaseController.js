const { Product, CampaignContent, ContentTracking, Customer } = require('../config/ProductMongo');
const { CampaignInfo, CampaignMetrics, CampaignPayments } = require('../config/CampaignMongo');
const { BrandInfo } = require('../config/BrandMongo');
const { InfluencerInfo } = require('../config/InfluencerMongo');
const mongoose = require('mongoose');

class CustomerPurchaseController {

    // Helper to round numbers to 3 decimals
    static roundTo3(n) {
        const num = Number(n) || 0;
        return Math.round((num + Number.EPSILON) * 1000) / 1000;
    }

    /**
     * Get product details for purchase
     */
    static async getProductDetails(req, res) {
        try {
            const { productId } = req.params;

            const product = await Product.findById(productId)
                .populate('brand_id', 'brandName logoUrl')
                .populate('campaign_id', 'title status')
                .lean();

            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            if (product.status && product.status !== 'active') {
                return res.status(403).json({ success: false, message: 'Product is not available' });
            }

            if (!product.campaign_id || product.campaign_id.status !== 'active') {
                return res.status(403).json({ success: false, message: 'Campaign is not active' });
            }

            // Normalize images and choose primary
            const images = Array.isArray(product.images) ? product.images : [];
            const primary = images.find(i => i && i.is_primary && i.url) || images[0] || null;

            const normalized = {
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

            return res.json({ success: true, product: normalized });

        } catch (error) {
            console.error('Error fetching product details:', error);
            return res.status(500).json({ success: false, message: 'Error fetching product details' });
        }
    }

    /**
     * Get campaign shopping page for customers
     */
    static async getCampaignShoppingPage(req, res) {
        try {
            const { campaignId } = req.params;
            console.log('[Customer] getCampaignShoppingPage → campaignId:', campaignId);

            // 1) Campaign info (must be active)
            const campaign = await CampaignInfo.findById(campaignId)
                .populate('brand_id', 'brandName logoUrl')
                .lean();

            console.log('[Customer] Campaign fetched:', campaign ? {
                id: campaign._id,
                title: campaign.title,
                status: campaign.status,
                brand: campaign.brand_id && campaign.brand_id.brandName
            } : 'null');

            if (!campaign) {
                return res.status(404).json({
                    message: 'Campaign not found'
                });
            }

            if (campaign.status !== 'active') {
                return res.status(403).json({
                    message: 'Campaign is not active'
                });
            }

            // 2) Published content for the campaign with products populated
            const content = await CampaignContent.find({
                campaign_id: campaignId,
                status: 'published'
            })
                .populate('influencer_id', 'fullName profilePicUrl')
                .populate('attached_products.product_id')
                .sort({ published_at: -1 })
                .lean();

            console.log('[Customer] Published content count:', content.length);
            if (content.length) {
                const attachedProductCounts = content.map(c => (c.attached_products || []).length);
                console.log('[Customer] Attached products per content:', attachedProductCounts);
            }

            // 3) All active products tied to the campaign with all relevant fields
            const products = await Product.find({
                campaign_id: campaignId,
                status: 'active'
            })
                .populate('brand_id', 'brandName logoUrl')
                .select('name description images original_price campaign_price discount_percentage category tags target_quantity sold_quantity is_digital delivery_info specifications status special_instructions created_at updated_at')
                .lean();

            console.log('[Customer] Active products for campaign:', products.length);
            if (products.length) {
                console.log('[Customer] Sample product names:', products.slice(0, 5).map(p => p.name));
            }

            // 4) Render shopping page
            console.log('[Customer] Rendering campaign-shopping with:', {
                contentCount: content.length,
                productsCount: products.length
            });

            const responsePayload = {
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
                subtitle: `Shop ${campaign.brand_id.brandName} products`
            };

            // If this is an API/React request, return JSON
            const isAPIRequest =
                req.xhr ||
                (req.headers.accept && req.headers.accept.includes('application/json'));

            if (isAPIRequest) {
                return res.json(responsePayload);
            }

            // Otherwise render the original EJS view for server-rendered pages
            return res.render('customer/campaign-shopping', responsePayload);
        } catch (error) {
            console.error('[Customer] Error fetching campaign shopping page:', error);
            return res.status(500).json({
                message: 'Error loading campaign page',
                error: process.env.NODE_ENV === 'development' ? error : {}
            });
        }
    }
    /**
     * CART: render cart page from session
     */
    static async getCartPage(req, res) {
        try {
            const cart = Array.isArray(req.session?.cart) ? req.session.cart : [];

            // hydrate products
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
                    unitPrice: CustomerPurchaseController.roundTo3(unitPrice),
                    lineTotal: CustomerPurchaseController.roundTo3(unitPrice * item.quantity)
                };
            });

            const subtotalRaw = items.reduce((s, i) => s + i.lineTotal, 0);
            const subtotal = CustomerPurchaseController.roundTo3(subtotalRaw);
            const shipping = CustomerPurchaseController.roundTo3(subtotal * 0.05); // 5% shipping fee
            const total = CustomerPurchaseController.roundTo3(subtotal + shipping);

            return res.json({ items, subtotal, shipping, total, title: 'Your Cart' });
        } catch (error) {
            console.error('Error rendering cart:', error);
            return res.status(500).json({ message: 'Error loading cart', error: process.env.NODE_ENV === 'development' ? error : {} });
        }
    }

    /**
     * CART: add item
     */
    static async addToCart(req, res) {
        try {
            const { productId, quantity = 1 } = req.body;
            if (!productId) return res.status(400).json({ success: false, message: 'productId required' });

            // Trim any whitespace from productId to prevent ObjectId casting errors
            const trimmedProductId = productId.toString().trim();

            const product = await Product.findById(trimmedProductId)
                .select('status stock_quantity target_quantity sold_quantity')
                .lean();
            if (!product || product.status !== 'active') {
                return res.status(400).json({ success: false, message: 'Product unavailable' });
            }

            const qty = Math.max(1, parseInt(quantity));

            // Compute available stock as target_quantity - sold_quantity, fallback to stock_quantity
            const availableStock = (product.target_quantity != null && product.sold_quantity != null)
                ? Math.max(0, product.target_quantity - product.sold_quantity)
                : (product.stock_quantity || 0);

            // Include existing quantity already in cart for this product
            if (!Array.isArray(req.session.cart)) req.session.cart = [];
            const existing = req.session.cart.find(i => i.productId === trimmedProductId);
            const existingQty = existing ? existing.quantity : 0;
            const remainingStock = Math.max(0, availableStock - existingQty);

            if (qty > remainingStock) {
                return res.status(400).json({ success: false, message: `Insufficient stock. Only ${remainingStock} left` });
            }

            if (existing) existing.quantity += qty; else req.session.cart.push({ productId: trimmedProductId, quantity: qty });

            return res.json({ success: true, message: 'Added to cart', cartCount: req.session.cart.reduce((s, i) => s + i.quantity, 0) });
        } catch (error) {
            console.error('Error adding to cart:', error);
            return res.status(500).json({ success: false, message: 'Error adding to cart' });
        }
    }

    /**
     * CART: remove item
     */
    static async removeFromCart(req, res) {
        try {
            const { productId } = req.body;
            if (!productId) return res.status(400).json({ success: false, message: 'productId required' });

            // Trim any whitespace from productId
            const trimmedProductId = productId.toString().trim();
            req.session.cart = (req.session.cart || []).filter(i => i.productId !== trimmedProductId);
            return res.json({ success: true, message: 'Removed from cart' });
        } catch (error) {
            console.error('Error removing from cart:', error);
            return res.status(500).json({ success: false, message: 'Error removing from cart' });
        }
    }

    /**
     * CART: checkout and mock payment
     */
    static async checkoutCart(req, res) {
        try {
            const { customerInfo, paymentInfo, cart: cartFromBody } = req.body;
            // Use cart from request body (context) if provided, otherwise fall back to session
            const cart = Array.isArray(cartFromBody) && cartFromBody.length > 0
                ? cartFromBody
                : (Array.isArray(req.session?.cart) ? req.session.cart : []);
            if (cart.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty' });

            // Validate minimal customer info
            const name = customerInfo?.name?.trim();
            const email = customerInfo?.email?.trim();
            const phone = customerInfo?.phone?.trim();
            if (!email || !name) {
                return res.status(400).json({ success: false, message: 'Customer name and email are required' });
            }

            // Calculate totals and validate stock using target/sold quantities
            let subtotal = 0;
            let maxDeliveryDays = 0;
            for (const line of cart) {
                // Trim productId to handle any whitespace issues
                const trimmedProductId = line.productId.toString().trim();
                const product = await Product.findById(trimmedProductId).populate('campaign_id', 'status').lean();
                if (!product || product.status !== 'active' || product.campaign_id?.status !== 'active') {
                    return res.status(400).json({ success: false, message: 'One or more products unavailable' });
                }
                const availableStock = (product.target_quantity != null && product.sold_quantity != null)
                    ? Math.max(0, product.target_quantity - product.sold_quantity)
                    : (product.stock_quantity || 0);
                if (availableStock < line.quantity) {
                    return res.status(400).json({ success: false, message: 'Insufficient stock for some items' });
                }
                subtotal += (product.campaign_price || 0) * line.quantity;
                const est = product?.delivery_info?.estimated_days;
                if (Number.isFinite(est)) maxDeliveryDays = Math.max(maxDeliveryDays, est);
            }

            subtotal = CustomerPurchaseController.roundTo3(subtotal);
            const shipping = CustomerPurchaseController.roundTo3(subtotal * 0.05);
            const grandTotal = CustomerPurchaseController.roundTo3(subtotal + shipping);

            // Simulate payment success
            const mockPaymentId = new mongoose.Types.ObjectId().toString();

            // Decrement stock and track purchases
            for (const line of cart) {
                const trimmedProductId = line.productId.toString().trim();
                const product = await Product.findById(trimmedProductId);
                if (product) {
                    if (product.target_quantity != null && product.sold_quantity != null) {
                        product.sold_quantity += line.quantity;
                    } else if (product.stock_quantity != null) {
                        product.stock_quantity -= line.quantity;
                    }
                    await product.save();
                }
                // Skipping ContentTracking with required content_id to avoid validation error
            }

            // Check if user is authenticated to link customer_id
            const authenticatedCustomerId = (req.session?.user?.userType === 'customer' && req.session?.user?.id)
                ? req.session.user.id
                : (req.user?.userType === 'customer' && req.user?.id ? req.user.id : null);

            // Upsert customer record (ProductCustomer model)
            const updateFields = {
                $set: {
                    name: name || undefined,
                    phone: phone || undefined,
                    last_purchase_date: new Date(),
                    ...(authenticatedCustomerId && { customer_id: authenticatedCustomerId })
                },
                $inc: {
                    total_purchases: cart.reduce((s, i) => s + i.quantity, 0),
                    total_spent: grandTotal
                }
            };

            await Customer.findOneAndUpdate(
                { email },
                updateFields,
                { upsert: true, new: true }
            );

            // Clear cart
            req.session.cart = [];

            const deliveryDays = maxDeliveryDays || 5;
            return res.json({ success: true, message: `Payment completed successfully! Order will be delivered in ${deliveryDays} days.`, payment_id: mockPaymentId, amount: grandTotal });
        } catch (error) {
            console.error('Error during checkout:', error);
            return res.status(500).json({ success: false, message: 'Checkout failed' });
        }
    }

    /**
     * Rankings page
     */
    static async getRankingsPage(req, res) {
        try {
            const { brandCategory = 'revenue', influencerCategory = 'totalFollowers' } = req.query;

            // 1) BRAND RANKINGS
            // Revenue via CampaignMetrics aggregation
            const revenueAgg = await CampaignInfo.aggregate([
                { $lookup: { from: 'campaignmetrics', localField: '_id', foreignField: 'campaign_id', as: 'metrics' } },
                { $unwind: { path: '$metrics', preserveNullAndEmptyArrays: true } },
                { $group: { _id: '$brand_id', revenue: { $sum: { $ifNull: ['$metrics.revenue', 0] } } } }
            ]);
            const brandIdSet = new Set(revenueAgg.map(r => r._id.toString()));
            // Also include brands that may have zero revenue to allow sorting by other metrics
            const allBrands = await BrandInfo.find({}).select('brandName logoUrl completedCampaigns avgCampaignRating description industry website location categories mission tagline bannerUrl verified').lean();
            allBrands.forEach(b => brandIdSet.add(b._id.toString()));
            const ids = Array.from(brandIdSet);

            const brandsMap = new Map(allBrands.map(b => [b._id.toString(), b]));
            const revenueMap = new Map(revenueAgg.map(r => [r._id.toString(), r.revenue || 0]));

            // Engagement rate and rating from BrandAnalytics (avgEngagementRate, rating)
            const { BrandAnalytics } = require('../config/BrandMongo');
            const analytics = await BrandAnalytics.find({ brandId: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } }).select('brandId avgEngagementRate rating').lean();
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
                    // Additional brand details
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

            // Sort brands
            const brandSortKey = ['revenue', 'engagement_rate', 'rating', 'completedCampaigns'].includes(brandCategory) ? brandCategory : 'revenue';
            brandRankings.sort((a, b) => (b[brandSortKey] || 0) - (a[brandSortKey] || 0));
            brandRankings = brandRankings.slice(0, 20);

            // 2) INFLUENCER RANKINGS
            const { InfluencerAnalytics, InfluencerSocials } = require('../config/InfluencerMongo');
            const infInfos = await InfluencerInfo.find({}).select('fullName profilePicUrl completedCollabs niche bio website location displayName bannerUrl').lean();
            const infIds = infInfos.map(i => i._id.toString());
            const infAnalytics = await InfluencerAnalytics.find({ influencerId: { $in: infIds.map(id => new mongoose.Types.ObjectId(id)) } })
                .select('influencerId totalFollowers avgEngagementRate').lean();
            const followersMap = new Map(infAnalytics.map(a => [a.influencerId.toString(), a.totalFollowers || 0]));
            const infEngMap = new Map(infAnalytics.map(a => [a.influencerId.toString(), a.avgEngagementRate || 0]));

            const socials = await InfluencerSocials.find({ influencerId: { $in: infIds.map(id => new mongoose.Types.ObjectId(id)) } }).select('influencerId platforms').lean();
            const platformCountMap = new Map(socials.map(s => [s.influencerId.toString(), Array.isArray(s.platforms) ? s.platforms.length : 0]));
            const socialsMap = new Map(socials.map(s => [s.influencerId.toString(), Array.isArray(s.platforms) ? s.platforms : []]));

            // Gather top 5 promoted products per influencer via recent published CampaignContent
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
                    // avoid duplicates by product id
                    if (!arr.find(x => x._id && x._id.toString() === p._id.toString())) {
                        const stock = (p.target_quantity != null && p.sold_quantity != null)
                            ? Math.max(0, p.target_quantity - p.sold_quantity)
                            : 0;
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

            return res.json({
                brandRankings,
                influencerRankings,
                brandCategory: brandSortKey,
                influencerCategory: infSortKey,
                title: 'Rankings'
            });
        } catch (error) {
            console.error('Error rendering rankings:', error);
            return res.status(500).json({ message: 'Error loading rankings', error: process.env.NODE_ENV === 'development' ? error : {} });
        }
    }
}

module.exports = CustomerPurchaseController;