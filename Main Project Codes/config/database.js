// In-memory database store
const inMemoryDB = {
    users: {
        influencers: [
            {
                id: 1,
                name: "John Doe",
                email: "john@example.com",
                category: "Lifestyle",
                social_handles: "@johndoe",
                status: "pending"
            },
            {
                id: 2,
                name: "Jane Smith",
                email: "jane@example.com",
                category: "Fashion",
                social_handles: "@janesmith",
                status: "approved"
            }
        ],
        brands: [
            {
                id: 1,
                name: "Nike",
                email: "nike@example.com",
                website: "www.nike.com",
                category: "Sports",
                status: "approved"
            },
            {
                id: 2,
                name: "Apple",
                email: "apple@example.com",
                website: "www.apple.com",
                category: "Technology",
                status: "pending"
            }
        ]
    },
    collaborations: [
        {
            id: 1,
            brand: "Nike",
            influencer: "John Doe",
            status: "In Progress",
            engagementRate: 5.2,
            reach: "50K",
            startDate: "2024-03-01",
            endDate: "2024-04-01"
        },
        {
            id: 2,
            brand: "Apple",
            influencer: "Jane Smith",
            status: "Completed",
            engagementRate: 7.8,
            reach: "75K",
            startDate: "2024-02-01",
            endDate: "2024-03-01"
        }
    ],
    payments: [
        {
            transactionId: "TRX001",
            date: "2024-03-15",
            brand: "Nike",
            influencer: "John Doe",
            amount: 1500,
            status: "Pending"
        },
        {
            transactionId: "TRX002",
            date: "2024-03-14",
            brand: "Apple",
            influencer: "Jane Smith",
            amount: 2000,
            status: "Verified"
        }
    ],
    feedback: [
        {
            id: 1,
            type: "Issue",
            user: "John Doe",
            message: "Platform navigation issues",
            status: "Pending",
            date: "2024-03-15"
        },
        {
            id: 2,
            type: "Feedback",
            user: "Jane Smith",
            message: "Great user experience",
            status: "Resolved",
            date: "2024-03-14"
        }
    ],
    analytics: {
        brands: {
            totalBrands: 150,
            brandGrowth: 12.5,
            activeBrands: 89,
            activeGrowth: 8.2,
            averageCollabValue: 5000,
            collabValueGrowth: 15.3,
            highestCollabValue: 150000,
            highestCollabBrand: {
                name: 'Nike',
                logo: 'https://via.placeholder.com/32',
                value: 150000
            },
            mostActiveCollabs: 25,
            mostActiveBrand: {
                name: 'Apple',
                logo: 'https://via.placeholder.com/32',
                totalCollabs: 25
            },
            monthlyGrowth: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                data: [30, 45, 55, 60, 75, 89]
            },
            revenueData: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                data: [50000, 65000, 75000, 85000, 95000, 120000]
            },
            topCategories: [
                { name: 'Fashion', percentage: 35 },
                { name: 'Beauty', percentage: 25 },
                { name: 'Technology', percentage: 20 },
                { name: 'Lifestyle', percentage: 15 },
                { name: 'Food & Beverage', percentage: 5 }
            ],
            topBrands: [
                {
                    name: 'Nike',
                    logo: 'https://via.placeholder.com/32',
                    category: 'Fashion',
                    activeCampaigns: 12,
                    revenue: 75000,
                    engagementRate: 8.5,
                    status: 'Active'
                },
                {
                    name: 'Apple',
                    logo: 'https://via.placeholder.com/32',
                    category: 'Technology',
                    activeCampaigns: 8,
                    revenue: 95000,
                    engagementRate: 7.8,
                    status: 'Active'
                }
            ]
        },
        influencers: {
            totalInfluencers: 500,
            activeInfluencers: 320,
            averageEngagement: 15.5,
            categoryBreakdown: [
                { name: 'Micro', count: 300, percentage: 60 },
                { name: 'Macro', count: 150, percentage: 30 },
                { name: 'Mega', count: 50, percentage: 10 }
            ],
            performanceData: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                engagement: [12, 14, 13.5, 15, 14.8, 15.5],
                collaborations: [45, 52, 48, 60, 55, 65]
            }
        },
        customers: {
            totalCustomers: 10000,
            activeCustomers: 7500,
            customerGrowth: 25,
            demographics: {
                age: [
                    { range: '18-24', percentage: 30 },
                    { range: '25-34', percentage: 40 },
                    { range: '35-44', percentage: 20 },
                    { range: '45+', percentage: 10 }
                ],
                gender: [
                    { type: 'Female', percentage: 55 },
                    { type: 'Male', percentage: 42 },
                    { type: 'Other', percentage: 3 }
                ]
            },
            engagementData: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                interactions: [1200, 1400, 1350, 1500, 1480, 1550],
                conversions: [450, 520, 480, 600, 550, 650]
            }
        }
    }
};

// Database operations
const db = {
    async query(query, params = []) {
        // Simple query parser (for demonstration)
        if (query.includes("SELECT * FROM influencers")) {
            return [inMemoryDB.users.influencers.filter(i => i.status === "pending")];
        }
        if (query.includes("SELECT * FROM brands")) {
            return [inMemoryDB.users.brands.filter(b => b.status === "pending")];
        }
        if (query.includes("UPDATE")) {
            const table = query.includes("brands") ? "brands" : "influencers";
            const id = params[1];
            const item = inMemoryDB.users[table].find(item => item.id === id);
            if (item) {
                item.status = "approved";
            }
            return [{ affectedRows: 1 }];
        }
        return [[]];
    },

    async getConnection() {
        return {
            release: () => { }
        };
    }
};

console.log("✅ In-Memory Database Initialized");

module.exports = {
    query: db.query,
    getConnection: db.getConnection,
    inMemoryDB
};