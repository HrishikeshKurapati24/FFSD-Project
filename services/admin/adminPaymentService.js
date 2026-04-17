const { CampaignPayments } = require('../../models/CampaignMongo');
const { InfluencerInfo } = require('../../models/InfluencerMongo');

class adminPaymentService {
    static async getAllPayments(queryParams = {}) {
        try {
            const { search = '', page = 1, limit = 50 } = queryParams;
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const query = {};

            if (search) {
                const searchRegex = { $regex: search, $options: 'i' };
                // Since brand/influencer are populated, we'd ideally use aggregation to search them.
                // For now, we'll support searching by standard fields if available.
                // To do high-performance search on populated fields, we'd need an aggregation pipeline.
            }

            const payments = await CampaignPayments.find(query)
                .select('_id payment_date brand_id influencer_id amount status payment_method collab_type')
                .populate('brand_id', 'brandName')
                .populate('influencer_id', 'fullName displayName categories')
                .sort({ payment_date: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean();

            const totalDocs = await CampaignPayments.countDocuments(query);

            const data = payments.map(payment => ({
                transactionId: payment._id,
                date: payment.payment_date ? payment.payment_date.toISOString().split('T')[0] : '',
                brand: payment.brand_id ? payment.brand_id.brandName : '',
                influencer: payment.influencer_id ? (payment.influencer_id.displayName || payment.influencer_id.fullName || '') : '',
                amount: payment.amount,
                status: payment.status,
                paymentMethod: payment.payment_method || 'N/A',
                collabType: payment.collab_type || 'N/A',
                influencerCategory: payment.influencer_id ? (payment.influencer_id.categories || []) : []
            }));

            return {
                payments: data,
                meta: {
                    totalDocs,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalDocs / limit)
                }
            };
        } catch (error) {
            console.error('Error in getAllPayments:', error);
            return { payments: [], meta: { totalDocs: 0, currentPage: 1, totalPages: 0 } };
        }
    }

    static async getPaymentById(id) {
        try {
            const payment = await CampaignPayments.findById(id)
                .populate('brand_id', 'brandName')
                .populate('influencer_id', 'fullName displayName categories')
                .lean();

            if (!payment) return null;

            return {
                transactionId: payment._id,
                date: payment.payment_date ? payment.payment_date.toISOString().split('T')[0] : '',
                brand: payment.brand_id ? payment.brand_id.brandName : '',
                influencer: payment.influencer_id ? (payment.influencer_id.displayName || payment.influencer_id.fullName || '') : '',
                amount: payment.amount,
                status: payment.status,
                paymentMethod: payment.payment_method || 'N/A',
                collabType: payment.collab_type || 'N/A',
                influencerCategory: payment.influencer_id ? (payment.influencer_id.categories || []) : []
            };
        } catch (error) {
            console.error('Error in getPaymentById:', error);
            return null;
        }
    }

    static async updatePaymentStatus(id, status) {
        try {
            const result = await CampaignPayments.findByIdAndUpdate(id, { status }, { new: true });
            if (result) {
                return { success: true, message: 'Payment status updated successfully' };
            } else {
                return { success: false, message: 'Payment not found' };
            }
        } catch (error) {
            console.error('Error in updatePaymentStatus:', error);
            throw error;
        }
    }
    static async getInfluencerCategories() {
        try {
            const allCategories = await InfluencerInfo.distinct('categories');
            return allCategories.filter(Boolean).sort();
        } catch (error) {
            console.error('Error in getInfluencerCategories:', error);
            throw error;
        }
    }
}

module.exports = adminPaymentService;
