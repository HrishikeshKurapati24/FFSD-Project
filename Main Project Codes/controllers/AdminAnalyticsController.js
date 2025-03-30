const AnalyticsModel = require('../models/AnalyticsModel');

const AdminAnalyticsController = {
    getBrandAnalytics: async (req, res) => {
        try {
            console.log("Fetching brand analytics...");
            const metrics = await AnalyticsModel.getBrandAnalytics();
            console.log("Metrics received:", metrics);

            if (!metrics) {
                throw new Error('No metrics data received');
            }

            res.render('analytics/brand-analytics', {
                metrics,
                error: null
            });
        } catch (error) {
            console.error('Error in getBrandAnalytics:', error);
            res.render('analytics/brand-analytics', {
                metrics: null,
                error: 'Failed to load brand analytics'
            });
        }
    },

    getInfluencerAnalytics: async (req, res) => {
        try {
            console.log("Fetching influencer analytics...");
            const metrics = await AnalyticsModel.getInfluencerAnalytics();
            console.log("Metrics received:", metrics);

            if (!metrics) {
                throw new Error('No metrics data received');
            }

            res.render('analytics/influencer-analytics', {
                metrics,
                error: null
            });
        } catch (error) {
            console.error('Error in getInfluencerAnalytics:', error);
            res.render('analytics/influencer-analytics', {
                metrics: null,
                error: 'Failed to load influencer analytics'
            });
        }
    },

    getCustomerAnalytics: async (req, res) => {
        try {
            console.log("Fetching customer analytics...");
            const metrics = await AnalyticsModel.getCustomerAnalytics();
            console.log("Metrics received:", metrics);

            if (!metrics) {
                throw new Error('No metrics data received');
            }

            res.render('analytics/customer-analytics', {
                metrics,
                error: null
            });
        } catch (error) {
            console.error('Error in getCustomerAnalytics:', error);
            res.render('analytics/customer-analytics', {
                metrics: null,
                error: 'Failed to load customer analytics'
            });
        }
    }
};

module.exports = AdminAnalyticsController;