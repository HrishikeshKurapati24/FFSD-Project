const fs = require('fs');

const svcPath = './services/brand/brandEcommerceService.js';

let svcC = `const { Order } = require('../../models/OrderMongo');
const { Product } = require('../../models/ProductMongo');
const { CampaignInfo } = require('../../models/CampaignMongo');
const notificationController = require('../../controllers/notificationController');

class brandEcommerceService {
    static async getBrandProducts(brandId) {
        const products = await Product.find({
            brand_id: brandId,
            status: { $in: ['active', 'inactive'] }
        })
            .populate('campaign_id', 'title status')
            .sort({ createdAt: -1 })
            .lean();

        return products.map(product => ({
            _id: product._id,
            name: product.name,
            description: product.description,
            images: product.images,
            original_price: product.original_price,
            campaign_price: product.campaign_price,
            discount_percentage: product.discount_percentage,
            category: product.category,
            tags: product.tags,
            target_quantity: product.target_quantity,
            sold_quantity: product.sold_quantity,
            status: product.status,
            campaign: product.campaign_id ? {
                title: product.campaign_id.title,
                status: product.campaign_id.status
            } : null,
            createdAt: product.createdAt
        }));
    }

    static async getBrandOrders(brandId) {
        const brandProducts = await Product.find({ brand_id: brandId }).select('_id').lean();
        const brandProductIds = brandProducts.map(p => p._id.toString());

        if (brandProductIds.length === 0) {
            return { activeOrders: [], completedOrders: [] };
        }

        const orders = await Order.find({
            'items.product_id': { $in: brandProductIds }
        })
            .sort({ createdAt: -1 })
            .populate('items.product_id', 'name images campaign_price campaign_id')
            .populate('customer_id', 'name email phone')
            .lean();

        const filteredOrders = orders.map(order => {
            const brandItems = order.items.filter(item =>
                item.product_id && brandProductIds.includes(item.product_id._id.toString())
            );

            return {
                ...order,
                items: brandItems,
                brand_total: brandItems.reduce((sum, item) => sum + (item.subtotal || 0), 0)
            };
        }).filter(order => order.items.length > 0);

        const activeOrders = filteredOrders.filter(order => ['paid', 'shipped'].includes(order.status));
        const completedOrders = filteredOrders.filter(order => ['delivered', 'cancelled'].includes(order.status));

        return { activeOrders, completedOrders };
    }

    static async updateOrderStatus(orderId, brandId, newStatus, notes) {
        const validStatuses = ['paid', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(newStatus)) {
            throw new Error('Invalid status');
        }

        const order = await Order.findById(orderId)
            .populate('items.product_id', 'brand_id')
            .populate('customer_id');

        if (!order) {
            throw new Error('Order not found');
        }

        const ownsProduct = order.items.some(item =>
            item.product_id && item.product_id.brand_id &&
            item.product_id.brand_id.toString() === brandId.toString()
        );

        if (!ownsProduct) {
            throw new Error('You do not have permission to update this order');
        }

        const validTransitions = {
            'paid': ['shipped', 'cancelled'],
            'shipped': ['delivered', 'cancelled'],
            'delivered': [],
            'cancelled': []
        };

        if (!validTransitions[order.status]?.includes(newStatus)) {
            throw new Error(\`Cannot transition from \${order.status} to \${newStatus}\`);
        }

        order.status = newStatus;
        order.status_history.push({
            status: newStatus,
            timestamp: new Date(),
            notes: notes || \`Status updated to \${newStatus}\`
        });

        await order.save();
        return order;
    }

    static async getOrderAnalytics(brandId) {
        const brandProducts = await Product.find({ brand_id: brandId }).select('_id');
        const productIds = brandProducts.map(p => p._id);

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const allTimeStats = await Order.aggregate([
            { $match: { 'items.product_id': { $in: productIds } } },
            { $group: { _id: null, totalRevenue: { $sum: '$total_amount' }, orderCount: { $sum: 1 } } }
        ]);

        const todayStats = await Order.aggregate([
            { $match: { 'items.product_id': { $in: productIds }, createdAt: { $gte: startOfToday } } },
            { $group: { _id: null, revenue: { $sum: '$total_amount' }, count: { $sum: 1 } } }
        ]);

        const monthStats = await Order.aggregate([
            { $match: { 'items.product_id': { $in: productIds }, createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, revenue: { $sum: '$total_amount' }, count: { $sum: 1 } } }
        ]);

        const statusBreakdown = await Order.aggregate([
            { $match: { 'items.product_id': { $in: productIds } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const topProducts = await Order.aggregate([
            { $match: { 'items.product_id': { $in: productIds } } },
            { $unwind: '$items' },
            { $match: { 'items.product_id': { $in: productIds } } },
            { $group: { _id: '$items.product_id', totalQuantity: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.subtotal' } } },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
            { $unwind: '$product' },
            { $project: { productId: '$_id', name: '$product.name', image: { $arrayElemAt: ['$product.images.url', 0] }, totalQuantity: 1, totalRevenue: 1 } }
        ]);

        const orderTrend = await Order.aggregate([
            { $match: { 'items.product_id': { $in: productIds }, createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$total_amount' } } },
            { $sort: { _id: 1 } }
        ]);

        const avgOrderValue = allTimeStats[0]?.totalRevenue && allTimeStats[0]?.orderCount
            ? allTimeStats[0].totalRevenue / allTimeStats[0].orderCount : 0;

        const statusBreakdownFormatted = { paid: 0, shipped: 0, delivered: 0, cancelled: 0 };
        statusBreakdown.forEach(item => { statusBreakdownFormatted[item._id] = item.count; });

        return {
            revenue: { allTime: allTimeStats[0]?.totalRevenue || 0, today: todayStats[0]?.revenue || 0, thisMonth: monthStats[0]?.revenue || 0 },
            orders: { total: allTimeStats[0]?.orderCount || 0, today: todayStats[0]?.count || 0, thisMonth: monthStats[0]?.count || 0 },
            avgOrderValue, statusBreakdown: statusBreakdownFormatted, topProducts, orderTrend
        };
    }

    static async checkCampaignCompletion(order) {
        if (!order || !order.items || order.items.length === 0) return;

        for (const item of order.items) {
            try {
                const productId = item.product_id._id || item.product_id;
                const product = await Product.findById(productId);

                if (!product || product.status === 'inactive' || product.target_quantity === 0) continue;

                const deliveryStats = await Order.aggregate([
                    { $match: { status: 'delivered', 'items.product_id': product._id } },
                    { $unwind: '$items' },
                    { $match: { 'items.product_id': product._id } },
                    { $group: { _id: null, totalDelivered: { $sum: '$items.quantity' } } }
                ]);

                const totalDelivered = deliveryStats[0]?.totalDelivered || 0;

                if (totalDelivered >= product.target_quantity) {
                    product.status = 'inactive';
                    await product.save();
                    console.log(\`[Phase 7] Product \${product.name} (\${product._id}) marked inactive (Target: \${product.target_quantity}, Delivered: \${totalDelivered})\`);

                    const campaignId = product.campaign_id;
                    const campaignProducts = await Product.find({ campaign_id: campaignId });

                    const allInactive = campaignProducts.every(p =>
                        p.status === 'inactive' || p.status === 'out_of_stock' || p.status === 'discontinued'
                    );

                    if (allInactive) {
                        const campaign = await CampaignInfo.findById(campaignId);
                        if (campaign && campaign.status === 'active') {
                            campaign.status = 'completed';
                            await campaign.save();
                            console.log(\`[Phase 7] Campaign \${campaign.title} (\${campaign._id}) marked completed as all products reached targets.\`);

                            try {
                                await notificationController.createNotification({
                                    recipientId: campaign.brand_id,
                                    recipientType: 'brand',
                                    type: 'campaign_completed',
                                    title: 'Campaign Completed',
                                    body: \`Your campaign "\${campaign.title}" has been automatically completed as all products reached their sales targets.\`,
                                    relatedId: campaign._id
                                });
                            } catch (notifErr) {
                                console.error('[Phase 7] Failed to create completion notification:', notifErr);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(\`[Phase 7] Error checking completion for item \${item.product_id}:\`, err);
            }
        }
    }
}

module.exports = brandEcommerceService;
`;

fs.writeFileSync(svcPath, svcC);
