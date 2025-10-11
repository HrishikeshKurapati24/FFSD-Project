const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('./config/InfluencerMongo');
const bcrypt = require('bcrypt');

const initializeInfluencerData = async () => {
    try {
        // Hash password for all influencers
        const hashedPassword = await bcrypt.hash('Influencer@123', 10);

        const influencers = [
            {
                // 1. Kusha Kapila
                influencerInfo: {
                    fullName: "Kusha Kapila",
                    email: "kusha@example.com",
                    username: "kushakapila",
                    displayName: "Kusha Kapila",
                    bio: "Digital Content Creator | Comedian | Actor | Fashion Enthusiast",
                    phone: "+919876543210",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/kapila-profile.png",
                    bannerUrl: "/images/influencers/kapila-banner.png",
                    verified: true,
                    niche: "Lifestyle & Comedy",
                    categories: ["Fashion", "Comedy", "Lifestyle", "Entertainment"],
                    languages: ["English", "Hindi"],
                    website: "https://kushakapila.com",
                    about: "Digital content creator known for her relatable comedy sketches and fashion content. Former fashion editor turned full-time content creator.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "18-35",
                    audienceGender: "Female",
                    avgRating: 4.8,
                    completedCollabs: 150,
                    bestPosts: [
                        {
                            platform: "Instagram",
                            title: "Fashion Week Highlights",
                            thumbnail: "/images/posts/kusha-fashion.jpg",
                            likes: 50000,
                            comments: 2000,
                            views: 100000
                        },
                        {
                            platform: "YouTube",
                            title: "Day in the Life of a Content Creator",
                            thumbnail: "/images/posts/kusha-vlog.jpg",
                            likes: 25000,
                            comments: 1500,
                            views: 200000
                        }
                    ]
                },
                influencerSocials: {
                    socialHandle: "@kushakapila",
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@kushakapila",
                            followers: 3000000,
                            engagementRate: 4.5,
                            avgLikes: 75000,
                            avgComments: 3000,
                            avgViews: 150000,
                            category: "lifestyle"
                        },
                        {
                            platform: "youtube",
                            handle: "Kusha Kapila",
                            followers: 1000000,
                            engagementRate: 4.2,
                            avgLikes: 30000,
                            avgComments: 2000,
                            avgViews: 100000,
                            category: "lifestyle"
                        }
                    ]
                },
                influencerAnalytics: {
                    totalFollowers: 4000000,
                    avgEngagementRate: 4.4,
                    monthlyEarnings: 800000,
                    earningsChange: 20,
                    rating: 4.8,
                    audienceDemographics: {
                        gender: "Female",
                        ageRange: "18-35",
                        topLocations: ["Mumbai", "Delhi", "Bangalore", "Hyderabad"]
                    },
                    performanceMetrics: {
                        reach: 6000000,
                        impressions: 9000000,
                        engagement: 300000,
                        conversionRate: 4.2
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 4000000,
                            engagementRate: 4.4,
                            earnings: 800000,
                            reach: 6000000,
                            impressions: 9000000
                        }
                    ]
                }
            },
            {
                // 2. Dolly Singh
                influencerInfo: {
                    fullName: "Dolly Singh",
                    email: "dolly@example.com",
                    username: "dollysingh",
                    displayName: "Dolly Singh",
                    bio: "Content Creator | Comedian | Actor | Writer",
                    phone: "+919876543211",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/dolly-profile.png",
                    bannerUrl: "/images/influencers/dolly-banner.png",
                    verified: true,
                    niche: "Comedy & Entertainment",
                    categories: ["Comedy", "Entertainment", "Writing", "Acting"],
                    languages: ["English", "Hindi"],
                    website: "https://dollysingh.com",
                    about: "Digital content creator known for her witty comedy sketches and relatable content. Former writer turned full-time content creator.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "16-35",
                    audienceGender: "Mixed",
                    avgRating: 4.7,
                    completedCollabs: 120,
                    bestPosts: [
                        {
                            platform: "Instagram",
                            title: "College Life Sketches",
                            thumbnail: "/images/posts/dolly-comedy.jpg",
                            likes: 45000,
                            comments: 1800,
                            views: 90000
                        },
                        {
                            platform: "YouTube",
                            title: "Behind the Scenes of Content Creation",
                            thumbnail: "/images/posts/dolly-bts.jpg",
                            likes: 22000,
                            comments: 1200,
                            views: 180000
                        }
                    ]
                },
                influencerSocials: {
                    socialHandle: "@dollysingh",
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@dollysingh",
                            followers: 2500000,
                            engagementRate: 4.3,
                            avgLikes: 60000,
                            avgComments: 2500,
                            avgViews: 120000,
                            category: "comedy"
                        },
                        {
                            platform: "youtube",
                            handle: "Dolly Singh",
                            followers: 800000,
                            engagementRate: 4.0,
                            avgLikes: 25000,
                            avgComments: 1800,
                            avgViews: 90000,
                            category: "comedy"
                        }
                    ]
                },
                influencerAnalytics: {
                    totalFollowers: 3300000,
                    avgEngagementRate: 4.2,
                    monthlyEarnings: 600000,
                    earningsChange: 15,
                    rating: 4.7,
                    audienceDemographics: {
                        gender: "Mixed",
                        ageRange: "16-35",
                        topLocations: ["Mumbai", "Delhi", "Bangalore", "Pune"]
                    },
                    performanceMetrics: {
                        reach: 5000000,
                        impressions: 7500000,
                        engagement: 250000,
                        conversionRate: 3.8
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 3300000,
                            engagementRate: 4.2,
                            earnings: 600000,
                            reach: 5000000,
                            impressions: 7500000
                        }
                    ]
                }
            },
            {
                // 3. Masoom Minawala
                influencerInfo: {
                    fullName: "Masoom Minawala",
                    email: "masoom@example.com",
                    username: "masoomminawala",
                    displayName: "Masoom Minawala",
                    bio: "Fashion Influencer | Entrepreneur | Digital Creator",
                    phone: "+919876543212",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/masoom-profile.jpeg",
                    bannerUrl: "/images/influencers/masoom-banner.png",
                    verified: true,
                    niche: "Fashion & Lifestyle",
                    categories: ["Fashion", "Lifestyle", "Entrepreneurship", "Travel"],
                    languages: ["English", "Hindi"],
                    website: "https://masoomminawala.com",
                    about: "Fashion influencer and entrepreneur known for her luxury fashion content and business ventures.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "20-40",
                    audienceGender: "Female",
                    avgRating: 4.9,
                    completedCollabs: 200,
                    bestPosts: [
                        {
                            platform: "Instagram",
                            title: "Paris Fashion Week",
                            thumbnail: "/images/posts/masoom-fashion.jpg",
                            likes: 100000,
                            comments: 5000,
                            views: 200000
                        },
                        {
                            platform: "YouTube",
                            title: "Luxury Fashion Haul",
                            thumbnail: "/images/posts/masoom-haul.jpg",
                            likes: 50000,
                            comments: 3000,
                            views: 300000
                        }
                    ]
                },
                influencerSocials: {
                    socialHandle: "@masoomminawala",
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@masoomminawala",
                            followers: 4000000,
                            engagementRate: 4.8,
                            avgLikes: 100000,
                            avgComments: 5000,
                            avgViews: 200000,
                            category: "fashion"
                        },
                        {
                            platform: "youtube",
                            handle: "Masoom Minawala",
                            followers: 1500000,
                            engagementRate: 4.5,
                            avgLikes: 50000,
                            avgComments: 3000,
                            avgViews: 150000,
                            category: "fashion"
                        }
                    ]
                },
                influencerAnalytics: {
                    totalFollowers: 5500000,
                    avgEngagementRate: 4.7,
                    monthlyEarnings: 1200000,
                    earningsChange: 25,
                    rating: 4.9,
                    audienceDemographics: {
                        gender: "Female",
                        ageRange: "20-40",
                        topLocations: ["Mumbai", "Delhi", "Bangalore", "Dubai"]
                    },
                    performanceMetrics: {
                        reach: 8000000,
                        impressions: 12000000,
                        engagement: 400000,
                        conversionRate: 4.5
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 5500000,
                            engagementRate: 4.7,
                            earnings: 1200000,
                            reach: 8000000,
                            impressions: 12000000
                        }
                    ]
                }
            },
            {
                // 4. Ranveer Allahbadia
                influencerInfo: {
                    fullName: "Ranveer Allahbadia",
                    email: "ranveer@example.com",
                    username: "ranveerallahbadia",
                    displayName: "BeerBiceps",
                    bio: "Fitness Influencer | Entrepreneur | Podcast Host",
                    phone: "+919876543213",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/ranveer-profile.jpeg",
                    bannerUrl: "/images/influencers/ranveer-banner.png",
                    verified: true,
                    niche: "Fitness & Motivation",
                    categories: ["Fitness", "Motivation", "Entrepreneurship", "Health"],
                    languages: ["English", "Hindi"],
                    website: "https://beerbiceps.com",
                    about: "Fitness influencer and entrepreneur known for his fitness content and motivational videos.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "18-35",
                    audienceGender: "Male",
                    avgRating: 4.8,
                    completedCollabs: 180,
                    bestPosts: [
                        {
                            platform: "Instagram",
                            title: "Fitness Transformation",
                            thumbnail: "/images/posts/ranveer-fitness.jpg",
                            likes: 80000,
                            comments: 4000,
                            views: 150000
                        },
                        {
                            platform: "YouTube",
                            title: "Fitness Tips and Tricks",
                            thumbnail: "/images/posts/ranveer-tips.jpg",
                            likes: 40000,
                            comments: 2500,
                            views: 250000
                        }
                    ]
                },
                influencerSocials: {
                    socialHandle: "@beerbiceps",
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@beerbiceps",
                            followers: 3500000,
                            engagementRate: 4.6,
                            avgLikes: 80000,
                            avgComments: 4000,
                            avgViews: 150000,
                            category: "fitness"
                        },
                        {
                            platform: "youtube",
                            handle: "BeerBiceps",
                            followers: 2000000,
                            engagementRate: 4.4,
                            avgLikes: 40000,
                            avgComments: 2500,
                            avgViews: 200000,
                            category: "fitness"
                        }
                    ]
                },
                influencerAnalytics: {
                    totalFollowers: 5500000,
                    avgEngagementRate: 4.5,
                    monthlyEarnings: 1000000,
                    earningsChange: 22,
                    rating: 4.8,
                    audienceDemographics: {
                        gender: "Male",
                        ageRange: "18-35",
                        topLocations: ["Mumbai", "Delhi", "Bangalore", "Hyderabad"]
                    },
                    performanceMetrics: {
                        reach: 7000000,
                        impressions: 10000000,
                        engagement: 350000,
                        conversionRate: 4.0
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 5500000,
                            engagementRate: 4.5,
                            earnings: 1000000,
                            reach: 7000000,
                            impressions: 10000000
                        }
                    ]
                }
            },
            {
                // 5. Prajakta Koli
                influencerInfo: {
                    fullName: "Prajakta Koli",
                    email: "prajakta@example.com",
                    username: "prajaktakoli",
                    displayName: "MostlySane",
                    bio: "Digital Content Creator | Actor | Comedian | Writer",
                    phone: "+919876543214",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/prajakta-profile.jpeg",
                    bannerUrl: "/images/influencers/prajakta-banner.jpeg",
                    verified: true,
                    niche: "Comedy & Entertainment",
                    categories: ["Comedy", "Entertainment", "Acting", "Writing"],
                    languages: ["English", "Hindi"],
                    website: "https://mostlysane.com",
                    about: "Digital content creator known for her comedy sketches and acting. One of India's most popular content creators.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "16-35",
                    audienceGender: "Mixed",
                    avgRating: 4.9,
                    completedCollabs: 250,
                    bestPosts: [
                        {
                            platform: "Instagram",
                            title: "Comedy Sketches",
                            thumbnail: "/images/posts/prajakta-comedy.jpg",
                            likes: 90000,
                            comments: 4500,
                            views: 180000
                        },
                        {
                            platform: "YouTube",
                            title: "Day in the Life",
                            thumbnail: "/images/posts/prajakta-vlog.jpg",
                            likes: 45000,
                            comments: 3000,
                            views: 280000
                        }
                    ]
                },
                influencerSocials: {
                    socialHandle: "@mostlysane",
                    platforms: [
                        {
                            platform: "instagram",
                            handle: "@mostlysane",
                            followers: 4500000,
                            engagementRate: 4.7,
                            avgLikes: 90000,
                            avgComments: 4500,
                            avgViews: 180000,
                            category: "comedy"
                        },
                        {
                            platform: "youtube",
                            handle: "MostlySane",
                            followers: 2500000,
                            engagementRate: 4.5,
                            avgLikes: 45000,
                            avgComments: 3000,
                            avgViews: 250000,
                            category: "comedy"
                        }
                    ]
                },
                influencerAnalytics: {
                    totalFollowers: 7000000,
                    avgEngagementRate: 4.6,
                    monthlyEarnings: 1500000,
                    earningsChange: 28,
                    rating: 4.9,
                    audienceDemographics: {
                        gender: "Mixed",
                        ageRange: "16-35",
                        topLocations: ["Mumbai", "Delhi", "Bangalore", "Hyderabad"]
                    },
                    performanceMetrics: {
                        reach: 9000000,
                        impressions: 15000000,
                        engagement: 450000,
                        conversionRate: 4.8
                    },
                    monthlyStats: [
                        {
                            month: "2024-03",
                            followers: 7000000,
                            engagementRate: 4.6,
                            earnings: 1500000,
                            reach: 9000000,
                            impressions: 15000000
                        }
                    ]
                }
            }
        ];

        // Insert influencers into database
        for (const influencer of influencers) {
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

        console.log('Influencer data initialized successfully');
    } catch (error) {
        console.error('Error initializing influencer data:', error);
        throw error; // Re-throw to handle in main initialization
    }
};

module.exports = { initializeInfluencerData };