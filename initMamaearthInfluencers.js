const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('./config/InfluencerMongo');
const bcrypt = require('bcrypt');

const initializeMamaearthInfluencers = async () => {
    try {
        // Hash password for all influencers
        const hashedPassword = await bcrypt.hash('Influencer@123', 10);

        const influencers = [
            {
                // 1. Komal Pandey
                influencerInfo: {
                    fullName: "Komal Pandey",
                    email: "komal@example.com",
                    username: "komalpandey",
                    displayName: "Komal Pandey",
                    bio: "Fashion & Beauty Content Creator | Stylist | Digital Creator",
                    phone: "+919876543215",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/komal-profile.jpg",
                    bannerUrl: "/images/influencers/komal-banner.jpg",
                    verified: true,
                    niche: "Fashion & Beauty",
                    categories: ["Fashion", "Beauty", "Lifestyle", "Skincare"],
                    languages: ["English", "Hindi"],
                    website: "https://komalpandey.com",
                    about: "Fashion and beauty content creator known for her unique style and beauty tips. Specializes in affordable fashion and skincare.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "18-35",
                    audienceGender: "Female",
                    avgRating: 4.8,
                    completedCollabs: 180,
                    password: hashedPassword,
                    status: 'active'
                },
                socials: {
                    influencerId: null, // Will be set after creation
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@komalpandey",
                            socialHandle: "komalpandey",
                            followers: 1200000,
                            engagementRate: 4.5,
                            avgLikes: 50000,
                            avgComments: 2000,
                            avgViews: 0,
                            category: "fashion"
                        },
                        {
                            platform: "youtube",
                            handle: "@KomalPandey",
                            socialHandle: "KomalPandey",
                            followers: 800000,
                            engagementRate: 5.2,
                            avgLikes: 40000,
                            avgComments: 3000,
                            avgViews: 200000,
                            category: "fashion"
                        }
                    ]
                },
                analytics: {
                    influencerId: null, // Will be set after creation
                    totalFollowers: 2000000,
                    avgEngagementRate: 4.85,
                    monthlyEarnings: 50000,
                    earningsChange: 15,
                    rating: 4.8,
                    audienceDemographics: {
                        gender: "Female",
                        ageRange: "18-35",
                        topLocations: ["Mumbai", "Delhi", "Bangalore"]
                    },
                    performanceMetrics: {
                        reach: 2500000,
                        impressions: 3000000,
                        engagement: 120000,
                        conversionRate: 3.5
                    }
                }
            },
            {
                // 2. Malvika Sitlani
                influencerInfo: {
                    fullName: "Malvika Sitlani",
                    email: "malvika@example.com",
                    username: "malvikasitlani",
                    displayName: "Malvika Sitlani",
                    bio: "Beauty & Lifestyle Creator | Makeup Artist | Digital Creator",
                    phone: "+919876543216",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/malvika-profile.jpg",
                    bannerUrl: "/images/influencers/malvika-banner.jpg",
                    verified: true,
                    niche: "Beauty & Lifestyle",
                    categories: ["Beauty", "Lifestyle", "Skincare", "Makeup"],
                    languages: ["English", "Hindi"],
                    website: "https://malvikasitlani.com",
                    about: "Beauty and lifestyle content creator known for her makeup tutorials and skincare reviews. Specializes in natural and organic beauty products.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "18-35",
                    audienceGender: "Female",
                    avgRating: 4.9,
                    completedCollabs: 150,
                    password: hashedPassword,
                    status: 'active'
                },
                socials: {
                    influencerId: null,
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@malvikasitlani",
                            socialHandle: "malvikasitlani",
                            followers: 1500000,
                            engagementRate: 4.8,
                            avgLikes: 60000,
                            avgComments: 2500,
                            avgViews: 0,
                            category: "beauty"
                        },
                        {
                            platform: "youtube",
                            handle: "@MalvikaSitlani",
                            socialHandle: "MalvikaSitlani",
                            followers: 1000000,
                            engagementRate: 5.5,
                            avgLikes: 50000,
                            avgComments: 4000,
                            avgViews: 300000,
                            category: "beauty"
                        }
                    ]
                },
                analytics: {
                    influencerId: null,
                    totalFollowers: 2500000,
                    avgEngagementRate: 5.15,
                    monthlyEarnings: 60000,
                    earningsChange: 20,
                    rating: 4.9,
                    audienceDemographics: {
                        gender: "Female",
                        ageRange: "18-35",
                        topLocations: ["Mumbai", "Delhi", "Bangalore"]
                    },
                    performanceMetrics: {
                        reach: 3000000,
                        impressions: 3500000,
                        engagement: 150000,
                        conversionRate: 4.0
                    }
                }
            },
            {
                // 3. Shreya Jain
                influencerInfo: {
                    fullName: "Shreya Jain",
                    email: "shreya@example.com",
                    username: "shreyajain",
                    displayName: "Shreya Jain",
                    bio: "Beauty & Skincare Expert | Makeup Artist | Digital Creator",
                    phone: "+919876543217",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/shreya-profile.jpg",
                    bannerUrl: "/images/influencers/shreya-banner.jpg",
                    verified: true,
                    niche: "Beauty & Skincare",
                    categories: ["Beauty", "Skincare", "Makeup", "Lifestyle"],
                    languages: ["English", "Hindi"],
                    website: "https://shreyajain.com",
                    about: "Beauty and skincare expert known for her detailed product reviews and makeup tutorials. Specializes in natural and organic beauty products.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "18-35",
                    audienceGender: "Female",
                    avgRating: 4.9,
                    completedCollabs: 200,
                    password: hashedPassword,
                    status: 'active'
                },
                socials: {
                    influencerId: null,
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@shreyajain",
                            socialHandle: "shreyajain",
                            followers: 2000000,
                            engagementRate: 5.0,
                            avgLikes: 80000,
                            avgComments: 3000,
                            avgViews: 0,
                            category: "beauty"
                        },
                        {
                            platform: "youtube",
                            handle: "@ShreyaJain",
                            socialHandle: "ShreyaJain",
                            followers: 1500000,
                            engagementRate: 5.8,
                            avgLikes: 70000,
                            avgComments: 5000,
                            avgViews: 400000,
                            category: "beauty"
                        }
                    ]
                },
                analytics: {
                    influencerId: null,
                    totalFollowers: 3500000,
                    avgEngagementRate: 5.4,
                    monthlyEarnings: 75000,
                    earningsChange: 25,
                    rating: 4.9,
                    audienceDemographics: {
                        gender: "Female",
                        ageRange: "18-35",
                        topLocations: ["Mumbai", "Delhi", "Bangalore"]
                    },
                    performanceMetrics: {
                        reach: 4000000,
                        impressions: 4500000,
                        engagement: 200000,
                        conversionRate: 4.5
                    }
                }
            },
            {
                // 4. Debasree Banerjee
                influencerInfo: {
                    fullName: "Debasree Banerjee",
                    email: "debasree@example.com",
                    username: "debasreebanerjee",
                    displayName: "Debasree Banerjee",
                    bio: "Beauty & Lifestyle Creator | Makeup Artist | Digital Creator",
                    phone: "+919876543218",
                    location: "Kolkata, India",
                    profilePicUrl: "/images/influencers/debasree-profile.jpg",
                    bannerUrl: "/images/influencers/debasree-banner.jpg",
                    verified: true,
                    niche: "Beauty & Lifestyle",
                    categories: ["Beauty", "Lifestyle", "Skincare", "Makeup"],
                    languages: ["English", "Hindi", "Bengali"],
                    website: "https://debasreebanerjee.com",
                    about: "Beauty and lifestyle content creator known for her makeup tutorials and skincare reviews. Specializes in natural and organic beauty products.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "18-35",
                    audienceGender: "Female",
                    avgRating: 4.8,
                    completedCollabs: 120,
                    password: hashedPassword,
                    status: 'active'
                },
                socials: {
                    influencerId: null,
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@debasreebanerjee",
                            socialHandle: "debasreebanerjee",
                            followers: 900000,
                            engagementRate: 4.2,
                            avgLikes: 40000,
                            avgComments: 1800,
                            avgViews: 0,
                            category: "beauty"
                        },
                        {
                            platform: "youtube",
                            handle: "@DebasreeBanerjee",
                            socialHandle: "DebasreeBanerjee",
                            followers: 600000,
                            engagementRate: 4.8,
                            avgLikes: 30000,
                            avgComments: 2500,
                            avgViews: 150000,
                            category: "beauty"
                        }
                    ]
                },
                analytics: {
                    influencerId: null,
                    totalFollowers: 1500000,
                    avgEngagementRate: 4.5,
                    monthlyEarnings: 40000,
                    earningsChange: 10,
                    rating: 4.8,
                    audienceDemographics: {
                        gender: "Female",
                        ageRange: "18-35",
                        topLocations: ["Kolkata", "Mumbai", "Delhi"]
                    },
                    performanceMetrics: {
                        reach: 1800000,
                        impressions: 2000000,
                        engagement: 90000,
                        conversionRate: 3.0
                    }
                }
            },
            {
                // 5. Jovita George
                influencerInfo: {
                    fullName: "Jovita George",
                    email: "jovita@example.com",
                    username: "jovitageorge",
                    displayName: "Jovita George",
                    bio: "Beauty & Lifestyle Creator | Makeup Artist | Digital Creator",
                    phone: "+919876543219",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/jovita-profile.jpg",
                    bannerUrl: "/images/influencers/jovita-banner.jpg",
                    verified: true,
                    niche: "Beauty & Lifestyle",
                    categories: ["Beauty", "Lifestyle", "Skincare", "Makeup"],
                    languages: ["English", "Hindi"],
                    website: "https://jovitageorge.com",
                    about: "Beauty and lifestyle content creator known for her makeup tutorials and skincare reviews. Specializes in natural and organic beauty products.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "18-35",
                    audienceGender: "Female",
                    avgRating: 4.7,
                    completedCollabs: 100,
                    password: hashedPassword,
                    status: 'active'
                },
                socials: {
                    influencerId: null,
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@jovitageorge",
                            socialHandle: "jovitageorge",
                            followers: 800000,
                            engagementRate: 4.0,
                            avgLikes: 35000,
                            avgComments: 1500,
                            avgViews: 0,
                            category: "beauty"
                        },
                        {
                            platform: "youtube",
                            handle: "@JovitaGeorge",
                            socialHandle: "JovitaGeorge",
                            followers: 500000,
                            engagementRate: 4.5,
                            avgLikes: 25000,
                            avgComments: 2000,
                            avgViews: 120000,
                            category: "beauty"
                        }
                    ]
                },
                analytics: {
                    influencerId: null,
                    totalFollowers: 1300000,
                    avgEngagementRate: 4.25,
                    monthlyEarnings: 35000,
                    earningsChange: 8,
                    rating: 4.7,
                    audienceDemographics: {
                        gender: "Female",
                        ageRange: "18-35",
                        topLocations: ["Mumbai", "Delhi", "Bangalore"]
                    },
                    performanceMetrics: {
                        reach: 1500000,
                        impressions: 1800000,
                        engagement: 70000,
                        conversionRate: 2.8
                    }
                }
            }
        ];

        // Insert influencers
        for (const influencer of influencers) {
            const { influencerInfo, socials, analytics } = influencer;

            // Check if influencer already exists
            const existingInfluencer = await InfluencerInfo.findOne({ email: influencerInfo.email });

            if (existingInfluencer) {
                console.log(`Influencer ${influencerInfo.fullName} already exists, skipping...`);
                continue;
            }

            // Create influencer info
            const newInfluencer = await InfluencerInfo.create(influencerInfo);

            // Create social media info with influencerId
            const socialsData = {
                ...socials,
                influencerId: newInfluencer._id
            };
            await InfluencerSocials.create(socialsData);

            // Create analytics info with influencerId
            const analyticsData = {
                ...analytics,
                influencerId: newInfluencer._id
            };
            await InfluencerAnalytics.create(analyticsData);

            console.log(`Successfully created influencer: ${influencerInfo.fullName}`);
        }

        console.log('Successfully initialized Mamaearth influencers');
    } catch (error) {
        console.error('Error initializing Mamaearth influencers:', error);
        throw error; // Re-throw the error to handle it in the calling code
    }
};

// Export both the function and an object containing the function
module.exports = {
    initializeMamaearthInfluencers
};