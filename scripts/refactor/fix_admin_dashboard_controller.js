const fs = require('fs');

const ctrlPath = './controllers/admin/adminDashboardController.js';
let ctrlC = fs.readFileSync(ctrlPath, 'utf8');

const getDashboardRegex = /async getDashboard\(req, res\) \{[\s\S]*?(?=\/\/ Helper function to detect API requests)/m;
const match = ctrlC.match(getDashboardRegex);
if(match) {
    const replacement = `async getDashboard(req, res) {
        // Always check if this is an API request first and set headers accordingly
        const fullPath = req.originalUrl || req.url || req.path || '';
        const pathOnly = fullPath.split('?')[0];
        const isLikelyAPIRequest = pathOnly === '/admin/dashboard' || pathOnly === '/dashboard' ||
            (!req.headers.accept || !req.headers.accept.includes('text/html'));

        if (isLikelyAPIRequest) {
            res.setHeader('Content-Type', 'application/json');
        }

        try {
            const metrics = await AdminDashboardService.getDashboardMetrics();
            const {
                userCount, brandCount, influencerCount,
                activeCollabs, completedCollabs, pendingCollabs,
                totalRevenue, revenueGrowth, avgDealSize,
                totalSoldQuantity, avgProductPrice, totalProducts,
                recentTransactions, monthlyRevenueData, monthlyLabels,
                userGrowthData, userGrowthLabels, analytics,
                topBrands, topInfluencers, stats
            } = metrics;

            // Notifications - Generate based on current data
            let notifications = [];
            try {
                if (typeof generateNotifications === 'function') {
                    notifications = await generateNotifications();
                }
            } catch(e) { console.error('Notifications generation error:', e); }

            `;
    ctrlC = ctrlC.replace(match[0], replacement);
    fs.writeFileSync(ctrlPath, ctrlC);
}
