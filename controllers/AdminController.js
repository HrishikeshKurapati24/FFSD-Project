const { Admin } = require("../models/mongoDB");
const { AdminModel } = require("../models/AdminModel");
const bcrypt = require('bcrypt');

const UserManagementModel = AdminModel.UserManagementModel;

const DashboardController = {
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
                    values: [100, 150, 200, 120, 300, 350]
                },
                {
                    title: "Engagement Rate",
                    chartId: "engagementChart",
                    type: "bar",
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                    values: [20, 25, 30, 35, 90, 45]
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
            res.render("admin/dashboard", {
                user: res.locals.user,
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
    },

    async verifyUser(req, res) {
        try {
            const { username, password, rememberMe } = req.body;

            console.log(await Admin.find({}));

            console.log('Login attempt for username:', username);
            console.log('Request body:', { username, rememberMe });

            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Username and password are required"
                });
            }

            // Find user by username
            const foundUser = await Admin.findOne({ username });
            console.log('Found user:', foundUser ? {
                username: foundUser.username,
                role: foundUser.role
            } : 'No user found');

            if (!foundUser) {
                console.log('User not found:', username);
                return res.status(401).json({
                    success: false,
                    message: "Invalid username or password"
                });
            }

            // Compare passwords
            const isPasswordValid = await bcrypt.compare(password, foundUser.password);
            console.log('Password validation:', isPasswordValid ? 'Valid' : 'Invalid');

            if (!isPasswordValid) {
                console.log('Invalid password for user:', username);
                return res.status(401).json({
                    success: false,
                    message: "Invalid username or password"
                });
            }

            // Set session
            req.session.userId = foundUser.userId;
            req.session.role = foundUser.role;

            console.log('Login successful for user:', username);
            console.log('Session set:', {
                userId: req.session.userId,
                role: req.session.role
            });

            // Set remember me cookie if requested
            if (rememberMe) {
                res.cookie('rememberMe', true, {
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production'
                });
            }

            // Return success response
            res.json({
                success: true,
                message: "Login successful",
                redirect: '/admin/dashboard'
            });

        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({
                success: false,
                message: "Server error occurred",
                error: error.message
            });
        }
    }
};

