const { BrandInfo, BrandSocials, BrandAnalytics } = require('./config/BrandMongo');
const bcrypt = require('bcrypt');

const initializeBrandData = async () => {
    try {
        // Hash password for all brands
        const hashedPassword = await bcrypt.hash('Brand@123', 10);

        const brands = [
            {
                // 1. Mamaearth
                brandInfo: {
                    brandName: "Mamaearth",
                    email: "mamaearth@example.com",
                    username: "mamaearth",
                    displayName: "Mamaearth",
                    bio: "India's first Made Safe certified brand. Natural, toxin-free personal care products.",
                    phone: "+919876543210",
                    industry: "Beauty & Personal Care",
                    location: "Gurgaon, India",
                    website: "https://mamaearth.in",
                    mission: "To provide safe, natural, and effective personal care products for everyone.",
                    values: ["Sustainability", "Natural Ingredients", "Toxin-free", "Eco-friendly"],
                    verified: true,
                    logoUrl: "/images/brands/mamaearth-logo.png",
                    bannerUrl: "/images/brands/mamaearth-banner.jpg",
                    categories: ["Beauty", "Personal Care", "Natural Products", "Skincare"],
                    languages: ["English", "Hindi"],
                    currentCampaign: "Natural Beauty Revolution",
                    about: "Mamaearth is India's first Made Safe certified brand that offers toxin-free and natural personal care products.",
                    influenceRegions: "India",
                    status: "active",
                    tagline: "Goodness Inside",
                    primaryMarket: "India",
                    completedCampaigns: 150,
                    influencerPartnerships: 500,
                    avgCampaignRating: 4.8,
                    totalAudience: 5000000,
                    targetAgeRange: "18-35",
                    targetGender: "Female",
                    targetInterests: ["Beauty", "Skincare", "Natural Products", "Wellness"]
                },
                brandSocials: {
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@mamaearth",
                            url: "https://instagram.com/mamaearth",
                            followers: 2000000,
                            engagementRate: 4.5,
                            avgLikes: 50000,
                            avgComments: 2000,
                            avgViews: 100000
                        },
                        {
                            platform: "youtube",
                            handle: "Mamaearth",
                            url: "https://youtube.com/mamaearth",
                            followers: 500000,
                            engagementRate: 3.8,
                            avgLikes: 15000,
                            avgComments: 1000,
                            avgViews: 50000
                        }
                    ]
                },
                brandAnalytics: {
                    totalFollowers: 2500000,
                    avgEngagementRate: 4.2,
                    monthlyEarnings: 5000000,
                    earningsChange: 15,
                    rating: 4.8,
                    audienceDemographics: {
                        gender: "Female",
                        ageRange: "18-35",
                        topLocations: ["Mumbai", "Delhi", "Bangalore", "Hyderabad"]
                    },
                    performanceMetrics: {
                        reach: 8000000,
                        impressions: 12000000,
                        engagement: 350000,
                        conversionRate: 3.5
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 2500000,
                            engagementRate: 4.2,
                            earnings: 5000000,
                            reach: 8000000,
                            impressions: 12000000
                        }
                    ],
                    campaignMetrics: {
                        totalCampaigns: 150,
                        activeCampaigns: 20,
                        totalSpend: 25000000,
                        totalRevenue: 75000000,
                        avgROI: 200
                    }
                }
            },
            {
                // 2. Boat
                brandInfo: {
                    brandName: "Boat",
                    email: "boat@example.com",
                    username: "boat",
                    displayName: "Boat Lifestyle",
                    bio: "India's leading audio and wearable brand. Premium quality at affordable prices.",
                    phone: "+919876543211",
                    industry: "Electronics",
                    location: "Mumbai, India",
                    website: "https://boat-lifestyle.com",
                    mission: "To democratize premium audio and wearable technology.",
                    values: ["Innovation", "Quality", "Affordability", "Youth Culture"],
                    verified: true,
                    logoUrl: "/images/brands/boat-logo.jpg",
                    bannerUrl: "/images/brands/boat-banner.png",
                    categories: ["Electronics", "Audio", "Wearables", "Lifestyle"],
                    languages: ["English", "Hindi"],
                    currentCampaign: "Sound of India",
                    about: "Boat is India's leading audio and wearable brand, known for its premium quality products at affordable prices.",
                    influenceRegions: "India",
                    status: "active",
                    tagline: "Plug Into Nirvana",
                    primaryMarket: "India",
                    completedCampaigns: 200,
                    influencerPartnerships: 800,
                    avgCampaignRating: 4.7,
                    totalAudience: 8000000,
                    targetAgeRange: "16-35",
                    targetGender: "All",
                    targetInterests: ["Music", "Technology", "Gaming", "Fitness"]
                },
                brandSocials: {
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@boat",
                            url: "https://instagram.com/boat",
                            followers: 3000000,
                            engagementRate: 4.2,
                            avgLikes: 75000,
                            avgComments: 3000,
                            avgViews: 150000
                        },
                        {
                            platform: "youtube",
                            handle: "Boat",
                            url: "https://youtube.com/boat",
                            followers: 1000000,
                            engagementRate: 4.0,
                            avgLikes: 25000,
                            avgComments: 2000,
                            avgViews: 100000
                        }
                    ]
                },
                brandAnalytics: {
                    totalFollowers: 4000000,
                    avgEngagementRate: 4.1,
                    monthlyEarnings: 8000000,
                    earningsChange: 20,
                    rating: 4.7,
                    audienceDemographics: {
                        gender: "Mixed",
                        ageRange: "16-35",
                        topLocations: ["Mumbai", "Delhi", "Bangalore", "Chennai"]
                    },
                    performanceMetrics: {
                        reach: 12000000,
                        impressions: 18000000,
                        engagement: 500000,
                        conversionRate: 4.0
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 4000000,
                            engagementRate: 4.1,
                            earnings: 8000000,
                            reach: 12000000,
                            impressions: 18000000
                        }
                    ],
                    campaignMetrics: {
                        totalCampaigns: 200,
                        activeCampaigns: 25,
                        totalSpend: 35000000,
                        totalRevenue: 100000000,
                        avgROI: 185
                    }
                }
            },
            {
                // 3. Nykaa
                brandInfo: {
                    brandName: "Nykaa",
                    email: "nykaa@example.com",
                    username: "nykaa",
                    displayName: "Nykaa",
                    bio: "India's largest beauty and wellness e-commerce platform.",
                    phone: "+919876543212",
                    industry: "E-commerce",
                    location: "Mumbai, India",
                    website: "https://nykaa.com",
                    mission: "To democratize beauty and wellness in India.",
                    values: ["Beauty", "Wellness", "Innovation", "Customer First"],
                    verified: true,
                    logoUrl: "/images/brands/nykaa-logo.png",
                    bannerUrl: "/images/brands/nykaa-banner.jpg",
                    categories: ["Beauty", "E-commerce", "Wellness", "Fashion"],
                    languages: ["English", "Hindi"],
                    currentCampaign: "Beauty for All",
                    about: "Nykaa is India's largest beauty and wellness e-commerce platform, offering a wide range of products.",
                    influenceRegions: "India",
                    status: "active",
                    tagline: "Your Beauty, Our Passion",
                    primaryMarket: "India",
                    completedCampaigns: 300,
                    influencerPartnerships: 1000,
                    avgCampaignRating: 4.6,
                    totalAudience: 10000000,
                    targetAgeRange: "18-40",
                    targetGender: "Female",
                    targetInterests: ["Beauty", "Fashion", "Wellness", "Lifestyle"]
                },
                brandSocials: {
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@nykaa",
                            url: "https://instagram.com/nykaa",
                            followers: 4000000,
                            engagementRate: 4.0,
                            avgLikes: 100000,
                            avgComments: 5000,
                            avgViews: 200000
                        },
                        {
                            platform: "youtube",
                            handle: "Nykaa",
                            url: "https://youtube.com/nykaa",
                            followers: 2000000,
                            engagementRate: 3.9,
                            avgLikes: 40000,
                            avgComments: 3000,
                            avgViews: 150000
                        }
                    ]
                },
                brandAnalytics: {
                    totalFollowers: 6000000,
                    avgEngagementRate: 4.0,
                    monthlyEarnings: 12000000,
                    earningsChange: 25,
                    rating: 4.6,
                    audienceDemographics: {
                        gender: "Female",
                        ageRange: "18-40",
                        topLocations: ["Mumbai", "Delhi", "Bangalore", "Hyderabad"]
                    },
                    performanceMetrics: {
                        reach: 15000000,
                        impressions: 25000000,
                        engagement: 600000,
                        conversionRate: 4.5
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 6000000,
                            engagementRate: 4.0,
                            earnings: 12000000,
                            reach: 15000000,
                            impressions: 25000000
                        }
                    ],
                    campaignMetrics: {
                        totalCampaigns: 300,
                        activeCampaigns: 30,
                        totalSpend: 50000000,
                        totalRevenue: 150000000,
                        avgROI: 200
                    }
                }
            },
            {
                // 4. Lenskart
                brandInfo: {
                    brandName: "Lenskart",
                    email: "lenskart@example.com",
                    username: "lenskart",
                    displayName: "Lenskart",
                    bio: "India's leading eyewear brand. Vision for everyone.",
                    phone: "+919876543213",
                    industry: "Eyewear",
                    location: "Gurgaon, India",
                    website: "https://lenskart.com",
                    mission: "To provide affordable, stylish eyewear to everyone.",
                    values: ["Innovation", "Accessibility", "Style", "Quality"],
                    verified: true,
                    logoUrl: "/images/brands/lenskart-logo.jpg",
                    bannerUrl: "/images/brands/lenskart-banner.png",
                    categories: ["Eyewear", "Fashion", "Healthcare", "E-commerce"],
                    languages: ["English", "Hindi"],
                    currentCampaign: "Clear Vision for All",
                    about: "Lenskart is India's leading eyewear brand, offering affordable and stylish eyewear solutions.",
                    influenceRegions: "India",
                    status: "active",
                    tagline: "See Better, Look Better",
                    primaryMarket: "India",
                    completedCampaigns: 250,
                    influencerPartnerships: 700,
                    avgCampaignRating: 4.5,
                    totalAudience: 7000000,
                    targetAgeRange: "16-45",
                    targetGender: "All",
                    targetInterests: ["Fashion", "Healthcare", "Style", "Technology"]
                },
                brandSocials: {
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@lenskart",
                            url: "https://instagram.com/lenskart",
                            followers: 2500000,
                            engagementRate: 3.8,
                            avgLikes: 60000,
                            avgComments: 2500,
                            avgViews: 120000
                        },
                        {
                            platform: "youtube",
                            handle: "Lenskart",
                            url: "https://youtube.com/lenskart",
                            followers: 800000,
                            engagementRate: 3.7,
                            avgLikes: 20000,
                            avgComments: 1500,
                            avgViews: 80000
                        }
                    ]
                },
                brandAnalytics: {
                    totalFollowers: 3300000,
                    avgEngagementRate: 3.8,
                    monthlyEarnings: 7000000,
                    earningsChange: 18,
                    rating: 4.5,
                    audienceDemographics: {
                        gender: "Mixed",
                        ageRange: "16-45",
                        topLocations: ["Delhi", "Mumbai", "Bangalore", "Chennai"]
                    },
                    performanceMetrics: {
                        reach: 10000000,
                        impressions: 15000000,
                        engagement: 400000,
                        conversionRate: 3.8
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 3300000,
                            engagementRate: 3.8,
                            earnings: 7000000,
                            reach: 10000000,
                            impressions: 15000000
                        }
                    ],
                    campaignMetrics: {
                        totalCampaigns: 250,
                        activeCampaigns: 22,
                        totalSpend: 30000000,
                        totalRevenue: 90000000,
                        avgROI: 200
                    }
                }
            },
            {
                // 5. Zomato
                brandInfo: {
                    brandName: "Zomato",
                    email: "zomato@example.com",
                    username: "zomato",
                    displayName: "Zomato",
                    bio: "India's leading food delivery and restaurant discovery platform.",
                    phone: "+919876543214",
                    industry: "Food Delivery",
                    location: "Gurgaon, India",
                    website: "https://zomato.com",
                    mission: "To ensure nobody has a bad meal.",
                    values: ["Food", "Technology", "Customer First", "Innovation"],
                    verified: true,
                    logoUrl: "/images/brands/zomato-logo.png",
                    bannerUrl: "/images/brands/zomato-banner.jpeg",
                    categories: ["Food", "Technology", "Delivery", "E-commerce"],
                    languages: ["English", "Hindi"],
                    currentCampaign: "Food for Everyone",
                    about: "Zomato is India's leading food delivery and restaurant discovery platform.",
                    influenceRegions: "India",
                    status: "active",
                    tagline: "Never Have a Bad Meal",
                    primaryMarket: "India",
                    completedCampaigns: 400,
                    influencerPartnerships: 1200,
                    avgCampaignRating: 4.9,
                    totalAudience: 15000000,
                    targetAgeRange: "18-45",
                    targetGender: "All",
                    targetInterests: ["Food", "Technology", "Lifestyle", "Entertainment"]
                },
                brandSocials: {
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@zomato",
                            url: "https://instagram.com/zomato",
                            followers: 5000000,
                            engagementRate: 4.8,
                            avgLikes: 150000,
                            avgComments: 8000,
                            avgViews: 300000
                        },
                        {
                            platform: "youtube",
                            handle: "Zomato",
                            url: "https://youtube.com/zomato",
                            followers: 3000000,
                            engagementRate: 4.5,
                            avgLikes: 60000,
                            avgComments: 4000,
                            avgViews: 200000
                        }
                    ]
                },
                brandAnalytics: {
                    totalFollowers: 8000000,
                    avgEngagementRate: 4.7,
                    monthlyEarnings: 15000000,
                    earningsChange: 30,
                    rating: 4.9,
                    audienceDemographics: {
                        gender: "Mixed",
                        ageRange: "18-45",
                        topLocations: ["Mumbai", "Delhi", "Bangalore", "Hyderabad"]
                    },
                    performanceMetrics: {
                        reach: 20000000,
                        impressions: 30000000,
                        engagement: 800000,
                        conversionRate: 5.0
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 8000000,
                            engagementRate: 4.7,
                            earnings: 15000000,
                            reach: 20000000,
                            impressions: 30000000
                        }
                    ],
                    campaignMetrics: {
                        totalCampaigns: 400,
                        activeCampaigns: 35,
                        totalSpend: 60000000,
                        totalRevenue: 180000000,
                        avgROI: 200
                    }
                }
            }
        ];

        // Insert brands into database
        for (const brand of brands) {
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

        console.log('Brand data initialized successfully');
    } catch (error) {
        console.error('Error initializing brand data:', error);
        throw error; // Re-throw to handle in main initialization
    }
};

module.exports = { initializeBrandData };