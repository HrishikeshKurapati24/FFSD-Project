const mongoose = require('mongoose');
const { connectDB, closeConnection } = require('./models/mongoDB');
const { BrandInfo, BrandSocials, BrandAnalytics } = require('./config/BrandMongo');
const { InfluencerInfo, InfluencerSocials, InfluencerAnalytics } = require('./config/InfluencerMongo');
const { CampaignInfo, CampaignMetrics, CampaignPayments, CampaignInfluencers } = require('./config/CampaignMongo');
const { Message } = require('./config/MessageMongo');
const Offer = require('./config/OfferMongo');
const bcrypt = require('bcrypt');

const runCompleteSeedData = async () => {
    try {
        console.log('🚀 Starting complete seed data initialization...\n');

        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ MongoDB connected successfully!\n');

        // ========================================
        // BRAND DATA (5 brands)
        // ========================================
        console.log('📊 Creating brand data...');

        const hashedBrandPassword = await bcrypt.hash('Brand@123', 10);

        const brands = [
            {
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
                    logoUrl: "/images/brands/mamaearth-logo.jpg",
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
                }
            },
            {
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
                    bannerUrl: "/images/brands/boat-banner.jpg",
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
                }
            },
            {
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
                    logoUrl: "/images/brands/nykaa-logo.jpg",
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
                }
            },
            {
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
                    bannerUrl: "/images/brands/lenskart-banner.jpg",
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
                }
            },
            {
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
                    logoUrl: "/images/brands/zomato-logo.jpg",
                    bannerUrl: "/images/brands/zomato-banner.jpg",
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
                }
            }
        ];

        // Insert brands
        const savedBrands = [];
        for (const brand of brands) {
            const brandInfo = new BrandInfo({
                ...brand.brandInfo,
                password: hashedBrandPassword
            });
            const savedBrand = await brandInfo.save();
            savedBrands.push(savedBrand);

            // Create socials
            const brandSocials = new BrandSocials({
                brandId: savedBrand._id,
                platforms: [
                    {
                        platform: "instagram",
                        handle: `@${brand.brandInfo.username}`,
                        url: `https://instagram.com/${brand.brandInfo.username}`,
                        followers: Math.floor(Math.random() * 5000000) + 1000000,
                        engagementRate: Math.random() * 2 + 3.5,
                        avgLikes: Math.floor(Math.random() * 100000) + 10000,
                        avgComments: Math.floor(Math.random() * 5000) + 500,
                        avgViews: Math.floor(Math.random() * 200000) + 50000
                    }
                ]
            });
            await brandSocials.save();

            // Create analytics
            const brandAnalytics = new BrandAnalytics({
                brandId: savedBrand._id,
                totalFollowers: Math.floor(Math.random() * 5000000) + 1000000,
                avgEngagementRate: Math.random() * 2 + 3.5,
                monthlyEarnings: Math.floor(Math.random() * 15000000) + 5000000,
                earningsChange: Math.floor(Math.random() * 30) + 10,
                rating: Math.random() * 1 + 4.0,
                audienceDemographics: {
                    gender: brand.brandInfo.targetGender === "All" ? "Mixed" : brand.brandInfo.targetGender,
                    ageRange: brand.brandInfo.targetAgeRange,
                    topLocations: ["Mumbai", "Delhi", "Bangalore", "Hyderabad"]
                },
                performanceMetrics: {
                    reach: Math.floor(Math.random() * 15000000) + 5000000,
                    impressions: Math.floor(Math.random() * 25000000) + 10000000,
                    engagement: Math.floor(Math.random() * 800000) + 200000,
                    conversionRate: Math.random() * 3 + 3.0
                },
                campaignMetrics: {
                    totalCampaigns: brand.brandInfo.completedCampaigns,
                    activeCampaigns: Math.floor(Math.random() * 30) + 10,
                    totalSpend: Math.floor(Math.random() * 50000000) + 20000000,
                    totalRevenue: Math.floor(Math.random() * 150000000) + 50000000,
                    avgROI: Math.floor(Math.random() * 100) + 150
                }
            });
            await brandAnalytics.save();
        }

        console.log(`✅ Created ${savedBrands.length} brands with complete data`);

        // ========================================
        // INFLUENCER DATA (5 influencers)
        // ========================================
        console.log('\n👥 Creating influencer data...');

        const hashedInfluencerPassword = await bcrypt.hash('Influencer@123', 10);

        const influencers = [
            {
                influencerInfo: {
                    fullName: "Kusha Kapila",
                    email: "kusha@example.com",
                    username: "kushakapila",
                    displayName: "Kusha Kapila",
                    bio: "Digital Content Creator | Comedian | Actor | Fashion Enthusiast",
                    phone: "+919876543210",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/kusha-profile.jpg",
                    bannerUrl: "/images/influencers/kusha-banner.jpg",
                    verified: true,
                    niche: "Lifestyle & Comedy",
                    categories: ["Fashion", "Comedy", "Lifestyle", "Entertainment"],
                    languages: ["English", "Hindi"],
                    website: "https://kushakapila.com",
                    about: "Digital content creator known for her relatable comedy sketches and fashion content.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "18-35",
                    audienceGender: "Female",
                    avgRating: 4.8,
                    completedCollabs: 150
                }
            },
            {
                influencerInfo: {
                    fullName: "Dolly Singh",
                    email: "dolly@example.com",
                    username: "dollysingh",
                    displayName: "Dolly Singh",
                    bio: "Content Creator | Comedian | Actor | Writer",
                    phone: "+919876543211",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/dolly-profile.jpg",
                    bannerUrl: "/images/influencers/dolly-banner.jpg",
                    verified: true,
                    niche: "Comedy & Entertainment",
                    categories: ["Comedy", "Entertainment", "Writing", "Acting"],
                    languages: ["English", "Hindi"],
                    website: "https://dollysingh.com",
                    about: "Digital content creator known for her witty comedy sketches and relatable content.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "16-35",
                    audienceGender: "Mixed",
                    avgRating: 4.7,
                    completedCollabs: 120
                }
            },
            {
                influencerInfo: {
                    fullName: "Masoom Minawala",
                    email: "masoom@example.com",
                    username: "masoomminawala",
                    displayName: "Masoom Minawala",
                    bio: "Fashion Influencer | Entrepreneur | Digital Creator",
                    phone: "+919876543212",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/masoom-profile.jpg",
                    bannerUrl: "/images/influencers/masoom-banner.jpg",
                    verified: true,
                    niche: "Fashion & Lifestyle",
                    categories: ["Fashion", "Lifestyle", "Entrepreneurship", "Travel"],
                    languages: ["English", "Hindi"],
                    website: "https://masoomminawala.com",
                    about: "Fashion influencer and entrepreneur known for her luxury fashion content.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "20-40",
                    audienceGender: "Female",
                    avgRating: 4.9,
                    completedCollabs: 200
                }
            },
            {
                influencerInfo: {
                    fullName: "Ranveer Allahbadia",
                    email: "ranveer@example.com",
                    username: "ranveerallahbadia",
                    displayName: "BeerBiceps",
                    bio: "Fitness Influencer | Entrepreneur | Podcast Host",
                    phone: "+919876543213",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/ranveer-profile.jpg",
                    bannerUrl: "/images/influencers/ranveer-banner.jpg",
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
                    completedCollabs: 180
                }
            },
            {
                influencerInfo: {
                    fullName: "Prajakta Koli",
                    email: "prajakta@example.com",
                    username: "prajaktakoli",
                    displayName: "MostlySane",
                    bio: "Digital Content Creator | Actor | Comedian | Writer",
                    phone: "+919876543214",
                    location: "Mumbai, India",
                    profilePicUrl: "/images/influencers/prajakta-profile.jpg",
                    bannerUrl: "/images/influencers/prajakta-banner.jpg",
                    verified: true,
                    niche: "Comedy & Entertainment",
                    categories: ["Comedy", "Entertainment", "Acting", "Writing"],
                    languages: ["English", "Hindi"],
                    website: "https://mostlysane.com",
                    about: "Digital content creator known for her comedy sketches and acting.",
                    influenceRegions: "India",
                    primaryMarket: "India",
                    audienceAgeRange: "16-35",
                    audienceGender: "Mixed",
                    avgRating: 4.9,
                    completedCollabs: 250
                }
            }
        ];

        // Insert influencers
        const savedInfluencers = [];
        for (const influencer of influencers) {
            const influencerInfo = new InfluencerInfo({
                ...influencer.influencerInfo,
                password: hashedInfluencerPassword
            });
            const savedInfluencer = await influencerInfo.save();
            savedInfluencers.push(savedInfluencer);

            // Create socials
            const influencerSocials = new InfluencerSocials({
                influencerId: savedInfluencer._id,
                socialHandle: `@${influencer.influencerInfo.username}`,
                platforms: [
                    {
                        platform: "instagram",
                        handle: `@${influencer.influencerInfo.username}`,
                        followers: Math.floor(Math.random() * 4000000) + 1000000,
                        engagementRate: Math.random() * 2 + 3.5,
                        avgLikes: Math.floor(Math.random() * 100000) + 20000,
                        avgComments: Math.floor(Math.random() * 5000) + 1000,
                        avgViews: Math.floor(Math.random() * 200000) + 50000,
                        category: influencer.influencerInfo.niche.toLowerCase().split(' ')[0]
                    }
                ]
            });
            await influencerSocials.save();

            // Create analytics
            const influencerAnalytics = new InfluencerAnalytics({
                influencerId: savedInfluencer._id,
                totalFollowers: Math.floor(Math.random() * 4000000) + 1000000,
                avgEngagementRate: Math.random() * 2 + 3.5,
                monthlyEarnings: Math.floor(Math.random() * 1000000) + 300000,
                earningsChange: Math.floor(Math.random() * 30) + 10,
                rating: influencer.influencerInfo.avgRating,
                audienceDemographics: {
                    gender: influencer.influencerInfo.audienceGender === "Mixed" ? "Mixed" : influencer.influencerInfo.audienceGender,
                    ageRange: influencer.influencerInfo.audienceAgeRange,
                    topLocations: ["Mumbai", "Delhi", "Bangalore", "Hyderabad"]
                },
                performanceMetrics: {
                    reach: Math.floor(Math.random() * 6000000) + 2000000,
                    impressions: Math.floor(Math.random() * 9000000) + 3000000,
                    engagement: Math.floor(Math.random() * 400000) + 100000,
                    conversionRate: Math.random() * 3 + 3.0
                }
            });
            await influencerAnalytics.save();
        }

        console.log(`✅ Created ${savedInfluencers.length} influencers with complete data`);

        // ========================================
        // CAMPAIGN DATA (3 campaigns)
        // ========================================
        console.log('\n🎯 Creating campaign data...');

        const now = new Date();
        const futureDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

        const campaigns = [
            {
                campaignInfo: {
                    brand_id: savedBrands[0]._id, // Mamaearth
                    title: "Natural Beauty Revolution",
                    description: "A campaign promoting natural and sustainable beauty products.",
                    status: "active",
                    start_date: futureDate,
                    end_date: new Date(futureDate.getTime() + (30 * 24 * 60 * 60 * 1000)),
                    duration: 30,
                    required_influencers: 3,
                    budget: 1500000,
                    target_audience: "Women aged 18-35 interested in natural beauty",
                    required_channels: ["Instagram", "YouTube"],
                    min_followers: 200000,
                    objectives: "Increase brand awareness and drive sales of natural beauty products"
                }
            },
            {
                campaignInfo: {
                    brand_id: savedBrands[4]._id, // Zomato
                    title: "Foodie Adventures",
                    description: "A campaign showcasing diverse cuisines available on Zomato.",
                    status: "active",
                    start_date: futureDate,
                    end_date: new Date(futureDate.getTime() + (30 * 24 * 60 * 60 * 1000)),
                    duration: 30,
                    required_influencers: 5,
                    budget: 3000000,
                    target_audience: "Food lovers aged 18-45",
                    required_channels: ["Instagram", "YouTube", "TikTok"],
                    min_followers: 500000,
                    objectives: "Increase app downloads and boost daily orders"
                }
            },
            {
                campaignInfo: {
                    brand_id: savedBrands[1]._id, // Boat
                    title: "Sound of India",
                    description: "A campaign promoting Boat's latest audio products.",
                    status: "request",
                    start_date: futureDate,
                    end_date: new Date(futureDate.getTime() + (45 * 24 * 60 * 60 * 1000)),
                    duration: 45,
                    required_influencers: 4,
                    budget: 2000000,
                    target_audience: "Tech-savvy youth aged 16-35",
                    required_channels: ["Instagram", "YouTube", "TikTok"],
                    min_followers: 300000,
                    objectives: "Increase brand awareness and drive sales of premium audio products"
                }
            }
        ];

        // Insert campaigns
        const savedCampaigns = [];
        for (const campaign of campaigns) {
            const campaignInfo = new CampaignInfo(campaign.campaignInfo);
            const savedCampaign = await campaignInfo.save();
            savedCampaigns.push(savedCampaign);

            // Create metrics
            const campaignMetrics = new CampaignMetrics({
                campaign_id: savedCampaign._id,
                brand_id: campaign.campaignInfo.brand_id,
                overall_progress: Math.floor(Math.random() * 80) + 20,
                performance_score: Math.floor(Math.random() * 40) + 60,
                engagement_rate: Math.random() * 3 + 3.5,
                reach: Math.floor(Math.random() * 3000000) + 1000000,
                conversion_rate: Math.random() * 3 + 3.0,
                clicks: Math.floor(Math.random() * 150000) + 50000,
                impressions: Math.floor(Math.random() * 5000000) + 2000000,
                revenue: Math.floor(Math.random() * 2000000) + 500000,
                roi: Math.floor(Math.random() * 100) + 150
            });
            await campaignMetrics.save();
        }

        console.log(`✅ Created ${savedCampaigns.length} campaigns with complete data`);

        // ========================================
        // MESSAGE DATA (3 messages)
        // ========================================
        console.log('\n💬 Creating message data...');

        const messages = [
            {
                brand_id: savedBrands[0]._id, // Mamaearth
                influencer_id: savedInfluencers[2]._id, // Masoom Minawala
                campaign_id: savedCampaigns[0]._id, // Natural Beauty Revolution
                message: "Hi Masoom! We're excited to work with you on our Natural Beauty Revolution campaign. Could you please confirm the timeline for the Instagram reel series?"
            },
            {
                brand_id: savedBrands[4]._id, // Zomato
                influencer_id: savedInfluencers[0]._id, // Kusha Kapila
                campaign_id: savedCampaigns[1]._id, // Foodie Adventures
                message: "Kusha, your food delivery vlog was incredible! The authentic reactions and genuine reviews really resonated with our audience."
            },
            {
                brand_id: savedBrands[1]._id, // Boat
                influencer_id: savedInfluencers[3]._id, // Ranveer Allahbadia
                campaign_id: savedCampaigns[2]._id, // Sound of India
                message: "Hi Ranveer! We'd love to collaborate with you on our Sound of India campaign. Your fitness content with music would be perfect!"
            }
        ];

        // Insert messages
        for (const messageData of messages) {
            const message = new Message(messageData);
            await message.save();
        }

        console.log(`✅ Created ${messages.length} messages`);

        // ========================================
        // OFFER DATA (3 offers)
        // ========================================
        console.log('\n🎁 Creating offer data...');

        const offers = [
            {
                brand_id: savedBrands[0]._id, // Mamaearth
                description: "Exclusive 30% off on all natural skincare products for influencers",
                start_date: futureDate,
                end_date: new Date(futureDate.getTime() + (60 * 24 * 60 * 60 * 1000)),
                eligibility: "Verified influencers with 100K+ followers in beauty/lifestyle niche",
                offer_percentage: 30,
                offer_details: "Get 30% discount on Mamaearth's complete range of natural skincare products. Valid on first purchase.",
                status: "active"
            },
            {
                brand_id: savedBrands[4]._id, // Zomato
                description: "Free delivery and 20% off on food orders for influencers",
                start_date: futureDate,
                end_date: new Date(futureDate.getTime() + (30 * 24 * 60 * 60 * 1000)),
                eligibility: "Food content creators with 150K+ followers",
                offer_percentage: 20,
                offer_details: "Enjoy free delivery and 20% discount on all food orders. Valid on orders above ₹200.",
                status: "active"
            },
            {
                brand_id: savedBrands[1]._id, // Boat
                description: "Special 25% discount on Boat's latest audio products",
                start_date: futureDate,
                end_date: new Date(futureDate.getTime() + (45 * 24 * 60 * 60 * 1000)),
                eligibility: "Content creators with 200K+ followers in tech/gaming/music categories",
                offer_percentage: 25,
                offer_details: "Exclusive 25% off on Boat's premium audio products including headphones, earbuds, and speakers.",
                status: "active"
            }
        ];

        // Insert offers
        for (const offerData of offers) {
            const offer = new Offer(offerData);
            await offer.save();
        }

        console.log(`✅ Created ${offers.length} offers`);

        console.log('\n🎉 Complete seed data initialization finished successfully!');
        console.log('\n📊 Summary:');
        console.log('   • 5 Brand accounts created');
        console.log('   • 5 Influencer accounts created');
        console.log('   • 3 Campaigns with complete data');
        console.log('   • 3 Messages between brands and influencers');
        console.log('   • 3 Promotional offers from various brands');

        console.log('\n🔐 USER CREDENTIALS:');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('\n🏢 BRAND ACCOUNTS (Password: Brand@123)');
        savedBrands.forEach((brand, index) => {
            console.log(`${index + 1}. ${brand.brandName}`);
            console.log(`   📧 Email: ${brand.email}`);
            console.log(`   🔑 Password: Brand@123`);
            console.log(`   🏭 Industry: ${brand.industry}`);
            console.log('');
        });

        console.log('\n👤 INFLUENCER ACCOUNTS (Password: Influencer@123)');
        savedInfluencers.forEach((influencer, index) => {
            console.log(`${index + 1}. ${influencer.fullName}`);
            console.log(`   📧 Email: ${influencer.email}`);
            console.log(`   🔑 Password: Influencer@123`);
            console.log(`   🎯 Niche: ${influencer.niche}`);
            console.log('');
        });

        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✨ All accounts are ready for testing!');

        // Close MongoDB connection
        console.log('\n🔌 Closing MongoDB connection...');
        await closeConnection();
        console.log('✅ MongoDB connection closed successfully!');

    } catch (error) {
        console.error('\n❌ Seed data initialization failed:');
        console.error(error.message);

        // Ensure connection is closed even on error
        try {
            await closeConnection();
            console.log('🔌 MongoDB connection closed after error');
        } catch (closeError) {
            console.error('❌ Error closing MongoDB connection:', closeError);
        }

        process.exit(1);
    }
};

// Run the script
runCompleteSeedData();
