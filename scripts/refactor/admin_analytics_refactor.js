const fs = require('fs');
const path = require('path');

const refactorAdminAnalytics = () => {
    const controllerPath = path.join(__dirname, '../../controllers/admin/adminAnalyticsController.js');
    let controller = fs.readFileSync(controllerPath, 'utf8');

    // 1. Refactor getBrandAnalytics
    controller = controller.replace(
        /\/\/\s*Get basic metrics[\s\S]*?(?=\/\/\s*--- Brand Loyalty Index)/,
        ""
    );
    
    // Remove the loyalty index calculation
    controller = controller.replace(
        /\/\/\s*--- Brand Loyalty Index \(repeat customers per brand\) ---[\s\S]*?(?=console\.log\("Metrics received:", metrics\);)/,
        `const metrics = await AdminAnalyticsService.getBrandAnalytics();\n            `
    );

    // 2. Refactor getInfluencerAnalytics
    // Replace the part after metrics are received up to analyticsData creation
    controller = controller.replace(
        /const performanceData = {[\s\S]*?(?=const analyticsData = {)/,
        `const performanceData = {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                engagement: [4.2, 4.5, 4.8, 4.3, 5.1, 5.4],
                collaborations: [45, 52, 48, 61, 58, 67],
                reach: [125000, 142000, 138000, 156000, 162000, 178000]
            };
            
            const engagementTrends = {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                instagram: [4.2, 4.5, 4.8, 4.3, 5.1, 5.4],
                youtube: [3.8, 4.1, 3.9, 4.4, 4.7, 4.9],
                tiktok: [6.5, 7.2, 7.8, 7.1, 8.2, 8.6]
            };

            const followerGrowth = {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                totalFollowers: [2.1, 2.3, 2.5, 2.7, 2.9, 3.2],
                monthlyGrowth: [8.5, 12.3, 9.8, 11.2, 7.4, 10.1]
            };
            
            const categoryBreakdown = metrics.categoryBreakdown || [];
            const topInfluencers = metrics.topInfluencer ? [metrics.topInfluencer] : [];
            
            `
    );

    fs.writeFileSync(controllerPath, controller, 'utf8');
    console.log("Admin Analytics refactored successfully.");
};

refactorAdminAnalytics();
