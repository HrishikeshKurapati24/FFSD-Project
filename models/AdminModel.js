const db = require("../config/database"); // Assume you have a DB connection setup

class AdminModel {
    static async getDashboardStats() {
        // Replace with actual DB queries
        return {
            totalUsers: 5000,
            userGrowth: 12,
            activeUsers: 3500,
            activeUserGrowth: 8,
            totalRevenue: "$200K",
            revenueGrowth: 15,
            totalCollaborations: 120,
            collabGrowth: 10,
        };
    }

    static async getAnalyticsData() {
        return [
            { title: "Engagement Rate", chartId: "engagementRateChart" },
            { title: "Click-Through Rate (CTR)", chartId: "ctrChart" },
            { title: "Conversion Rate", chartId: "conversionRateChart" },
            { title: "Total Reach & Impressions", chartId: "reachImpressionsChart" },
            { title: "Campaign ROI", chartId: "roiChart" },
        ];
    }

    static async getProfiles() {
        return [
            {
                title: "Influencer Profile",
                details: [
                    { label: "Growth Trends", value: "10% increase" },
                    { label: "Past Collaborations", value: "50+" },
                    { label: "Audience Demographics", value: "18-34 years" },
                    { label: "Authenticity Score", value: "95%" },
                ],
            },
            {
                title: "Brand Profile",
                details: [
                    { label: "Growth Trends", value: "12% increase" },
                    { label: "Past Collaborations", value: "100+" },
                    { label: "Audience Demographics", value: "25-45 years" },
                    { label: "Authenticity Score", value: "90%" },
                ],
            },
        ];
    }

    static async getCampaigns() {
        return [
            {
                title: "Campaign Performance",
                metrics: [
                    { label: "Clicks", value: "1200" },
                    { label: "Conversions", value: "300" },
                    { label: "Sales Generated", value: "$10K" },
                    { label: "Best-Performing Content", value: "Video Ads" },
                    { label: "Hashtag & Mention Tracking", value: "#BestCampaign" },
                    { label: "A/B Testing Results", value: "Variant B performed better" },
                ],
            },
        ];
    }
}

module.exports = AdminModel;