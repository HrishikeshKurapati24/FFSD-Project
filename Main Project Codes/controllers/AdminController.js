const AdminModel = require("../models/AdminModel");

const AdminController = {
    async getDashboard(req, res) {
        try {
            // Stats data
            const stats = [
                {
                    label: "Total Users",
                    value: "1,2340",
                    color: "green",
                    growth: 12.5,
                    description: "You made an extra 12.5% this year"
                },
                {
                    label: "Monthly Visits",
                    value: "45.2K",
                    color: "blue",
                    growth: 18.2,
                    description: "Increased by 18.2% this month"
                },
                {
                    label: "Completed Collabs",
                    value: "892",
                    color: "purple",
                    growth: 9.3,
                    description: "Deals completed this quarter"
                },
                {
                    label: "Active Collabs",
                    value: "156",
                    color: "orange",
                    growth: 22.4,
                    description: "Live campaigns running"
                }
            ];

            // Revenue data
            const revenueData = {
                totalRevenue: 125000,
                revenueGrowth: 15.5,
                activeCollabs: 45,
                potentialRevenue: 25000,
                avgDealSize: 5000,
                recentTransactions: [
                    {
                        date: '2024-02-15',
                        collab: 'Summer Fashion Campaign',
                        amount: 10000
                    },
                    {
                        date: '2024-02-14',
                        collab: 'Tech Product Launch',
                        amount: 15000
                    },
                    {
                        date: '2024-02-13',
                        collab: 'Beauty Brand Partnership',
                        amount: 8000
                    },
                    {
                        date: '2024-02-12',
                        collab: 'Lifestyle Content Series',
                        amount: 12000
                    },
                    {
                        date: '2024-02-11',
                        collab: 'Food & Beverage Promotion',
                        amount: 9000
                    }
                ]
            };

            // Analytics data
            const analytics = [
                {
                    title: "User Growth",
                    chartId: "userGrowthChart",
                    type: "line",
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                    values: [100, 150, 200, 250, 300, 350]
                },
                {
                    title: "Engagement Rate",
                    chartId: "engagementChart",
                    type: "bar",
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                    values: [20, 25, 30, 35, 40, 45]
                },
                {
                    title: "Campaign Performance",
                    chartId: "campaignChart",
                    type: "doughnut",
                    labels: ["Campaign A", "Campaign B", "Campaign C"],
                    values: [30, 50, 20]
                },
                {
                    title: "Revenue Trends",
                    chartId: "revenueChart",
                    type: "line",
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                    values: [5000, 7000, 8000, 10000, 12000, 15000]
                }
            ];

            // Render the dashboard with only required data
            res.render("admin_dashboard", {
                user: { name: req.user ? req.user.name : "Admin" },
                stats,
                analytics,
                totalRevenue: revenueData.totalRevenue,
                revenueGrowth: revenueData.revenueGrowth,
                activeCollabs: revenueData.activeCollabs,
                potentialRevenue: revenueData.potentialRevenue,
                avgDealSize: revenueData.avgDealSize,
                recentTransactions: revenueData.recentTransactions,
            });

        } catch (error) {
            console.error("Error loading admin dashboard:", error);
            res.status(500).send("Internal Server Error");
        }
    }
};

module.exports = AdminController;