const AnalyticsController = {
    getBrandAnalytics: async (req, res) => {
        try {
            console.log("Fetching brand analytics...");
            const metrics = await AdminModel.AnalyticsModel.getBrandAnalytics();
            console.log("Metrics received:", metrics);
            const chartData = {
                brandGrowthData: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
                    data: [121, 1598, 220, 3987] // Followers per month
                },
                revenueData: {
                    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                    data: [1200, 1100, 25000, 30000] // Revenue per quarter
                },
                categoryDistribution: {
                    labels: ['Fashion', 'Tech', 'Fitness', 'Food'],
                    data: [35, 25, 21, 18] // Percentage distribution
                }
            };

            if (!metrics) {
                throw new Error('No metrics data received');
            }

            res.render('admin/analytics/brand-analytics', {
                metrics,
                error: null,
                chartData
            });
        } catch (error) {
            console.error('Error in getBrandAnalytics:', error);
            res.render('admin/analytics/brand-analytics', {
                metrics: null,
                error: 'Failed to load brand analytics'
            });
        }
    },

    getInfluencerAnalytics: async (req, res) => {
        try {
            console.log("Fetching influencer analytics...");
            const metrics = await AdminModel.AnalyticsModel.getInfluencerAnalytics();
            console.log("Metrics received:", metrics);
            const performance_analytic = {
                performanceChartData: {
                    labels: ['January', 'February', 'March', 'April', 'May'],
                    datasets: [
                        {
                            label: 'Reach',
                            data: [12000, 15000, 18000, 14000, 20000],
                            backgroundColor: 'rgba(75, 192, 192, 0.5)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Impressions',
                            data: [22000, 25000, 30000, 24000, 32000],
                            backgroundColor: 'rgba(153, 102, 255, 0.5)',
                            borderColor: 'rgba(153, 102, 255, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Engagement',
                            data: [800, 1200, 1000, 1100, 1500],
                            backgroundColor: 'rgba(255, 159, 64, 0.5)',
                            borderColor: 'rgba(255, 159, 64, 1)',
                            borderWidth: 1
                        }
                    ]
                }
            };


            if (!metrics) {
                throw new Error('No metrics data received');
            }

            res.render('admin/analytics/influencer-analytics', {
                metrics,
                error: null,
                performance_analytic
            });
        } catch (error) {
            console.error('Error in getInfluencerAnalytics:', error);
            res.render('admin/analytics/influencer-analytics', {
                metrics: null,
                error: 'Failed to load influencer analytics'
            });
        }
    },

    getCustomerAnalytics: async (req, res) => {
        try {
            console.log("Fetching campaign analytics...");
            const metrics = await AdminModel.AnalyticsModel.getCampaignAnalytics();
            console.log("Metrics received:", metrics);

            const campaignTypesData = {
                labels: ['Active', 'Completed', 'Draft', 'Cancelled', 'Request'],
                counts: [10, 7, 5, 2, 3] // Mock values
            };

            // Static data for Engagement Trends
            const engagementTrendsData = {
                labels: ['January', 'February', 'March', 'April', 'May'],
                engagementRates: [25, 30, 28, 35, 40], // Mock values
                reach: [1000, 1500, 1300, 1700, 2000]  // Mock values
            };


            if (!metrics) {
                throw new Error('No metrics data received');
            }

            res.render('admin/analytics/campaign-analytics', {
                metrics,
                camp: {
                    campaignTypesData,
                    engagementTrendsData,
                },
                error: null,

            });

        } catch (error) {
            console.error('Error in getCustomerAnalytics:', error);
            res.render('admin/analytics/campaign-analytics', {
                metrics: null,
                error: 'Failed to load campaign analytics'
            });
        }
    }
};

const UserManagementController = {
    async getUserManagementPage(req, res) {
        try {
            let influencers = await AdminModel.UserManagementModel.getInfluencers();
            let brands = await AdminModel.UserManagementModel.getBrands();

            // Map influencers to expected fields for the view
            influencers = influencers.map(influencer => ({
                name: influencer.displayName || influencer.fullName || 'N/A',
                email: influencer.email || 'N/A',
                category: (influencer.categories && influencer.categories.length > 0) ? influencer.categories.join(', ') : (influencer.niche || 'N/A'),
                social_handles: (influencer.social_handles && influencer.social_handles.length > 0) ? influencer.social_handles.join(', ') : 'N/A',
                audienceSize: influencer.audienceSize || 0,
                _id: influencer._id || influencer.id || null,
                verified: influencer.verified || false
            }));

            // Map brands to expected fields for the view
            brands = brands.map(brand => ({
                name: brand.brandName || brand.displayName || 'N/A',
                email: brand.email || 'N/A',
                website: brand.website || 'N/A',
                industry: brand.industry || brand.businessCategory || brand.category || 'N/A',
                totalAudience: brand.totalAudience || 0,
                _id: brand._id || brand.id || null,
                verified: brand.verified || false
            }));

            const flaggedContent = [];
            const suspiciousUsers = [];
            const userTypeRequests = [];
            const profileSuggestions = [];

            res.render("admin/user_management", {
                influencers,
                brands,
                flaggedContent,
                suspiciousUsers,
                userTypeRequests,
                profileSuggestions,
                user: res.locals.user || { name: 'Admin User' }
            });
        } catch (error) {
            console.error("Error in getUserManagementPage:", error);
            res.render("admin/user_management", {
                influencers: [],
                brands: [],
                flaggedContent: [],
                suspiciousUsers: [],
                userTypeRequests: [],
                profileSuggestions: [],
                user: res.locals.user || { name: 'Admin User' },
                error: "Failed to load user management data"
            });
        }
    },

    async approveUser(req, res) {
        try {
            const { id } = req.params;
            const { userType } = req.body;
            console.log('AdminController approveUser called:', { id, userType });
            const result = await AdminModel.UserManagementModel.approveUser(id, userType);
            console.log('AdminController approveUser result:', result);
            res.json(result);
        } catch (error) {
            console.error("Error in approveUser:", error);
            res.status(500).json({ success: false, message: "Failed to approve user" });
        }
    },

    async getBrandDetails(req, res) {
        try {
            const { id } = req.params;
            console.log('AdminController getBrandDetails called for ID:', id);

            const brand = await AdminModel.UserManagementModel.getBrandById(id);
            if (!brand) {
                return res.status(404).json({ success: false, message: "Brand not found" });
            }

            res.json(brand);
        } catch (error) {
            console.error("Error in getBrandDetails:", error);
            res.status(500).json({ success: false, message: "Failed to fetch brand details" });
        }
    },

    async getInfluencerDetails(req, res) {
        try {
            const { id } = req.params;
            console.log('AdminController getInfluencerDetails called for ID:', id);

            const influencer = await AdminModel.UserManagementModel.getInfluencerById(id);
            if (!influencer) {
                return res.status(404).json({ success: false, message: "Influencer not found" });
            }

            res.json(influencer);
        } catch (error) {
            console.error("Error in getInfluencerDetails:", error);
            res.status(500).json({ success: false, message: "Failed to fetch influencer details" });
        }
    }
};

