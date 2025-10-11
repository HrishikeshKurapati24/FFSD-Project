const { CampaignInfo, CampaignMetrics, CampaignPayments, CampaignInfluencers } = require('./config/CampaignMongo');
const { Message } = require('./config/MessageMongo');
const Offer = require('./config/OfferMongo');
const { BrandInfo } = require('./config/BrandMongo');
const { InfluencerInfo } = require('./config/InfluencerMongo');

const initializeCampaignMessageOfferData = async () => {
    try {
        console.log('🎯 Starting Campaign, Message, and Offer data initialization...\n');

        // Get existing brands and influencers from database
        const brands = await BrandInfo.find({}, '_id brandName email');
        const influencers = await InfluencerInfo.find({}, '_id fullName email username');

        if (brands.length === 0 || influencers.length === 0) {
            throw new Error('Brands and influencers must be initialized first. Please run brand and influencer seed data first.');
        }

        console.log(`Found ${brands.length} brands and ${influencers.length} influencers in database\n`);

        // Set dates for campaigns
        const now = new Date();
        const futureDate1 = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 1 week from now
        const futureDate2 = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)); // 2 weeks from now
        const futureDate3 = new Date(now.getTime() + (21 * 24 * 60 * 60 * 1000)); // 3 weeks from now
        const pastDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 1 month ago

        // ========================================
        // CAMPAIGN DATA (8 campaigns total)
        // ========================================
        console.log('📊 Creating campaign data...');

        const campaigns = [
            {
                // Campaign 1: Mamaearth - Natural Beauty Revolution (Active)
                campaignInfo: {
                    brand_id: brands[0]._id, // Mamaearth
                    title: "Natural Beauty Revolution",
                    description: "A comprehensive campaign promoting natural and sustainable beauty products. Influencers will create authentic content showcasing the benefits of natural ingredients, sustainable packaging, and the brand's commitment to environmental responsibility.",
                    status: "active",
                    start_date: futureDate1,
                    end_date: new Date(futureDate1.getTime() + (30 * 24 * 60 * 60 * 1000)),
                    duration: 30,
                    required_influencers: 3,
                    budget: 1500000,
                    target_audience: "Women aged 18-35 interested in natural beauty, sustainability, and wellness",
                    required_channels: ["Instagram", "YouTube"],
                    min_followers: 200000,
                    objectives: "Increase brand awareness by 25%, drive 15% growth in online sales, and establish Mamaearth as the leading natural beauty brand in India"
                },
                campaignMetrics: {
                    brand_id: brands[0]._id,
                    overall_progress: 75,
                    performance_score: 88,
                    engagement_rate: 4.7,
                    reach: 2500000,
                    conversion_rate: 3.8,
                    clicks: 125000,
                    impressions: 4000000,
                    revenue: 850000,
                    roi: 156
                },
                campaignPayments: [
                    {
                        brand_id: brands[0]._id,
                        influencer_id: influencers[2]._id, // Masoom Minawala
                        amount: 250000,
                        status: "completed",
                        payment_date: new Date(futureDate1.getTime() + (7 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    },
                    {
                        brand_id: brands[0]._id,
                        influencer_id: influencers[6]._id, // Aashna Shroff
                        amount: 180000,
                        status: "completed",
                        payment_date: new Date(futureDate1.getTime() + (10 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    }
                ],
                campaignInfluencers: [
                    {
                        influencer_id: influencers[2]._id, // Masoom Minawala
                        status: "active",
                        progress: 90,
                        engagement_rate: 4.8,
                        reach: 1200000,
                        clicks: 65000,
                        conversions: 2800,
                        timeliness_score: 95,
                        deliverables: [
                            {
                                title: "Instagram Reel Series",
                                description: "Create 3 Instagram reels showcasing natural skincare routine",
                                status: "completed",
                                due_date: new Date(futureDate1.getTime() + (5 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(futureDate1.getTime() + (4 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "YouTube Tutorial",
                                description: "Detailed skincare routine video with product reviews",
                                status: "completed",
                                due_date: new Date(futureDate1.getTime() + (15 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(futureDate1.getTime() + (14 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    },
                    {
                        influencer_id: influencers[6]._id, // Aashna Shroff
                        status: "active",
                        progress: 80,
                        engagement_rate: 4.6,
                        reach: 950000,
                        clicks: 48000,
                        conversions: 2100,
                        timeliness_score: 88,
                        deliverables: [
                            {
                                title: "Instagram Stories Series",
                                description: "7-day skincare routine stories",
                                status: "completed",
                                due_date: new Date(futureDate1.getTime() + (7 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(futureDate1.getTime() + (6 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "Instagram Feed Posts",
                                description: "Before/after photos with natural products",
                                status: "active",
                                due_date: new Date(futureDate1.getTime() + (20 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    }
                ]
            },
            {
                // Campaign 2: Boat - Sound of India (Request)
                campaignInfo: {
                    brand_id: brands[1]._id, // Boat
                    title: "Sound of India",
                    description: "An exciting campaign to launch Boat's latest premium audio products. Influencers will showcase the superior sound quality, sleek design, and lifestyle integration of Boat's audio ecosystem.",
                    status: "request",
                    start_date: futureDate2,
                    end_date: new Date(futureDate2.getTime() + (45 * 24 * 60 * 60 * 1000)),
                    duration: 45,
                    required_influencers: 4,
                    budget: 2000000,
                    target_audience: "Tech-savvy youth aged 16-35, music enthusiasts, and lifestyle content consumers",
                    required_channels: ["Instagram", "YouTube", "TikTok"],
                    min_followers: 300000,
                    objectives: "Generate 2M+ impressions, achieve 5% engagement rate, and drive 20% increase in product sales"
                },
                campaignMetrics: {
                    brand_id: brands[1]._id,
                    overall_progress: 0,
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
                        influencer_id: influencers[3]._id, // Ranveer Allahbadia
                        status: "request",
                        progress: 0,
                        engagement_rate: 0,
                        reach: 0,
                        clicks: 0,
                        conversions: 0,
                        timeliness_score: 0,
                        deliverables: [
                            {
                                title: "Fitness + Music Content",
                                description: "Workout videos featuring Boat audio products",
                                status: "pending",
                                due_date: new Date(futureDate2.getTime() + (10 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "Product Review Video",
                                description: "Detailed review of Boat's latest headphones",
                                status: "pending",
                                due_date: new Date(futureDate2.getTime() + (25 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    }
                ]
            },
            {
                // Campaign 3: Zomato - Foodie Adventures (Active)
                campaignInfo: {
                    brand_id: brands[4]._id, // Zomato
                    title: "Foodie Adventures",
                    description: "A mouth-watering campaign showcasing diverse cuisines available on Zomato. Influencers will explore different restaurants, share authentic food experiences, and highlight Zomato's seamless delivery service.",
                    status: "active",
                    start_date: new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)), // Started 15 days ago
                    end_date: new Date(now.getTime() + (15 * 24 * 60 * 60 * 1000)), // Ends in 15 days
                    duration: 30,
                    required_influencers: 5,
                    budget: 3000000,
                    target_audience: "Food lovers aged 18-45, busy professionals, and families who order food online",
                    required_channels: ["Instagram", "YouTube", "TikTok"],
                    min_followers: 500000,
                    objectives: "Increase app downloads by 30%, boost daily orders by 25%, and enhance brand loyalty"
                },
                campaignMetrics: {
                    brand_id: brands[4]._id,
                    overall_progress: 65,
                    performance_score: 92,
                    engagement_rate: 5.2,
                    reach: 4500000,
                    conversion_rate: 4.8,
                    clicks: 280000,
                    impressions: 7500000,
                    revenue: 2100000,
                    roi: 170
                },
                campaignPayments: [
                    {
                        brand_id: brands[4]._id,
                        influencer_id: influencers[0]._id, // Kusha Kapila
                        amount: 400000,
                        status: "completed",
                        payment_date: new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    },
                    {
                        brand_id: brands[4]._id,
                        influencer_id: influencers[4]._id, // Prajakta Koli
                        amount: 350000,
                        status: "completed",
                        payment_date: new Date(now.getTime() - (8 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    },
                    {
                        brand_id: brands[4]._id,
                        influencer_id: influencers[7]._id, // Ashish Chanchlani
                        amount: 300000,
                        status: "processing",
                        payment_date: new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    }
                ],
                campaignInfluencers: [
                    {
                        influencer_id: influencers[0]._id, // Kusha Kapila
                        status: "active",
                        progress: 85,
                        engagement_rate: 5.1,
                        reach: 1800000,
                        clicks: 95000,
                        conversions: 4200,
                        timeliness_score: 92,
                        deliverables: [
                            {
                                title: "Food Delivery Vlog",
                                description: "Day in the life of ordering food from different restaurants",
                                status: "completed",
                                due_date: new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(now.getTime() - (6 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "Restaurant Reviews",
                                description: "Review 5 different restaurants ordered via Zomato",
                                status: "active",
                                due_date: new Date(now.getTime() + (10 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    },
                    {
                        influencer_id: influencers[4]._id, // Prajakta Koli
                        status: "active",
                        progress: 75,
                        engagement_rate: 5.3,
                        reach: 2200000,
                        clicks: 115000,
                        conversions: 5100,
                        timeliness_score: 89,
                        deliverables: [
                            {
                                title: "Comedy Food Sketches",
                                description: "Funny sketches about food ordering experiences",
                                status: "completed",
                                due_date: new Date(now.getTime() - (8 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(now.getTime() - (9 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "TikTok Food Challenges",
                                description: "Creative food challenges using Zomato orders",
                                status: "active",
                                due_date: new Date(now.getTime() + (12 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    }
                ]
            },
            {
                // Campaign 4: Netflix India - Binge Watch India (Completed)
                campaignInfo: {
                    brand_id: brands[7]._id, // Netflix India
                    title: "Binge Watch India",
                    description: "A successful campaign promoting Netflix's latest Indian originals and international content. Influencers created engaging content around their favorite shows and movies.",
                    status: "completed",
                    start_date: pastDate,
                    end_date: new Date(pastDate.getTime() + (60 * 24 * 60 * 60 * 1000)),
                    duration: 60,
                    required_influencers: 6,
                    budget: 4000000,
                    target_audience: "Streaming enthusiasts aged 18-50, entertainment lovers, and digital content consumers",
                    required_channels: ["Instagram", "YouTube", "Twitter"],
                    min_followers: 400000,
                    objectives: "Increase subscriber base by 20%, boost engagement with Indian content, and promote new releases"
                },
                campaignMetrics: {
                    brand_id: brands[7]._id,
                    overall_progress: 100,
                    performance_score: 95,
                    engagement_rate: 5.8,
                    reach: 6800000,
                    conversion_rate: 6.2,
                    clicks: 420000,
                    impressions: 12000000,
                    revenue: 3200000,
                    roi: 180
                },
                campaignPayments: [
                    {
                        brand_id: brands[7]._id,
                        influencer_id: influencers[5]._id, // Mithila Palkar
                        amount: 500000,
                        status: "completed",
                        payment_date: new Date(pastDate.getTime() + (30 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    },
                    {
                        brand_id: brands[7]._id,
                        influencer_id: influencers[8]._id, // Diipa Khosla
                        amount: 450000,
                        status: "completed",
                        payment_date: new Date(pastDate.getTime() + (35 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    }
                ],
                campaignInfluencers: [
                    {
                        influencer_id: influencers[5]._id, // Mithila Palkar
                        status: "completed",
                        progress: 100,
                        engagement_rate: 5.9,
                        reach: 1500000,
                        clicks: 88000,
                        conversions: 5200,
                        timeliness_score: 98,
                        deliverables: [
                            {
                                title: "Show Recommendations",
                                description: "Instagram posts recommending Netflix shows",
                                status: "completed",
                                due_date: new Date(pastDate.getTime() + (15 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(pastDate.getTime() + (14 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "Behind the Scenes Content",
                                description: "Exclusive content from Netflix original sets",
                                status: "completed",
                                due_date: new Date(pastDate.getTime() + (45 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(pastDate.getTime() + (44 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    }
                ]
            },
            {
                // Campaign 5: Myntra - Fashion Forward (Draft)
                campaignInfo: {
                    brand_id: brands[6]._id, // Myntra
                    title: "Fashion Forward",
                    description: "A fashion-forward campaign showcasing Myntra's latest collections and styling tips. Influencers will demonstrate versatile styling options and highlight seasonal trends.",
                    status: "draft",
                    start_date: futureDate3,
                    end_date: new Date(futureDate3.getTime() + (35 * 24 * 60 * 60 * 1000)),
                    duration: 35,
                    required_influencers: 4,
                    budget: 1800000,
                    target_audience: "Fashion-conscious individuals aged 18-40, style enthusiasts, and online shoppers",
                    required_channels: ["Instagram", "YouTube"],
                    min_followers: 250000,
                    objectives: "Drive 30% increase in fashion category sales, boost brand engagement, and establish Myntra as the go-to fashion destination"
                },
                campaignMetrics: {
                    brand_id: brands[6]._id,
                    overall_progress: 0,
                    performance_score: 0,
                    engagement_rate: 0,
                    reach: 0,
                    conversion_rate: 0,
                    clicks: 0,
                    impressions: 0,
                    revenue: 0,
                    roi: 0
                },
                campaignInfluencers: []
            },
            {
                // Campaign 6: Urban Company - Home Sweet Home (Active)
                campaignInfo: {
                    brand_id: brands[8]._id, // Urban Company
                    title: "Home Sweet Home",
                    description: "A comprehensive campaign promoting Urban Company's home services. Influencers will showcase cleaning, beauty, and repair services with before/after transformations.",
                    status: "active",
                    start_date: new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000)), // Started 10 days ago
                    end_date: new Date(now.getTime() + (20 * 24 * 60 * 60 * 1000)), // Ends in 20 days
                    duration: 30,
                    required_influencers: 3,
                    budget: 1200000,
                    target_audience: "Homeowners aged 25-45, busy professionals, and families seeking reliable home services",
                    required_channels: ["Instagram", "YouTube"],
                    min_followers: 150000,
                    objectives: "Increase service bookings by 35%, build trust in home services, and showcase service quality"
                },
                campaignMetrics: {
                    brand_id: brands[8]._id,
                    overall_progress: 45,
                    performance_score: 78,
                    engagement_rate: 4.2,
                    reach: 1800000,
                    conversion_rate: 3.5,
                    clicks: 63000,
                    impressions: 2700000,
                    revenue: 420000,
                    roi: 135
                },
                campaignPayments: [
                    {
                        brand_id: brands[8]._id,
                        influencer_id: influencers[1]._id, // Dolly Singh
                        amount: 200000,
                        status: "completed",
                        payment_date: new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    }
                ],
                campaignInfluencers: [
                    {
                        influencer_id: influencers[1]._id, // Dolly Singh
                        status: "active",
                        progress: 60,
                        engagement_rate: 4.1,
                        reach: 850000,
                        clicks: 35000,
                        conversions: 1200,
                        timeliness_score: 85,
                        deliverables: [
                            {
                                title: "Home Cleaning Vlog",
                                description: "Before and after home cleaning service",
                                status: "completed",
                                due_date: new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(now.getTime() - (4 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "Service Experience Stories",
                                description: "Instagram stories documenting the service experience",
                                status: "active",
                                due_date: new Date(now.getTime() + (15 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    }
                ]
            },
            {
                // Campaign 7: CRED - Rewards Revolution (Brand Invite)
                campaignInfo: {
                    brand_id: brands[9]._id, // CRED
                    title: "Rewards Revolution",
                    description: "An exclusive campaign promoting CRED's premium rewards program. Influencers will showcase the benefits of using CRED for credit card bill payments and exclusive offers.",
                    status: "brand-invite",
                    start_date: futureDate2,
                    end_date: new Date(futureDate2.getTime() + (40 * 24 * 60 * 60 * 1000)),
                    duration: 40,
                    required_influencers: 2,
                    budget: 1000000,
                    target_audience: "Credit card users aged 25-45, financially conscious individuals, and premium lifestyle enthusiasts",
                    required_channels: ["Instagram", "YouTube"],
                    min_followers: 300000,
                    objectives: "Increase premium member signups by 40%, boost app engagement, and highlight exclusive rewards"
                },
                campaignMetrics: {
                    brand_id: brands[9]._id,
                    overall_progress: 0,
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
                        influencer_id: influencers[3]._id, // Ranveer Allahbadia
                        status: "brand-invite",
                        progress: 0,
                        engagement_rate: 0,
                        reach: 0,
                        clicks: 0,
                        conversions: 0,
                        timeliness_score: 0,
                        deliverables: [
                            {
                                title: "Financial Tips Content",
                                description: "Content about smart credit card usage and rewards",
                                status: "pending",
                                due_date: new Date(futureDate2.getTime() + (20 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    }
                ]
            },
            {
                // Campaign 8: Swiggy - Foodie Adventures 2.0 (Cancelled)
                campaignInfo: {
                    brand_id: brands[5]._id, // Swiggy
                    title: "Foodie Adventures 2.0",
                    description: "A campaign that was cancelled due to budget constraints. Was intended to promote Swiggy's restaurant partners and delivery services.",
                    status: "cancelled",
                    start_date: futureDate1,
                    end_date: new Date(futureDate1.getTime() + (30 * 24 * 60 * 60 * 1000)),
                    duration: 30,
                    required_influencers: 4,
                    budget: 2500000,
                    target_audience: "Food delivery users aged 18-45",
                    required_channels: ["Instagram", "YouTube"],
                    min_followers: 400000,
                    objectives: "Increase delivery orders and restaurant partner visibility"
                },
                campaignMetrics: {
                    brand_id: brands[5]._id,
                    overall_progress: 0,
                    performance_score: 0,
                    engagement_rate: 0,
                    reach: 0,
                    conversion_rate: 0,
                    clicks: 0,
                    impressions: 0,
                    revenue: 0,
                    roi: 0
                },
                campaignInfluencers: []
            }
        ];

        // Insert campaigns
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
            if (campaign.campaignInfluencers) {
                for (const influencer of campaign.campaignInfluencers) {
                    const campaignInfluencer = new CampaignInfluencers({
                        ...influencer,
                        campaign_id: savedCampaign._id
                    });
                    await campaignInfluencer.save();
                }
            }

            console.log(`✅ Created campaign: ${campaign.campaignInfo.title}`);
        }

        console.log(`\n📊 Successfully created ${campaigns.length} campaigns with complete data\n`);

        // ========================================
        // MESSAGE DATA (8 messages total)
        // ========================================
        console.log('💬 Creating message data...');

        // Get some campaign IDs for messages
        const campaignInfos = await CampaignInfo.find({}, '_id title').limit(5);

        const messages = [
            {
                brand_id: brands[0]._id, // Mamaearth
                influencer_id: influencers[2]._id, // Masoom Minawala
                campaign_id: campaignInfos[0]._id, // Natural Beauty Revolution
                message: "Hi Masoom! We're excited to work with you on our Natural Beauty Revolution campaign. Could you please confirm the timeline for the Instagram reel series? Looking forward to your amazing content!"
            },
            {
                brand_id: brands[0]._id, // Mamaearth
                influencer_id: influencers[2]._id, // Masoom Minawala
                campaign_id: campaignInfos[0]._id, // Natural Beauty Revolution
                message: "The content looks absolutely fantastic! Your natural skincare routine video has already received great engagement. Keep up the amazing work!"
            },
            {
                brand_id: brands[4]._id, // Zomato
                influencer_id: influencers[0]._id, // Kusha Kapila
                campaign_id: campaignInfos[2]._id, // Foodie Adventures
                message: "Kusha, your food delivery vlog was incredible! The authentic reactions and genuine reviews really resonated with our audience. Thank you for such amazing content!"
            },
            {
                brand_id: brands[4]._id, // Zomato
                influencer_id: influencers[4]._id, // Prajakta Koli
                campaign_id: campaignInfos[2]._id, // Foodie Adventures
                message: "Hi Prajakta! We loved your comedy sketches about food ordering. They perfectly captured the relatable experiences our users have. Can't wait to see the TikTok challenges!"
            },
            {
                brand_id: brands[7]._id, // Netflix India
                influencer_id: influencers[5]._id, // Mithila Palkar
                campaign_id: campaignInfos[3]._id, // Binge Watch India
                message: "Mithila, thank you for the amazing show recommendations! Your behind-the-scenes content from our original sets was exactly what we were looking for. Excellent work!"
            },
            {
                brand_id: brands[1]._id, // Boat
                influencer_id: influencers[3]._id, // Ranveer Allahbadia
                campaign_id: campaignInfos[1]._id, // Sound of India
                message: "Hi Ranveer! We'd love to collaborate with you on our Sound of India campaign. Your fitness content with music would be perfect for showcasing our audio products. Are you interested?"
            },
            {
                brand_id: brands[8]._id, // Urban Company
                influencer_id: influencers[1]._id, // Dolly Singh
                campaign_id: campaignInfos[5]._id, // Home Sweet Home
                message: "Dolly, your home cleaning vlog was fantastic! The before and after transformation was incredible. Our customers are loving the authentic service experience you showcased."
            },
            {
                brand_id: brands[9]._id, // CRED
                influencer_id: influencers[3]._id, // Ranveer Allahbadia
                campaign_id: campaignInfos[6]._id, // Rewards Revolution
                message: "Ranveer, we're excited to invite you to our exclusive Rewards Revolution campaign. Your financial tips content would be perfect for promoting smart credit card usage and our premium rewards."
            }
        ];

        // Insert messages
        for (const messageData of messages) {
            const message = new Message(messageData);
            await message.save();
            console.log(`✅ Created message from ${brands.find(b => b._id.equals(messageData.brand_id))?.brandName} to ${influencers.find(i => i._id.equals(messageData.influencer_id))?.fullName}`);
        }

        console.log(`\n💬 Successfully created ${messages.length} messages\n`);

        // ========================================
        // OFFER DATA (6 offers total)
        // ========================================
        console.log('🎁 Creating offer data...');

        const offers = [
            {
                brand_id: brands[0]._id, // Mamaearth
                description: "Exclusive 30% off on all natural skincare products for influencers",
                start_date: futureDate1,
                end_date: new Date(futureDate1.getTime() + (60 * 24 * 60 * 60 * 1000)),
                eligibility: "Verified influencers with 100K+ followers in beauty/lifestyle niche",
                offer_percentage: 30,
                offer_details: "Get 30% discount on Mamaearth's complete range of natural skincare products. Valid on first purchase. Cannot be combined with other offers.",
                status: "active"
            },
            {
                brand_id: brands[1]._id, // Boat
                description: "Special 25% discount on Boat's latest audio products",
                start_date: futureDate2,
                end_date: new Date(futureDate2.getTime() + (45 * 24 * 60 * 60 * 1000)),
                eligibility: "Content creators with 200K+ followers in tech/gaming/music categories",
                offer_percentage: 25,
                offer_details: "Exclusive 25% off on Boat's premium audio products including headphones, earbuds, and speakers. Limited time offer for content creators.",
                status: "active"
            },
            {
                brand_id: brands[4]._id, // Zomato
                description: "Free delivery and 20% off on food orders for influencers",
                start_date: new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)), // Started 5 days ago
                end_date: new Date(now.getTime() + (25 * 24 * 60 * 60 * 1000)), // Ends in 25 days
                eligibility: "Food content creators with 150K+ followers",
                offer_percentage: 20,
                offer_details: "Enjoy free delivery and 20% discount on all food orders. Valid on orders above ₹200. Use code INFLUENCER20.",
                status: "active"
            },
            {
                brand_id: brands[7]._id, // Netflix India
                description: "6 months free Netflix Premium subscription",
                start_date: pastDate,
                end_date: new Date(pastDate.getTime() + (90 * 24 * 60 * 60 * 1000)),
                eligibility: "Entertainment content creators with 300K+ followers",
                offer_percentage: 100,
                offer_details: "Get 6 months of Netflix Premium subscription absolutely free. Perfect for content creators who review shows and movies.",
                status: "expired"
            },
            {
                brand_id: brands[6]._id, // Myntra
                description: "40% off on fashion items for style influencers",
                start_date: futureDate3,
                end_date: new Date(futureDate3.getTime() + (50 * 24 * 60 * 60 * 1000)),
                eligibility: "Fashion influencers with 250K+ followers",
                offer_percentage: 40,
                offer_details: "Exclusive 40% discount on Myntra's fashion collection including clothing, accessories, and footwear. Valid on orders above ₹1000.",
                status: "active"
            },
            {
                brand_id: brands[8]._id, // Urban Company
                description: "50% off on first home service booking",
                start_date: new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000)), // Started 10 days ago
                end_date: new Date(now.getTime() + (20 * 24 * 60 * 60 * 1000)), // Ends in 20 days
                eligibility: "Lifestyle influencers with 100K+ followers",
                offer_percentage: 50,
                offer_details: "Get 50% off on your first home service booking including cleaning, beauty, and repair services. Valid for new users only.",
                status: "active"
            }
        ];

        // Insert offers
        for (const offerData of offers) {
            const offer = new Offer(offerData);
            await offer.save();
            console.log(`✅ Created offer: ${offerData.description}`);
        }

        console.log(`\n🎁 Successfully created ${offers.length} offers\n`);

        console.log('🎉 Campaign, Message, and Offer data initialization completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   • ${campaigns.length} Campaigns created (with complete metrics, payments, and influencer data)`);
        console.log(`   • ${messages.length} Messages created`);
        console.log(`   • ${offers.length} Offers created`);
        console.log('   • All data includes realistic metrics and relationships');

    } catch (error) {
        console.error('❌ Error during Campaign, Message, and Offer data initialization:', error);
        throw error;
    }
};

module.exports = { initializeCampaignMessageOfferData };

// Run the initialization if this file is executed directly
if (require.main === module) {
    initializeCampaignMessageOfferData()
        .then(() => {
            console.log('✅ Initialization completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Initialization failed:', error);
            process.exit(1);
        });
}
