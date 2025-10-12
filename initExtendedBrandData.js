const { BrandInfo, BrandSocials, BrandAnalytics } = require('./config/BrandMongo');
const bcrypt = require('bcrypt');

const initializeExtendedBrandData = async () => {
    try {
        // Hash password for all brands
        const hashedPassword = await bcrypt.hash('Brand@123', 10);

        const extendedBrands = [
            {
                // 6. Swiggy
                brandInfo: {
                    brandName: "Swiggy",
                    email: "swiggy@example.com",
                    username: "swiggy",
                    displayName: "Swiggy",
                    bio: "India's most loved food delivery platform. Order from your favorite restaurants.",
                    phone: "+919876543215",
                    industry: "Food Delivery",
                    location: "Bangalore, India",
                    website: "https://swiggy.com",
                    mission: "To ensure nobody has a bad meal experience.",
                    values: ["Food", "Technology", "Customer First", "Innovation"],
                    verified: true,
                    logoUrl: "/images/brands/swiggy-logo.png",
                    bannerUrl: "/images/brands/swiggy-banner.png",
                    categories: ["Food", "Technology", "Delivery", "E-commerce"],
                    languages: ["English", "Hindi", "Tamil", "Telugu", "Kannada"],
                    currentCampaign: "Foodie Adventures",
                    about: "Swiggy is India's leading food delivery platform, connecting customers with their favorite restaurants.",
                    influenceRegions: "India",
                    status: "active",
                    tagline: "Order in for what you crave",
                    primaryMarket: "India",
                    completedCampaigns: 350,
                    influencerPartnerships: 900,
                    avgCampaignRating: 4.8,
                    totalAudience: 12000000,
                    targetAgeRange: "18-45",
                    targetGender: "All",
                    targetInterests: ["Food", "Technology", "Lifestyle", "Entertainment"]
                },
                brandSocials: {
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@swiggy",
                            url: "https://instagram.com/swiggy",
                            followers: 4500000,
                            engagementRate: 4.6,
                            avgLikes: 120000,
                            avgComments: 6000,
                            avgViews: 250000
                        },
                        {
                            platform: "youtube",
                            handle: "Swiggy",
                            url: "https://youtube.com/swiggy",
                            followers: 2500000,
                            engagementRate: 4.3,
                            avgLikes: 50000,
                            avgComments: 3000,
                            avgViews: 180000
                        }
                    ]
                },
                brandAnalytics: {
                    totalFollowers: 7000000,
                    avgEngagementRate: 4.5,
                    monthlyEarnings: 18000000,
                    earningsChange: 28,
                    rating: 4.8,
                    audienceDemographics: {
                        gender: "Mixed",
                        ageRange: "18-45",
                        topLocations: ["Bangalore", "Mumbai", "Delhi", "Hyderabad"]
                    },
                    performanceMetrics: {
                        reach: 18000000,
                        impressions: 25000000,
                        engagement: 700000,
                        conversionRate: 4.8
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 7000000,
                            engagementRate: 4.5,
                            earnings: 18000000,
                            reach: 18000000,
                            impressions: 25000000
                        }
                    ],
                    campaignMetrics: {
                        totalCampaigns: 350,
                        activeCampaigns: 28,
                        totalSpend: 70000000,
                        totalRevenue: 200000000,
                        avgROI: 185
                    }
                }
            },
            {
                // 7. Myntra
                brandInfo: {
                    brandName: "Myntra",
                    email: "myntra@example.com",
                    username: "myntra",
                    displayName: "Myntra",
                    bio: "India's leading fashion and lifestyle e-commerce platform.",
                    phone: "+919876543216",
                    industry: "E-commerce",
                    location: "Bangalore, India",
                    website: "https://myntra.com",
                    mission: "To democratize fashion and lifestyle in India.",
                    values: ["Fashion", "Style", "Innovation", "Customer First"],
                    verified: true,
                    logoUrl: "/images/brands/myntra-logo.png",
                    bannerUrl: "/images/brands/myntra-banner.jpg",
                    categories: ["Fashion", "E-commerce", "Lifestyle", "Beauty"],
                    languages: ["English", "Hindi"],
                    currentCampaign: "Fashion Forward",
                    about: "Myntra is India's leading fashion and lifestyle e-commerce platform, offering a wide range of products.",
                    influenceRegions: "India",
                    status: "active",
                    tagline: "Fashion Forward",
                    primaryMarket: "India",
                    completedCampaigns: 280,
                    influencerPartnerships: 750,
                    avgCampaignRating: 4.7,
                    totalAudience: 9000000,
                    targetAgeRange: "18-40",
                    targetGender: "All",
                    targetInterests: ["Fashion", "Lifestyle", "Beauty", "Shopping"]
                },
                brandSocials: {
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@myntra",
                            url: "https://instagram.com/myntra",
                            followers: 3500000,
                            engagementRate: 4.3,
                            avgLikes: 90000,
                            avgComments: 4000,
                            avgViews: 180000
                        },
                        {
                            platform: "youtube",
                            handle: "Myntra",
                            url: "https://youtube.com/myntra",
                            followers: 1800000,
                            engagementRate: 4.1,
                            avgLikes: 35000,
                            avgComments: 2000,
                            avgViews: 120000
                        }
                    ]
                },
                brandAnalytics: {
                    totalFollowers: 5300000,
                    avgEngagementRate: 4.2,
                    monthlyEarnings: 14000000,
                    earningsChange: 22,
                    rating: 4.7,
                    audienceDemographics: {
                        gender: "Mixed",
                        ageRange: "18-40",
                        topLocations: ["Bangalore", "Mumbai", "Delhi", "Chennai"]
                    },
                    performanceMetrics: {
                        reach: 12000000,
                        impressions: 18000000,
                        engagement: 550000,
                        conversionRate: 4.2
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 5300000,
                            engagementRate: 4.2,
                            earnings: 14000000,
                            reach: 12000000,
                            impressions: 18000000
                        }
                    ],
                    campaignMetrics: {
                        totalCampaigns: 280,
                        activeCampaigns: 25,
                        totalSpend: 45000000,
                        totalRevenue: 135000000,
                        avgROI: 200
                    }
                }
            },
            {
                // 8. Netflix India
                brandInfo: {
                    brandName: "Netflix India",
                    email: "netflix@example.com",
                    username: "netflixindia",
                    displayName: "Netflix India",
                    bio: "India's leading streaming platform. Watch your favorite shows and movies.",
                    phone: "+919876543217",
                    industry: "Entertainment",
                    location: "Mumbai, India",
                    website: "https://netflix.com",
                    mission: "To entertain the world with great stories.",
                    values: ["Entertainment", "Innovation", "Diversity", "Quality"],
                    verified: true,
                    logoUrl: "/images/brands/netflix-logo.png",
                    bannerUrl: "/images/brands/netflix-banner.png",
                    categories: ["Entertainment", "Streaming", "Movies", "TV Shows"],
                    languages: ["English", "Hindi", "Tamil", "Telugu", "Bengali"],
                    currentCampaign: "Binge Watch India",
                    about: "Netflix India is the leading streaming platform offering diverse content for Indian audiences.",
                    influenceRegions: "India",
                    status: "active",
                    tagline: "See What's Next",
                    primaryMarket: "India",
                    completedCampaigns: 180,
                    influencerPartnerships: 400,
                    avgCampaignRating: 4.9,
                    totalAudience: 8000000,
                    targetAgeRange: "18-50",
                    targetGender: "All",
                    targetInterests: ["Entertainment", "Movies", "TV Shows", "Streaming"]
                },
                brandSocials: {
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@netflix_in",
                            url: "https://instagram.com/netflix_in",
                            followers: 2800000,
                            engagementRate: 4.7,
                            avgLikes: 80000,
                            avgComments: 3500,
                            avgViews: 150000
                        },
                        {
                            platform: "youtube",
                            handle: "Netflix India",
                            url: "https://youtube.com/netflixindia",
                            followers: 1200000,
                            engagementRate: 4.5,
                            avgLikes: 25000,
                            avgComments: 1500,
                            avgViews: 100000
                        }
                    ]
                },
                brandAnalytics: {
                    totalFollowers: 4000000,
                    avgEngagementRate: 4.6,
                    monthlyEarnings: 16000000,
                    earningsChange: 35,
                    rating: 4.9,
                    audienceDemographics: {
                        gender: "Mixed",
                        ageRange: "18-50",
                        topLocations: ["Mumbai", "Delhi", "Bangalore", "Hyderabad"]
                    },
                    performanceMetrics: {
                        reach: 15000000,
                        impressions: 22000000,
                        engagement: 600000,
                        conversionRate: 5.5
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 4000000,
                            engagementRate: 4.6,
                            earnings: 16000000,
                            reach: 15000000,
                            impressions: 22000000
                        }
                    ],
                    campaignMetrics: {
                        totalCampaigns: 180,
                        activeCampaigns: 15,
                        totalSpend: 80000000,
                        totalRevenue: 240000000,
                        avgROI: 200
                    }
                }
            },
            {
                // 9. Urban Company
                brandInfo: {
                    brandName: "Urban Company",
                    email: "urbancompany@example.com",
                    username: "urbancompany",
                    displayName: "Urban Company",
                    bio: "India's leading home services platform. Book cleaning, beauty, and repair services.",
                    phone: "+919876543218",
                    industry: "Home Services",
                    location: "Gurgaon, India",
                    website: "https://urbancompany.com",
                    mission: "To make home services accessible to everyone.",
                    values: ["Quality", "Trust", "Convenience", "Reliability"],
                    verified: true,
                    logoUrl: "/images/brands/urbancompany-logo.jpeg",
                    bannerUrl: "/images/brands/urbancompany-banner.jpeg",
                    categories: ["Home Services", "Beauty", "Cleaning", "Repair"],
                    languages: ["English", "Hindi"],
                    currentCampaign: "Home Sweet Home",
                    about: "Urban Company is India's leading home services platform, connecting customers with trusted service providers.",
                    influenceRegions: "India",
                    status: "active",
                    tagline: "Home Services Made Simple",
                    primaryMarket: "India",
                    completedCampaigns: 120,
                    influencerPartnerships: 300,
                    avgCampaignRating: 4.6,
                    totalAudience: 5000000,
                    targetAgeRange: "25-45",
                    targetGender: "All",
                    targetInterests: ["Home Services", "Beauty", "Lifestyle", "Convenience"]
                },
                brandSocials: {
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@urbancompany",
                            url: "https://instagram.com/urbancompany",
                            followers: 1800000,
                            engagementRate: 4.1,
                            avgLikes: 45000,
                            avgComments: 2000,
                            avgViews: 90000
                        },
                        {
                            platform: "youtube",
                            handle: "Urban Company",
                            url: "https://youtube.com/urbancompany",
                            followers: 600000,
                            engagementRate: 3.9,
                            avgLikes: 15000,
                            avgComments: 800,
                            avgViews: 60000
                        }
                    ]
                },
                brandAnalytics: {
                    totalFollowers: 2400000,
                    avgEngagementRate: 4.0,
                    monthlyEarnings: 8000000,
                    earningsChange: 18,
                    rating: 4.6,
                    audienceDemographics: {
                        gender: "Mixed",
                        ageRange: "25-45",
                        topLocations: ["Gurgaon", "Mumbai", "Delhi", "Bangalore"]
                    },
                    performanceMetrics: {
                        reach: 8000000,
                        impressions: 12000000,
                        engagement: 300000,
                        conversionRate: 3.8
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 2400000,
                            engagementRate: 4.0,
                            earnings: 8000000,
                            reach: 8000000,
                            impressions: 12000000
                        }
                    ],
                    campaignMetrics: {
                        totalCampaigns: 120,
                        activeCampaigns: 12,
                        totalSpend: 25000000,
                        totalRevenue: 75000000,
                        avgROI: 200
                    }
                }
            },
            {
                // 10. CRED
                brandInfo: {
                    brandName: "CRED",
                    email: "cred@example.com",
                    username: "cred",
                    displayName: "CRED",
                    bio: "India's leading credit card bill payment platform. Earn rewards while paying bills.",
                    phone: "+919876543219",
                    industry: "Fintech",
                    location: "Bangalore, India",
                    website: "https://cred.club",
                    mission: "To make credit card bill payments rewarding.",
                    values: ["Innovation", "Rewards", "Trust", "Excellence"],
                    verified: true,
                    logoUrl: "/images/brands/cred-logo.png",
                    bannerUrl: "/images/brands/cred-banner.png",
                    categories: ["Fintech", "Payments", "Rewards", "Finance"],
                    languages: ["English", "Hindi"],
                    currentCampaign: "Rewards Revolution",
                    about: "CRED is India's leading credit card bill payment platform, offering rewards and exclusive offers.",
                    influenceRegions: "India",
                    status: "active",
                    tagline: "Trust. Rewards. Excellence.",
                    primaryMarket: "India",
                    completedCampaigns: 90,
                    influencerPartnerships: 200,
                    avgCampaignRating: 4.8,
                    totalAudience: 4000000,
                    targetAgeRange: "25-45",
                    targetGender: "All",
                    targetInterests: ["Finance", "Technology", "Rewards", "Lifestyle"]
                },
                brandSocials: {
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@cred.club",
                            url: "https://instagram.com/cred.club",
                            followers: 1500000,
                            engagementRate: 4.4,
                            avgLikes: 35000,
                            avgComments: 1500,
                            avgViews: 80000
                        },
                        {
                            platform: "youtube",
                            handle: "CRED",
                            url: "https://youtube.com/cred",
                            followers: 400000,
                            engagementRate: 4.2,
                            avgLikes: 10000,
                            avgComments: 500,
                            avgViews: 50000
                        }
                    ]
                },
                brandAnalytics: {
                    totalFollowers: 1900000,
                    avgEngagementRate: 4.3,
                    monthlyEarnings: 12000000,
                    earningsChange: 40,
                    rating: 4.8,
                    audienceDemographics: {
                        gender: "Mixed",
                        ageRange: "25-45",
                        topLocations: ["Bangalore", "Mumbai", "Delhi", "Hyderabad"]
                    },
                    performanceMetrics: {
                        reach: 6000000,
                        impressions: 9000000,
                        engagement: 250000,
                        conversionRate: 4.5
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 1900000,
                            engagementRate: 4.3,
                            earnings: 12000000,
                            reach: 6000000,
                            impressions: 9000000
                        }
                    ],
                    campaignMetrics: {
                        totalCampaigns: 90,
                        activeCampaigns: 8,
                        totalSpend: 40000000,
                        totalRevenue: 120000000,
                        avgROI: 200
                    }
                }
            }
        ];

        // Insert brands into database
        for (const brand of extendedBrands) {
            // First save the brand info
            const brandInfo = new BrandInfo({
                ...brand.brandInfo,
                password: hashedPassword
            });
            const savedBrand = await brandInfo.save();

            // Then save socials with the brand ID
            const brandSocials = new BrandSocials({
                ...brand.brandSocials,
                brandId: savedBrand._id
            });
            await brandSocials.save();

            // Finally save analytics with the brand ID
            const brandAnalytics = new BrandAnalytics({
                ...brand.brandAnalytics,
                brandId: savedBrand._id
            });
            await brandAnalytics.save();
        }

        console.log('Extended brand data initialized successfully');
    } catch (error) {
        console.error('Error initializing extended brand data:', error);
        throw error;
    }
};

module.exports = { initializeExtendedBrandData };