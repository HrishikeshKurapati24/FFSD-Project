const { inMemoryDB } = require('../config/database');

class AnalyticsModel {
    static async getBrandAnalytics() {
        try {
            console.log("Attempting to fetch brand analytics...");
            const brandData = inMemoryDB.analytics.brands;
            console.log("Brand data retrieved:", brandData);

            if (!brandData) {
                throw new Error('Brand analytics data not found');
            }

            return brandData;
        } catch (error) {
            console.error('Error in getBrandAnalytics:', error);
            throw error;
        }
    }

    static async getInfluencerAnalytics() {
        try {
            console.log("Attempting to fetch influencer analytics...");
            const influencerData = inMemoryDB.analytics.influencers;
            console.log("Influencer data retrieved:", influencerData);

            if (!influencerData) {
                throw new Error('Influencer analytics data not found');
            }

            return influencerData;
        } catch (error) {
            console.error('Error in getInfluencerAnalytics:', error);
            throw error;
        }
    }

    static async getCustomerAnalytics() {
        try {
            console.log("Attempting to fetch customer analytics...");
            const customerData = inMemoryDB.analytics.customers;
            console.log("Customer data retrieved:", customerData);

            if (!customerData) {
                throw new Error('Customer analytics data not found');
            }

            return customerData;
        } catch (error) {
            console.error('Error in getCustomerAnalytics:', error);
            throw error;
        }
    }
}

module.exports = AnalyticsModel; 