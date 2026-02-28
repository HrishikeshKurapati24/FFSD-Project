const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('./models/InfluencerMongo');
const bcrypt = require('bcrypt');
const { uploadSeedImage } = require('./utils/seedHelpers');

const initializeExtendedInfluencerData = async () => {
    try {
        // Hash password for all influencers
        const hashedPassword = await bcrypt.hash('Influencer@123', 10);

        const extendedInfluencers = [
            {
                // 6. Mithila Palkar
                influencerInfo: {
                    fullName: "Mithila Palkar",
                    email: "mithila@example.com",
                    username: "mithilapalkar",
                    displayName: "Mithila Palkar",
                    bio: "Actor | Content Creator | Singer | Digital Artist",
                    phone: "+919876543215",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/mithila-profile.png",
                    bannerUrl: "/images/influencers/mithila-banner.jpg",
                    verified: true,
                    niche: "Entertainment & Acting",
                    categories: ["Acting", "Entertainment", "Music", "Digital Art"],
                    languages: ["English", "Hindi", "Marathi"],
                    website: "https://mithilapalkar.com",
                    about: "Actor and content creator known for her work in web series and digital content. Also a talented singer and digital artist.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "18-40",
                    audienceGender: "Mixed",
                    avgRating: 4.7,
                    completedCollabs: 180,
                    bestPosts: [
                        {
                            platform: "Instagram",
                            title: "Behind the Scenes",
                            thumbnail: "/images/posts/mithila-bts.jpg",
                            likes: 35000,
                            comments: 1200,
                            views: 80000
                        },
                        {
                            platform: "YouTube",
                            title: "Singing Session",
                            thumbnail: "/images/posts/mithila-singing.jpg",
                            likes: 18000,
                            comments: 800,
                            views: 120000
                        }
                    ]
                },
                influencerSocials: {
                    socialHandle: "@mithilapalkar",
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@mithilapalkar",
                            followers: 2200000,
                            engagementRate: 4.2,
                            avgLikes: 55000,
                            avgComments: 2200,
                            avgViews: 110000,
                            category: "entertainment"
                        },
                        {
                            platform: "youtube",
                            handle: "Mithila Palkar",
                            followers: 800000,
                            engagementRate: 4.0,
                            avgLikes: 20000,
                            avgComments: 1000,
                            avgViews: 80000,
                            category: "entertainment"
                        }
                    ]
                },
                influencerAnalytics: {
                    totalFollowers: 3000000,
                    avgEngagementRate: 4.1,
                    monthlyEarnings: 700000,
                    earningsChange: 18,
                    rating: 4.7,
                    audienceDemographics: {
                        gender: "Mixed",
                        ageRange: "18-40",
                        topLocations: ["Mumbai", "Delhi", "Bangalore", "Pune"]
                    },
                    performanceMetrics: {
                        reach: 4500000,
                        impressions: 6800000,
                        engagement: 220000,
                        conversionRate: 3.9
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 3000000,
                            engagementRate: 4.1,
                            earnings: 700000,
                            reach: 4500000,
                            impressions: 6800000
                        }
                    ]
                }
            },
            {
                // 7. Aashna Shroff
                influencerInfo: {
                    fullName: "Aashna Shroff",
                    email: "aashna@example.com",
                    username: "aashnashroff",
                    displayName: "Aashna Shroff",
                    bio: "Fashion Blogger | Lifestyle Influencer | Entrepreneur",
                    phone: "+919876543216",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/aashna-profile.jpeg",
                    bannerUrl: "/images/influencers/aashna-banner.jpg",
                    verified: true,
                    niche: "Fashion & Lifestyle",
                    categories: ["Fashion", "Lifestyle", "Beauty", "Travel"],
                    languages: ["English", "Hindi"],
                    website: "https://aashnashroff.com",
                    about: "Fashion blogger and lifestyle influencer known for her chic style and travel content.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "20-35",
                    audienceGender: "Female",
                    avgRating: 4.6,
                    completedCollabs: 160,
                    bestPosts: [
                        {
                            platform: "Instagram",
                            title: "Fashion Week Outfits",
                            thumbnail: "/images/posts/aashna-fashion.jpg",
                            likes: 42000,
                            comments: 1800,
                            views: 95000
                        },
                        {
                            platform: "YouTube",
                            title: "Travel Vlog - Maldives",
                            thumbnail: "/images/posts/aashna-travel.jpg",
                            likes: 25000,
                            comments: 1200,
                            views: 150000
                        }
                    ]
                },
                influencerSocials: {
                    socialHandle: "@aashnashroff",
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@aashnashroff",
                            followers: 1800000,
                            engagementRate: 4.3,
                            avgLikes: 48000,
                            avgComments: 1900,
                            avgViews: 100000,
                            category: "fashion"
                        },
                        {
                            platform: "youtube",
                            handle: "Aashna Shroff",
                            followers: 600000,
                            engagementRate: 4.1,
                            avgLikes: 18000,
                            avgComments: 900,
                            avgViews: 90000,
                            category: "lifestyle"
                        }
                    ]
                },
                influencerAnalytics: {
                    totalFollowers: 2400000,
                    avgEngagementRate: 4.2,
                    monthlyEarnings: 600000,
                    earningsChange: 15,
                    rating: 4.6,
                    audienceDemographics: {
                        gender: "Female",
                        ageRange: "20-35",
                        topLocations: ["Mumbai", "Delhi", "Bangalore", "Hyderabad"]
                    },
                    performanceMetrics: {
                        reach: 3600000,
                        impressions: 5400000,
                        engagement: 180000,
                        conversionRate: 3.7
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 2400000,
                            engagementRate: 4.2,
                            earnings: 600000,
                            reach: 3600000,
                            impressions: 5400000
                        }
                    ]
                }
            },
            {
                // 8. Ashish Chanchlani
                influencerInfo: {
                    fullName: "Ashish Chanchlani",
                    email: "ashish@example.com",
                    username: "ashishchanchlani",
                    displayName: "Ashish Chanchlani",
                    bio: "Content Creator | Comedian | Actor | YouTuber",
                    phone: "+919876543217",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/ashish-profile.jpg",
                    bannerUrl: "/images/influencers/ashish-banner.jpg",
                    verified: true,
                    niche: "Comedy & Entertainment",
                    categories: ["Comedy", "Entertainment", "Acting", "YouTube"],
                    languages: ["English", "Hindi"],
                    website: "https://ashishchanchlani.com",
                    about: "Popular content creator known for his comedy sketches and entertaining videos.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "16-35",
                    audienceGender: "Mixed",
                    avgRating: 4.8,
                    completedCollabs: 220,
                    bestPosts: [
                        {
                            platform: "Instagram",
                            title: "Comedy Sketches",
                            thumbnail: "/images/posts/ashish-comedy.jpg",
                            likes: 85000,
                            comments: 4000,
                            views: 180000
                        },
                        {
                            platform: "YouTube",
                            title: "Funny Challenges",
                            thumbnail: "/images/posts/ashish-challenges.jpg",
                            likes: 45000,
                            comments: 2500,
                            views: 300000
                        }
                    ]
                },
                influencerSocials: {
                    socialHandle: "@ashishchanchlani",
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@ashishchanchlani",
                            followers: 3200000,
                            engagementRate: 4.6,
                            avgLikes: 80000,
                            avgComments: 3500,
                            avgViews: 160000,
                            category: "comedy"
                        },
                        {
                            platform: "youtube",
                            handle: "Ashish Chanchlani Vines",
                            followers: 1800000,
                            engagementRate: 4.4,
                            avgLikes: 40000,
                            avgComments: 2200,
                            avgViews: 200000,
                            category: "comedy"
                        }
                    ]
                },
                influencerAnalytics: {
                    totalFollowers: 5000000,
                    avgEngagementRate: 4.5,
                    monthlyEarnings: 1200000,
                    earningsChange: 25,
                    rating: 4.8,
                    audienceDemographics: {
                        gender: "Mixed",
                        ageRange: "16-35",
                        topLocations: ["Mumbai", "Delhi", "Bangalore", "Pune"]
                    },
                    performanceMetrics: {
                        reach: 7500000,
                        impressions: 11000000,
                        engagement: 400000,
                        conversionRate: 4.2
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 5000000,
                            engagementRate: 4.5,
                            earnings: 1200000,
                            reach: 7500000,
                            impressions: 11000000
                        }
                    ]
                }
            },
            {
                // 9. Diipa Khosla
                influencerInfo: {
                    fullName: "Diipa Khosla",
                    email: "diipa@example.com",
                    username: "diipakhosla",
                    displayName: "Diipa Khosla",
                    bio: "Fashion Influencer | Beauty Expert | Entrepreneur | Global Citizen",
                    phone: "+919876543218",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/diipa-profile.jpeg",
                    bannerUrl: "/images/influencers/diipa-banner.jpg",
                    verified: true,
                    niche: "Fashion & Beauty",
                    categories: ["Fashion", "Beauty", "Lifestyle", "Entrepreneurship"],
                    languages: ["English", "Hindi"],
                    website: "https://diipakhosla.com",
                    about: "Fashion influencer and beauty expert known for her international collaborations and entrepreneurial ventures.",
                    influenceRegions: "Global",
                    primaryMarket: "Global",
                    audienceAgeRange: "22-40",
                    audienceGender: "Female",
                    avgRating: 4.9,
                    completedCollabs: 280,
                    bestPosts: [
                        {
                            platform: "Instagram",
                            title: "International Fashion Week",
                            thumbnail: "/images/posts/diipa-fashion.jpg",
                            likes: 95000,
                            comments: 4500,
                            views: 220000
                        },
                        {
                            platform: "YouTube",
                            title: "Beauty Routine",
                            thumbnail: "/images/posts/diipa-beauty.jpg",
                            likes: 55000,
                            comments: 2800,
                            views: 250000
                        }
                    ]
                },
                influencerSocials: {
                    socialHandle: "@diipakhosla",
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@diipakhosla",
                            followers: 2800000,
                            engagementRate: 4.7,
                            avgLikes: 75000,
                            avgComments: 3200,
                            avgViews: 150000,
                            category: "fashion"
                        },
                        {
                            platform: "youtube",
                            handle: "Diipa Khosla",
                            followers: 1200000,
                            engagementRate: 4.5,
                            avgLikes: 35000,
                            avgComments: 1800,
                            avgViews: 120000,
                            category: "beauty"
                        }
                    ]
                },
                influencerAnalytics: {
                    totalFollowers: 4000000,
                    avgEngagementRate: 4.6,
                    monthlyEarnings: 1400000,
                    earningsChange: 30,
                    rating: 4.9,
                    audienceDemographics: {
                        gender: "Female",
                        ageRange: "22-40",
                        topLocations: ["Mumbai", "Delhi", "London", "New York"]
                    },
                    performanceMetrics: {
                        reach: 6000000,
                        impressions: 9000000,
                        engagement: 350000,
                        conversionRate: 4.4
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 4000000,
                            engagementRate: 4.6,
                            earnings: 1400000,
                            reach: 6000000,
                            impressions: 9000000
                        }
                    ]
                }
            },
            {
                // 10. Rohan Joshi
                influencerInfo: {
                    fullName: "Rohan Joshi",
                    email: "rohan@example.com",
                    username: "rohanjoshi",
                    displayName: "Rohan Joshi",
                    bio: "Comedian | Writer | Actor | Content Creator",
                    phone: "+919876543219",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/rohan-profile.jpg",
                    bannerUrl: "/images/influencers/rohan-banner.png",
                    verified: true,
                    niche: "Comedy & Writing",
                    categories: ["Comedy", "Writing", "Acting", "Entertainment"],
                    languages: ["English", "Hindi"],
                    website: "https://rohanjoshi.com",
                    about: "Comedian and writer known for his witty humor and engaging content across platforms.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "20-40",
                    audienceGender: "Mixed",
                    avgRating: 4.7,
                    completedCollabs: 140,
                    bestPosts: [
                        {
                            platform: "Instagram",
                            title: "Stand-up Comedy Clips",
                            thumbnail: "/images/posts/rohan-standup.jpg",
                            likes: 38000,
                            comments: 1600,
                            views: 85000
                        },
                        {
                            platform: "YouTube",
                            title: "Comedy Special",
                            thumbnail: "/images/posts/rohan-special.jpg",
                            likes: 28000,
                            comments: 1400,
                            views: 180000
                        }
                    ]
                },
                influencerSocials: {
                    socialHandle: "@rohanjoshi",
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@rohanjoshi",
                            followers: 1500000,
                            engagementRate: 4.2,
                            avgLikes: 42000,
                            avgComments: 1800,
                            avgViews: 95000,
                            category: "comedy"
                        },
                        {
                            platform: "youtube",
                            handle: "Rohan Joshi",
                            followers: 700000,
                            engagementRate: 4.0,
                            avgLikes: 22000,
                            avgComments: 1100,
                            avgViews: 100000,
                            category: "comedy"
                        }
                    ]
                },
                influencerAnalytics: {
                    totalFollowers: 2200000,
                    avgEngagementRate: 4.1,
                    monthlyEarnings: 550000,
                    earningsChange: 20,
                    rating: 4.7,
                    audienceDemographics: {
                        gender: "Mixed",
                        ageRange: "20-40",
                        topLocations: ["Mumbai", "Delhi", "Bangalore", "Pune"]
                    },
                    performanceMetrics: {
                        reach: 3300000,
                        impressions: 5000000,
                        engagement: 160000,
                        conversionRate: 3.8
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 2200000,
                            engagementRate: 4.1,
                            earnings: 550000,
                            reach: 3300000,
                            impressions: 5000000
                        }
                    ]
                }
            }
        ];

        // Insert influencers into database
        for (const influencer of extendedInfluencers) {
            // Upload images to Cloudinary
            if (influencer.influencerInfo.profilePicUrl) {
                influencer.influencerInfo.profilePicUrl = await uploadSeedImage(influencer.influencerInfo.profilePicUrl, 'influencers');
            }
            if (influencer.influencerInfo.bannerUrl) {
                influencer.influencerInfo.bannerUrl = await uploadSeedImage(influencer.influencerInfo.bannerUrl, 'influencers');
            }
            // First save the influencer info
            const influencerInfo = new InfluencerInfo({
                ...influencer.influencerInfo,
                password: hashedPassword
            });
            const savedInfluencer = await influencerInfo.save();

            // Then save socials with the influencer ID
            const influencerSocials = new InfluencerSocials({
                ...influencer.influencerSocials,
                influencerId: savedInfluencer._id
            });
            await influencerSocials.save();

            // Finally save analytics with the influencer ID
            const influencerAnalytics = new InfluencerAnalytics({
                ...influencer.influencerAnalytics,
                influencerId: savedInfluencer._id
            });
            await influencerAnalytics.save();
        }

        console.log('Extended influencer data initialized successfully');
    } catch (error) {
        console.error('Error initializing extended influencer data:', error);
        throw error;
    }
};

module.exports = { initializeExtendedInfluencerData };