const PaymentController = {
    async getAllPayments(req, res) {
        try {
            let payments = await AdminModel.PaymentModel.getAllPayments();

            // Map payments to ensure brand and influencer names are correctly set
            payments = payments.map(payment => ({
                ...payment,
                brand: payment.brand || '',
                influencer: payment.influencer || ''
            }));

            res.render("admin/payment_verification", {
                payments,
                user: res.locals.user || { name: 'Admin User' }
            });
        } catch (error) {
            console.error("Error fetching payments:", error);
            res.render("admin/payment_verification", {
                payments: [],
                user: res.locals.user || { name: 'Admin User' },
                error: "Failed to load payments"
            });
        }
    },

    async getPaymentDetails(req, res) {
        try {
            const paymentId = req.params.id;
            const payment = await AdminModel.PaymentModel.getPaymentById(paymentId);
            if (!payment) {
                return res.status(404).json({ error: "Payment Not Found" });
            }
            res.json(payment);
        } catch (error) {
            console.error("Error fetching payment details:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    },

    async updatePaymentStatus(req, res) {
        try {
            const { id, status } = req.body;
            const result = await AdminModel.PaymentModel.updatePaymentStatus(id, status);
            res.json(result);
        } catch (error) {
            console.error("Error updating payment status:", error);
            res.status(500).send("Internal Server Error");
        }
    }
};

const CollaborationController = {
    async getAllCollaborations(req, res) {
        try {
            let collaborations = await AdminModel.CollaborationModel.getAllCollaborations();

            // Map collaborations to ensure brand and influencer names are correctly set
            collaborations = collaborations.map(collab => ({
                ...collab,
                brand: collab.brand || '',
                influencers: (collab.influencers || []).map(inf => ({
                    ...inf,
                    influencer: inf.influencer || ''
                }))
            }));

            res.render("admin/collaboration_monitoring", {
                collaborations,
                user: res.locals.user || { name: 'Admin User' }
            });
        } catch (error) {
            console.error("Error fetching collaborations:", error);
            res.render("admin/collaboration_monitoring", {
                collaborations: [],
                user: res.locals.user || { name: 'Admin User' },
                error: "Failed to load collaborations"
            });
        }
    },

    async getCollaborationDetails(req, res) {
        try {
            const collabId = req.params.id;
            const collaboration = await AdminModel.CollaborationModel.getCollaborationById(collabId);
            if (!collaboration) {
                return res.status(404).json({ error: "Collaboration Not Found" });
            }
            res.json(collaboration);
        } catch (error) {
            console.error("Error fetching collaboration details:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};

module.exports = { DashboardController, AnalyticsController, PaymentController, UserManagementController, CollaborationController };