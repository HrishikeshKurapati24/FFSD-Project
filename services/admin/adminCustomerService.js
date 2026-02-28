const { Customer } = require('../../models/CustomerMongo');
const { Product, Customer: ProductCustomer } = require('../../models/ProductMongo');
const { Order } = require('../../models/OrderMongo');

class adminCustomerService {
    static async getCustomerManagementData() {
        const totalCustomers = await Customer.countDocuments();
        const activeCustomers = await Customer.countDocuments({ status: 'active' });

        const revenueAgg = await Customer.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: "$total_spent" }, avgOrderValue: { $avg: "$total_spent" } } }
        ]);
        const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
        const avgOrderValue = revenueAgg[0]?.avgOrderValue || 0;

        const topCustomers = await Customer.find({})
            .sort({ total_spent: -1 })
            .limit(10)
            .lean();

        const recentCustomers = await Customer.find({})
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        const whaleThreshold = 1000;
        const whaleWindowDays = 30;
        const whaleWindowStart = new Date();
        whaleWindowStart.setDate(whaleWindowStart.getDate() - whaleWindowDays);

        const whales = await Customer.find({
            total_spent: { $gte: whaleThreshold },
            last_purchase_date: { $gte: whaleWindowStart }
        })
            .sort({ total_spent: -1 })
            .limit(20)
            .lean();

        const customerGrowthData = [];
        const customerGrowthLabels = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            customerGrowthLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));

            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            const count = await Customer.countDocuments({
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            });
            customerGrowthData.push(count);
        }

        const purchaseTrendsLabels = customerGrowthLabels;
        const purchaseTrendsData = customerGrowthData.map(count => Math.floor(count * 1.5));
        const revenueData = purchaseTrendsData.map(purchases => Math.floor(purchases * avgOrderValue));

        return {
            analytics: {
                totalCustomers,
                activeCustomers,
                totalRevenue,
                avgOrderValue,
                customerGrowth: {
                    labels: customerGrowthLabels,
                    data: customerGrowthData
                },
                purchaseTrends: {
                    labels: purchaseTrendsLabels,
                    purchases: purchaseTrendsData,
                    revenue: revenueData
                }
            },
            topCustomers,
            recentCustomers,
            whales
        };
    }

    static async getCustomerDetails(customerId) {
        const customer = await Customer.findById(customerId).lean();
        if (!customer) return null;

        const purchases = await ProductCustomer.find({ customer_id: customerId })
            .populate('product_id')
            .sort({ purchase_date: -1 })
            .limit(10)
            .lean();

        customer.purchaseHistory = purchases;
        return customer;
    }

    static async updateCustomerStatus(id, status, notes) {
        const updateData = {};
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.admin_notes = notes;
        updateData.updatedAt = Date.now();

        return await Customer.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }

    static async getCustomerAnalytics() {
        const totalCustomers = await Customer.countDocuments();
        const activeCustomers = await Customer.countDocuments({ status: 'active' });

        const revenueAgg = await Customer.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: "$total_spent" }, avgOrderValue: { $avg: "$total_spent" } } }
        ]);

        return {
            totalCustomers,
            activeCustomers,
            totalRevenue: revenueAgg[0]?.totalRevenue || 0,
            avgOrderValue: revenueAgg[0]?.avgOrderValue || 0
        };
    }

    static async getAllCustomers() {
        return await Customer.find({}).sort({ createdAt: -1 }).lean();
    }

    static async getCompletedOrders() {
        const orders = await Order.find({
            status: { $in: ['paid', 'shipped', 'delivered'] }
        })
            .sort({ createdAt: -1 })
            .populate('customer_id')
            .populate('items.product_id')
            .populate('influencer_id', 'fullName')
            .lean();

        const transformedOrders = orders.map(order => ({
            _id: order._id,
            orderId: order._id.toString().slice(-8).toUpperCase(),
            customerName: order.customer_id?.name || order.guest_info?.name || 'Guest',
            customerEmail: order.customer_id?.email || order.guest_info?.email || 'N/A',
            items: order.items.map(item => ({
                productName: item.product_id?.name || 'Unknown Product',
                quantity: item.quantity,
                price: item.price_at_purchase
            })),
            totalAmount: order.total_amount,
            status: order.status,
            date: order.createdAt,
            influencerName: order.influencer_id?.fullName || 'Direct'
        }));

        return {
            orders: transformedOrders,
            stats: {
                totalOrders: transformedOrders.length,
                totalRevenue: transformedOrders.reduce((sum, order) => sum + order.totalAmount, 0)
            }
        };
    }

    static async getProductAnalytics() {
        const productStats = await Order.aggregate([
            { $match: { status: { $in: ['paid', 'shipped', 'delivered'] } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product_id",
                    totalSold: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: "$items.subtotal" }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        const allProducts = await Product.find()
            .select('name images category brand_id campaign_price original_price status')
            .populate('brand_id', 'brandName')
            .lean();

        const statsMap = new Map();
        productStats.forEach(stat => {
            if (stat._id) statsMap.set(stat._id.toString(), stat);
        });

        const analyticsData = allProducts.map(product => {
            const stats = statsMap.get(product._id.toString()) || { totalSold: 0, totalRevenue: 0 };
            return {
                id: product._id,
                name: product.name,
                image: product.images && product.images[0] ? product.images[0].url : '/images/default-product.png',
                category: product.category || 'Uncategorized',
                brand: product.brand_id ? product.brand_id.brandName : 'Unknown Brand',
                price: product.campaign_price || product.original_price,
                status: product.status,
                totalSold: stats.totalSold,
                totalRevenue: stats.totalRevenue
            };
        });

        const topProducts = [...analyticsData].sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);

        return {
            totalProductsSold: analyticsData.reduce((sum, item) => sum + item.totalSold, 0),
            totalRevenueEarned: analyticsData.reduce((sum, item) => sum + item.totalRevenue, 0),
            products: analyticsData,
            topProducts
        };
    }
}

module.exports = adminCustomerService;
