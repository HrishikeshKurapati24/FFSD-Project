const { Order } = require('../../models/OrderMongo');

class adminOrderService {
    static async getOrderAnalytics(queryData) {
        const { startDate, endDate } = queryData;

        // Calculate default date ranges
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Base match for custom date range if provided
        const dateMatch = {};
        if (startDate || endDate) {
            dateMatch.createdAt = {};
            if (startDate) dateMatch.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateMatch.createdAt.$lte = end;
            }
        }

        // Total platform revenue and order count
        const allTimeStats = await Order.aggregate([
            { $match: dateMatch },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total_amount' },
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        // Today's stats
        const todayStats = await Order.aggregate([
            { $match: { createdAt: { $gte: startOfToday } } },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$total_amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // This month's stats
        const monthStats = await Order.aggregate([
            { $match: { createdAt: { $gte: startOfMonth } } },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$total_amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Orders per brand ranking
        const ordersPerBrand = await Order.aggregate([
            { $match: dateMatch },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.brand_id',
                    orderCount: { $sum: 1 },
                    totalRevenue: { $sum: '$total_amount' }
                }
            },
            { $sort: { orderCount: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'brandinfos',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'brand'
                }
            },
            { $unwind: '$brand' },
            {
                $project: {
                    brandId: '$_id',
                    brandName: '$brand.brandName',
                    orderCount: 1,
                    totalRevenue: 1
                }
            }
        ]);

        // Fulfillment rate
        const fulfillmentStats = await Order.aggregate([
            { $match: dateMatch },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    deliveredOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                    }
                }
            }
        ]);

        const fulfillmentRate = fulfillmentStats[0]?.totalOrders > 0
            ? (fulfillmentStats[0].deliveredOrders / fulfillmentStats[0].totalOrders) * 100
            : 0;

        // Status breakdown
        const statusBreakdown = await Order.aggregate([
            { $match: dateMatch },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusBreakdownFormatted = {
            paid: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
        };
        statusBreakdown.forEach(item => {
            statusBreakdownFormatted[item._id] = item.count;
        });

        return {
            revenue: {
                total: allTimeStats[0]?.totalRevenue || 0,
                today: todayStats[0]?.revenue || 0,
                thisMonth: monthStats[0]?.revenue || 0
            },
            orders: {
                total: allTimeStats[0]?.orderCount || 0,
                today: todayStats[0]?.count || 0,
                thisMonth: monthStats[0]?.count || 0
            },
            fulfillmentRate: fulfillmentRate,
            statusBreakdown: statusBreakdownFormatted,
            ordersPerBrand: ordersPerBrand
        };
    }

    static async getAllOrders(queryData) {
        const { status, searchTerm } = queryData;
        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('customer_id', 'name email phone')
            .populate('items.product_id', 'name brand_id')
            .populate('influencer_id', 'username')
            .sort({ createdAt: -1 });

        let filteredOrders = orders;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredOrders = orders.filter(o =>
                o._id.toString().toLowerCase().includes(term) ||
                (o.customer_id && o.customer_id.name?.toLowerCase().includes(term)) ||
                (o.customer_id && o.customer_id.email?.toLowerCase().includes(term)) ||
                (o.guest_info && o.guest_info.name?.toLowerCase().includes(term)) ||
                (o.guest_info && o.guest_info.email?.toLowerCase().includes(term)) ||
                (o.tracking_number && o.tracking_number.toLowerCase().includes(term))
            );
        }

        return filteredOrders;
    }
}

module.exports = adminOrderService;
