const { CampaignInfo, CampaignMetrics, CampaignPayments, CampaignInfluencers } = require('./config/CampaignMongo');
const { BrandInfo } = require('./config/BrandMongo');
const { InfluencerInfo } = require('./config/InfluencerMongo');

const initializeCampaignData = async () => {
    try {
        // Get brand and influencer IDs from the database
        const brands = await BrandInfo.find({}, '_id');
        const influencers = await InfluencerInfo.find({}, '_id');

        if (brands.length === 0 || influencers.length === 0) {
            throw new Error('Brands and influencers must be initialized first');
        }

        // Set future dates for campaigns
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1); // Set to next month

        const campaigns = [
            {
                // 1. Mamaearth's Natural Beauty Campaign
                campaignInfo: {
                    brand_id: brands[0]._id, // Mamaearth
                    title: "Natural Beauty Revolution",
                    description: "A campaign promoting natural and sustainable beauty products. Influencers will create content showcasing the benefits of natural ingredients and sustainable packaging.",
                    start_date: futureDate,
                    end_date: new Date(futureDate.getTime() + (30 * 24 * 60 * 60 * 1000)), // 30 days after start
                    duration: 30,
                    budget: 1000000,
                    status: "active",
                    objectives: "Increase brand awareness and drive sales of natural beauty products",
                    min_followers: 100000,
                    requirements: "Content must highlight natural ingredients and sustainability",
                    deliverables: ["Instagram Posts", "YouTube Videos", "Stories"],
                    target_audience: "18-35, Female, Beauty Enthusiasts",
                    content_guidelines: "Focus on natural ingredients and eco-friendly packaging"
                },
                campaignMetrics: {
                    brand_id: brands[0]._id,
                    performance_score: 85,
                    engagement_rate: 4.5,
                    reach: 2000000,
                    impressions: 3000000,
                    clicks: 150000,
                    conversions: 5000
                },
                campaignPayments: [
                    {
                        brand_id: brands[0]._id,
                        influencer_id: influencers[0]._id, // Kusha Kapila
                        amount: 150000,
                        status: "completed",
                        payment_date: new Date(),
                        payment_method: "bank_transfer"
                    },
                    {
                        brand_id: brands[0]._id,
                        influencer_id: influencers[2]._id, // Masoom Minawala
                        amount: 200000,
                        status: "completed",
                        payment_date: new Date(),
                        payment_method: "bank_transfer"
                    }
                ],
                campaignInfluencers: [
                    {
                        influencer_id: influencers[0]._id, // Kusha Kapila
                        status: "active",
                        progress: 75,
                        deliverables_completed: 3,
                        total_deliverables: 4,
                        engagement_rate: 4.5,
                        content_quality: 4.8
                    },
                    {
                        influencer_id: influencers[2]._id, // Masoom Minawala
                        status: "active",
                        progress: 60,
                        deliverables_completed: 2,
                        total_deliverables: 4,
                        engagement_rate: 4.7,
                        content_quality: 4.9
                    }
                ]
            },
            {
                // 2. Boat's Sound of India Campaign (Request)
                campaignInfo: {
                    brand_id: brands[1]._id, // Boat
                    title: "Sound of India",
                    description: "A campaign promoting Boat's latest audio products. Influencers will create content showcasing the premium sound quality and lifestyle integration.",
                    start_date: futureDate,
                    end_date: new Date(futureDate.getTime() + (30 * 24 * 60 * 60 * 1000)), // 30 days after start
                    duration: 30,
                    budget: 800000,
                    status: "request",
                    objectives: "Increase brand awareness and drive sales of premium audio products",
                    min_followers: 200000,
                    requirements: "Content must highlight premium sound quality",
                    deliverables: ["Instagram Posts", "YouTube Videos", "TikTok"],
                    target_audience: "16-35, Tech-savvy Youth",
                    content_guidelines: "Focus on premium sound quality and lifestyle integration"
                },
                campaignMetrics: {
                    brand_id: brands[1]._id,
                    performance_score: 0,
                    engagement_rate: 0,
                    reach: 0,
                    impressions: 0,
                    clicks: 0,
                    conversions: 0
                },
                campaignInfluencers: [
                    {
                        influencer_id: influencers[3]._id, // Ranveer Allahbadia
                        status: "request",
                        progress: 0,
                        deliverables_completed: 0,
                        total_deliverables: 4,
                        engagement_rate: 0,
                        content_quality: 0
                    }
                ]
            },
            {
                // 3. Nykaa's Beauty for All Campaign
                campaignInfo: {
                    brand_id: brands[2]._id, // Nykaa
                    title: "Beauty for All",
                    description: "A campaign promoting inclusive beauty products. Influencers will create content showcasing diverse beauty standards and product ranges.",
                    start_date: futureDate,
                    end_date: new Date(futureDate.getTime() + (30 * 24 * 60 * 60 * 1000)), // 30 days after start
                    duration: 30,
                    budget: 1000000,
                    status: "active",
                    objectives: "Promote inclusive beauty standards and drive sales of diverse product ranges",
                    min_followers: 300000,
                    requirements: "Content must highlight diverse beauty standards",
                    deliverables: ["Instagram Posts", "YouTube Videos"],
                    target_audience: "18-40, Beauty Enthusiasts",
                    content_guidelines: "Focus on inclusive beauty standards"
                },
                campaignMetrics: {
                    brand_id: brands[2]._id,
                    performance_score: 88,
                    engagement_rate: 4.7,
                    reach: 3000000,
                    impressions: 4500000,
                    clicks: 75000,
                    conversions: 3000
                },
                campaignPayments: [
                    {
                        brand_id: brands[2]._id,
                        influencer_id: influencers[4]._id, // Prajakta Koli
                        amount: 250000,
                        status: "completed",
                        payment_date: new Date(),
                        payment_method: "bank_transfer"
                    }
                ],
                campaignInfluencers: [
                    {
                        influencer_id: influencers[4]._id, // Prajakta Koli
                        status: "active",
                        progress: 50,
                        deliverables_completed: 2,
                        total_deliverables: 4,
                        engagement_rate: 4.9,
                        content_quality: 4.8
                    }
                ]
            },
            {
                // 4. Lenskart's Clear Vision Campaign (Request)
                campaignInfo: {
                    brand_id: brands[3]._id, // Lenskart
                    title: "Clear Vision for All",
                    description: "A campaign promoting affordable eyewear. Influencers will create content showcasing style and affordability of Lenskart products.",
                    status: "request",
                    start_date: new Date('2024-06-01'),
                    end_date: new Date('2024-07-31'),
                    duration: 60,
                    budget: 600000,
                    target_audience: "People aged 16-45 interested in fashion and eyewear",
                    required_channels: ["Instagram", "YouTube"],
                    min_followers: 150000,
                    objectives: "Increase brand awareness and drive sales of affordable eyewear"
                },
                campaignMetrics: {
                    brand_id: brands[3]._id,
                    performance_score: 0,
                    engagement_rate: 0,
                    reach: 0,
                    conversion_rate: 0,
                    clicks: 0,
                    impressions: 0,
                    revenue: 0,
                    roi: 0
                },
                campaignInfluencers: [
                    {
                        influencer_id: influencers[1]._id, // Dolly Singh
                        status: "request",
                        progress: 0,
                        engagement_rate: 0,
                        reach: 0,
                        clicks: 0,
                        conversions: 0,
                        timeliness_score: 0,
                        deliverables: [
                            {
                                title: "Instagram Reel",
                                description: "Create a 30-second reel showcasing eyewear collection",
                                status: "pending",
                                due_date: new Date('2024-06-10')
                            },
                            {
                                title: "YouTube Video",
                                description: "Eyewear try-on and review",
                                status: "pending",
                                due_date: new Date('2024-06-25')
                            }
                        ]
                    }
                ]
            },
            {
                // 5. Zomato's Food for Everyone Campaign
                campaignInfo: {
                    brand_id: brands[4]._id, // Zomato
                    title: "Food for Everyone",
                    description: "A campaign promoting food delivery services. Influencers will create content showcasing diverse cuisines and delivery experience.",
                    status: "active",
                    start_date: new Date('2024-04-01'),
                    end_date: new Date('2024-05-31'),
                    duration: 60,
                    budget: 1200000,
                    target_audience: "People aged 18-45 interested in food and delivery services",
                    required_channels: ["Instagram", "YouTube", "TikTok"],
                    min_followers: 500000,
                    objectives: "Increase app downloads and drive food delivery orders"
                },
                campaignMetrics: {
                    brand_id: brands[4]._id,
                    performance_score: 92,
                    engagement_rate: 4.8,
                    reach: 4000000,
                    conversion_rate: 4.0,
                    clicks: 100000,
                    impressions: 6000000,
                    revenue: 2000000,
                    roi: 167
                },
                campaignPayments: [
                    {
                        brand_id: brands[4]._id,
                        influencer_id: influencers[0]._id, // Kusha Kapila
                        amount: 300000,
                        status: "completed",
                        payment_date: new Date('2024-04-15'),
                        payment_method: "bank_transfer"
                    },
                    {
                        brand_id: brands[4]._id,
                        influencer_id: influencers[4]._id, // Prajakta Koli
                        amount: 350000,
                        status: "completed",
                        payment_date: new Date('2024-04-20'),
                        payment_method: "bank_transfer"
                    }
                ],
                campaignInfluencers: [
                    {
                        influencer_id: influencers[0]._id, // Kusha Kapila
                        status: "active",
                        progress: 80,
                        engagement_rate: 4.7,
                        reach: 1200000,
                        clicks: 50000,
                        conversions: 4000,
                        timeliness_score: 90,
                        deliverables: [
                            {
                                title: "Instagram Series",
                                description: "5-part series on diverse cuisines",
                                status: "completed",
                                due_date: new Date('2024-04-20'),
                                completed_at: new Date('2024-04-18')
                            },
                            {
                                title: "YouTube Vlog",
                                description: "Food delivery experience vlog",
                                status: "in_progress",
                                due_date: new Date('2024-05-10')
                            }
                        ]
                    },
                    {
                        influencer_id: influencers[4]._id, // Prajakta Koli
                        status: "active",
                        progress: 70,
                        engagement_rate: 4.9,
                        reach: 1500000,
                        clicks: 60000,
                        conversions: 5000,
                        timeliness_score: 95,
                        deliverables: [
                            {
                                title: "Instagram Reels",
                                description: "Series of food delivery reels",
                                status: "completed",
                                due_date: new Date('2024-04-25'),
                                completed_at: new Date('2024-04-22')
                            },
                            {
                                title: "YouTube Collaboration",
                                description: "Food delivery challenge video",
                                status: "pending",
                                due_date: new Date('2024-05-15')
                            }
                        ]
                    }
                ]
            }
        ];

        // Insert campaigns into database
        for (const campaign of campaigns) {
            // Save campaign info
            const campaignInfo = new CampaignInfo(campaign.campaignInfo);
            const savedCampaign = await campaignInfo.save();

            // Save campaign metrics
            const campaignMetrics = new CampaignMetrics({
                ...campaign.campaignMetrics,
                campaign_id: savedCampaign._id
            });
            await campaignMetrics.save();

            // Save campaign payments
            if (campaign.campaignPayments) {
                for (const payment of campaign.campaignPayments) {
                    const campaignPayment = new CampaignPayments({
                        ...payment,
                        campaign_id: savedCampaign._id
                    });
                    await campaignPayment.save();
                }
            }

            // Save campaign influencers
            for (const influencer of campaign.campaignInfluencers) {
                const campaignInfluencer = new CampaignInfluencers({
                    ...influencer,
                    campaign_id: savedCampaign._id
                });
                await campaignInfluencer.save();
            }
        }

        console.log('Campaign data initialized successfully');
    } catch (error) {
        console.error('Error initializing campaign data:', error);
        throw error;
    }
};

module.exports = { initializeCampaignData };