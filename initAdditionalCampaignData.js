const { CampaignInfo, CampaignMetrics, CampaignPayments, CampaignInfluencers } = require('./config/CampaignMongo');
const { BrandInfo } = require('./config/BrandMongo');
const { InfluencerInfo } = require('./config/InfluencerMongo');

const initializeAdditionalCampaignData = async () => {
    try {
        console.log('🎯 Starting additional campaign data initialization...\n');

        // Get brand and influencer IDs from the database
        const brands = await BrandInfo.find({}, '_id brandName email');
        const influencers = await InfluencerInfo.find({}, '_id fullName email username');

        if (brands.length === 0 || influencers.length === 0) {
            throw new Error('Brands and influencers must be initialized first');
        }

        console.log(`Found ${brands.length} brands and ${influencers.length} influencers in database\n`);

        // Set dates for campaigns
        const now = new Date();
        const futureDate1 = new Date(now.getTime() + (10 * 24 * 60 * 60 * 1000)); // 10 days from now
        const futureDate2 = new Date(now.getTime() + (20 * 24 * 60 * 60 * 1000)); // 20 days from now
        const futureDate3 = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
        const pastDate1 = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000)); // 2 months ago
        const pastDate2 = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 1 month ago

        // ========================================
        // ADDITIONAL CAMPAIGN DATA (10 campaigns total)
        // ========================================
        console.log('📊 Creating additional campaign data...');

        const additionalCampaigns = [
            {
                // Campaign 1: Swiggy - Foodie Delights (Active)
                campaignInfo: {
                    brand_id: brands[5]._id, // Swiggy
                    title: "Foodie Delights",
                    description: "A comprehensive campaign showcasing Swiggy's diverse restaurant partners and cuisines. Influencers will explore different food categories, highlight local favorites, and demonstrate the seamless ordering experience.",
                    status: "active",
                    start_date: new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)), // Started 5 days ago
                    end_date: new Date(now.getTime() + (25 * 24 * 60 * 60 * 1000)), // Ends in 25 days
                    duration: 30,
                    required_influencers: 6,
                    budget: 2500000,
                    target_audience: "Food enthusiasts aged 18-45, busy professionals, and families who order food online",
                    required_channels: ["Instagram", "YouTube", "TikTok"],
                    min_followers: 400000,
                    objectives: "Increase app downloads by 35%, boost daily orders by 30%, and enhance brand loyalty among food lovers"
                },
                campaignMetrics: {
                    brand_id: brands[5]._id,
                    overall_progress: 55,
                    performance_score: 89,
                    engagement_rate: 5.1,
                    reach: 3800000,
                    conversion_rate: 4.2,
                    clicks: 195000,
                    impressions: 6800000,
                    revenue: 1750000,
                    roi: 170
                },
                campaignPayments: [
                    {
                        brand_id: brands[5]._id,
                        influencer_id: influencers[0]._id, // Kusha Kapila
                        amount: 450000,
                        status: "completed",
                        payment_date: new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    },
                    {
                        brand_id: brands[5]._id,
                        influencer_id: influencers[7]._id, // Ashish Chanchlani
                        amount: 380000,
                        status: "completed",
                        payment_date: new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    },
                    {
                        brand_id: brands[5]._id,
                        influencer_id: influencers[9]._id, // Rohan Joshi
                        amount: 320000,
                        status: "processing",
                        payment_date: new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    }
                ],
                campaignInfluencers: [
                    {
                        influencer_id: influencers[0]._id, // Kusha Kapila
                        status: "active",
                        progress: 70,
                        engagement_rate: 5.2,
                        reach: 1400000,
                        clicks: 75000,
                        conversions: 3200,
                        timeliness_score: 92,
                        deliverables: [
                            {
                                title: "Restaurant Discovery Series",
                                description: "5-part series exploring different restaurant categories",
                                status: "completed",
                                due_date: new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "Food Review Vlog",
                                description: "Detailed food review and ordering experience",
                                status: "active",
                                due_date: new Date(now.getTime() + (15 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    },
                    {
                        influencer_id: influencers[7]._id, // Ashish Chanchlani
                        status: "active",
                        progress: 65,
                        engagement_rate: 5.0,
                        reach: 1200000,
                        clicks: 60000,
                        conversions: 2800,
                        timeliness_score: 88,
                        deliverables: [
                            {
                                title: "Food Comedy Sketches",
                                description: "Humorous content about food ordering experiences",
                                status: "completed",
                                due_date: new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "Food Challenges",
                                description: "Creative food challenges using Swiggy orders",
                                status: "active",
                                due_date: new Date(now.getTime() + (18 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    }
                ]
            },
            {
                // Campaign 2: Myntra - Fashion Forward 2.0 (Active)
                campaignInfo: {
                    brand_id: brands[6]._id, // Myntra
                    title: "Fashion Forward 2.0",
                    description: "A premium fashion campaign showcasing Myntra's latest collections and styling trends. Influencers will demonstrate versatile styling options, highlight seasonal trends, and showcase the brand's fashion expertise.",
                    status: "active",
                    start_date: new Date(now.getTime() - (8 * 24 * 60 * 60 * 1000)), // Started 8 days ago
                    end_date: new Date(now.getTime() + (22 * 24 * 60 * 60 * 1000)), // Ends in 22 days
                    duration: 30,
                    required_influencers: 4,
                    budget: 2200000,
                    target_audience: "Fashion-conscious individuals aged 18-40, style enthusiasts, and online shoppers",
                    required_channels: ["Instagram", "YouTube"],
                    min_followers: 300000,
                    objectives: "Drive 35% increase in fashion category sales, boost brand engagement, and establish Myntra as the go-to fashion destination"
                },
                campaignMetrics: {
                    brand_id: brands[6]._id,
                    overall_progress: 60,
                    performance_score: 85,
                    engagement_rate: 4.6,
                    reach: 2800000,
                    conversion_rate: 3.8,
                    clicks: 106000,
                    impressions: 4200000,
                    revenue: 950000,
                    roi: 143
                },
                campaignPayments: [
                    {
                        brand_id: brands[6]._id,
                        influencer_id: influencers[2]._id, // Masoom Minawala
                        amount: 500000,
                        status: "completed",
                        payment_date: new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    },
                    {
                        brand_id: brands[6]._id,
                        influencer_id: influencers[6]._id, // Aashna Shroff
                        amount: 420000,
                        status: "completed",
                        payment_date: new Date(now.getTime() - (4 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    }
                ],
                campaignInfluencers: [
                    {
                        influencer_id: influencers[2]._id, // Masoom Minawala
                        status: "active",
                        progress: 80,
                        engagement_rate: 4.8,
                        reach: 1600000,
                        clicks: 77000,
                        conversions: 2900,
                        timeliness_score: 95,
                        deliverables: [
                            {
                                title: "Fashion Week Styling",
                                description: "High-fashion styling with Myntra collections",
                                status: "completed",
                                due_date: new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(now.getTime() - (4 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "Seasonal Collection Review",
                                description: "Review of latest seasonal fashion collections",
                                status: "active",
                                due_date: new Date(now.getTime() + (12 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    },
                    {
                        influencer_id: influencers[6]._id, // Aashna Shroff
                        status: "active",
                        progress: 70,
                        engagement_rate: 4.4,
                        reach: 1200000,
                        clicks: 53000,
                        conversions: 2100,
                        timeliness_score: 90,
                        deliverables: [
                            {
                                title: "Style Guide Series",
                                description: "Complete style guides for different occasions",
                                status: "completed",
                                due_date: new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "Fashion Haul Video",
                                description: "Shopping haul and styling tips",
                                status: "active",
                                due_date: new Date(now.getTime() + (16 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    }
                ]
            },
            {
                // Campaign 3: Netflix India - Original Content Spotlight (Completed)
                campaignInfo: {
                    brand_id: brands[7]._id, // Netflix India
                    title: "Original Content Spotlight",
                    description: "A successful campaign promoting Netflix's Indian original series and movies. Influencers created engaging content around their favorite shows, shared reviews, and highlighted the diversity of content available.",
                    status: "completed",
                    start_date: pastDate1,
                    end_date: new Date(pastDate1.getTime() + (45 * 24 * 60 * 60 * 1000)),
                    duration: 45,
                    required_influencers: 7,
                    budget: 3500000,
                    target_audience: "Streaming enthusiasts aged 18-50, entertainment lovers, and digital content consumers",
                    required_channels: ["Instagram", "YouTube", "Twitter"],
                    min_followers: 350000,
                    objectives: "Increase subscriber base by 25%, boost engagement with Indian content, and promote new original releases"
                },
                campaignMetrics: {
                    brand_id: brands[7]._id,
                    overall_progress: 100,
                    performance_score: 92,
                    engagement_rate: 6.1,
                    reach: 5200000,
                    conversion_rate: 5.8,
                    clicks: 302000,
                    impressions: 8800000,
                    revenue: 2800000,
                    roi: 180
                },
                campaignPayments: [
                    {
                        brand_id: brands[7]._id,
                        influencer_id: influencers[4]._id, // Prajakta Koli
                        amount: 480000,
                        status: "completed",
                        payment_date: new Date(pastDate1.getTime() + (20 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    },
                    {
                        brand_id: brands[7]._id,
                        influencer_id: influencers[5]._id, // Mithila Palkar
                        amount: 420000,
                        status: "completed",
                        payment_date: new Date(pastDate1.getTime() + (25 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    },
                    {
                        brand_id: brands[7]._id,
                        influencer_id: influencers[8]._id, // Diipa Khosla
                        amount: 400000,
                        status: "completed",
                        payment_date: new Date(pastDate1.getTime() + (30 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    }
                ],
                campaignInfluencers: [
                    {
                        influencer_id: influencers[4]._id, // Prajakta Koli
                        status: "completed",
                        progress: 100,
                        engagement_rate: 6.3,
                        reach: 2100000,
                        clicks: 132000,
                        conversions: 7600,
                        timeliness_score: 98,
                        deliverables: [
                            {
                                title: "Show Recommendation Series",
                                description: "Weekly recommendations of Netflix originals",
                                status: "completed",
                                due_date: new Date(pastDate1.getTime() + (10 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(pastDate1.getTime() + (9 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "Binge Watch Challenges",
                                description: "Fun challenges related to Netflix shows",
                                status: "completed",
                                due_date: new Date(pastDate1.getTime() + (35 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(pastDate1.getTime() + (34 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    }
                ]
            },
            {
                // Campaign 4: Urban Company - Home Transformation (Request)
                campaignInfo: {
                    brand_id: brands[8]._id, // Urban Company
                    title: "Home Transformation",
                    description: "A campaign showcasing Urban Company's comprehensive home services. Influencers will demonstrate before/after transformations, highlight service quality, and showcase the convenience of professional home services.",
                    status: "request",
                    start_date: futureDate1,
                    end_date: new Date(futureDate1.getTime() + (35 * 24 * 60 * 60 * 1000)),
                    duration: 35,
                    required_influencers: 3,
                    budget: 1400000,
                    target_audience: "Homeowners aged 25-45, busy professionals, and families seeking reliable home services",
                    required_channels: ["Instagram", "YouTube"],
                    min_followers: 200000,
                    objectives: "Increase service bookings by 40%, build trust in home services, and showcase service quality and reliability"
                },
                campaignMetrics: {
                    brand_id: brands[8]._id,
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
                                title: "Home Cleaning Transformation",
                                description: "Before and after home cleaning service showcase",
                                status: "pending",
                                due_date: new Date(futureDate1.getTime() + (10 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "Service Experience Vlog",
                                description: "Detailed vlog of the complete service experience",
                                status: "pending",
                                due_date: new Date(futureDate1.getTime() + (25 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    }
                ]
            },
            {
                // Campaign 5: CRED - Smart Money Management (Brand Invite)
                campaignInfo: {
                    brand_id: brands[9]._id, // CRED
                    title: "Smart Money Management",
                    description: "An exclusive campaign promoting CRED's financial tools and rewards program. Influencers will create educational content about smart credit card usage, financial planning, and exclusive CRED benefits.",
                    status: "brand-invite",
                    start_date: futureDate2,
                    end_date: new Date(futureDate2.getTime() + (40 * 24 * 60 * 60 * 1000)),
                    duration: 40,
                    required_influencers: 2,
                    budget: 1200000,
                    target_audience: "Credit card users aged 25-45, financially conscious individuals, and premium lifestyle enthusiasts",
                    required_channels: ["Instagram", "YouTube"],
                    min_followers: 250000,
                    objectives: "Increase premium member signups by 45%, boost app engagement, and highlight exclusive rewards and financial benefits"
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
                                description: "Educational content about smart credit card usage and rewards",
                                status: "pending",
                                due_date: new Date(futureDate2.getTime() + (15 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "CRED App Tutorial",
                                description: "Step-by-step tutorial of CRED app features",
                                status: "pending",
                                due_date: new Date(futureDate2.getTime() + (30 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    }
                ]
            },
            {
                // Campaign 6: Mamaearth - Natural Beauty Essentials (Draft)
                campaignInfo: {
                    brand_id: brands[0]._id, // Mamaearth
                    title: "Natural Beauty Essentials",
                    description: "A comprehensive campaign promoting Mamaearth's essential beauty products. Influencers will showcase daily skincare routines, highlight natural ingredients, and demonstrate the brand's commitment to natural beauty.",
                    status: "draft",
                    start_date: futureDate3,
                    end_date: new Date(futureDate3.getTime() + (28 * 24 * 60 * 60 * 1000)),
                    duration: 28,
                    required_influencers: 5,
                    budget: 1800000,
                    target_audience: "Beauty enthusiasts aged 18-35, natural product lovers, and wellness-focused individuals",
                    required_channels: ["Instagram", "YouTube"],
                    min_followers: 250000,
                    objectives: "Increase brand awareness by 30%, drive 20% growth in beauty product sales, and establish Mamaearth as the leading natural beauty brand"
                },
                campaignMetrics: {
                    brand_id: brands[0]._id,
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
                // Campaign 7: Boat - Gaming Audio Experience (Active)
                campaignInfo: {
                    brand_id: brands[1]._id, // Boat
                    title: "Gaming Audio Experience",
                    description: "A specialized campaign targeting gaming enthusiasts. Influencers will showcase Boat's gaming audio products, demonstrate sound quality, and highlight the immersive gaming experience.",
                    status: "active",
                    start_date: new Date(now.getTime() - (12 * 24 * 60 * 60 * 1000)), // Started 12 days ago
                    end_date: new Date(now.getTime() + (18 * 24 * 60 * 60 * 1000)), // Ends in 18 days
                    duration: 30,
                    required_influencers: 4,
                    budget: 1600000,
                    target_audience: "Gaming enthusiasts aged 16-35, tech-savvy youth, and audio quality seekers",
                    required_channels: ["Instagram", "YouTube", "TikTok"],
                    min_followers: 200000,
                    objectives: "Increase gaming product sales by 25%, boost brand engagement among gamers, and establish Boat as the preferred gaming audio brand"
                },
                campaignMetrics: {
                    brand_id: brands[1]._id,
                    overall_progress: 70,
                    performance_score: 87,
                    engagement_rate: 4.9,
                    reach: 2400000,
                    conversion_rate: 4.1,
                    clicks: 98000,
                    impressions: 3600000,
                    revenue: 720000,
                    roi: 145
                },
                campaignPayments: [
                    {
                        brand_id: brands[1]._id,
                        influencer_id: influencers[3]._id, // Ranveer Allahbadia
                        amount: 350000,
                        status: "completed",
                        payment_date: new Date(now.getTime() - (8 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    },
                    {
                        brand_id: brands[1]._id,
                        influencer_id: influencers[7]._id, // Ashish Chanchlani
                        amount: 300000,
                        status: "completed",
                        payment_date: new Date(now.getTime() - (6 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    }
                ],
                campaignInfluencers: [
                    {
                        influencer_id: influencers[3]._id, // Ranveer Allahbadia
                        status: "active",
                        progress: 85,
                        engagement_rate: 5.1,
                        reach: 1100000,
                        clicks: 56000,
                        conversions: 2300,
                        timeliness_score: 93,
                        deliverables: [
                            {
                                title: "Gaming Setup Review",
                                description: "Complete gaming setup with Boat audio products",
                                status: "completed",
                                due_date: new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(now.getTime() - (6 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "Audio Quality Test",
                                description: "Detailed audio quality testing and comparison",
                                status: "active",
                                due_date: new Date(now.getTime() + (10 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    }
                ]
            },
            {
                // Campaign 8: Lenskart - Vision Care Awareness (Completed)
                campaignInfo: {
                    brand_id: brands[3]._id, // Lenskart
                    title: "Vision Care Awareness",
                    description: "A successful awareness campaign about eye health and the importance of proper eyewear. Influencers created educational content about eye care, showcased Lenskart's diverse eyewear collection, and promoted regular eye checkups.",
                    status: "completed",
                    start_date: pastDate2,
                    end_date: new Date(pastDate2.getTime() + (50 * 24 * 60 * 60 * 1000)),
                    duration: 50,
                    required_influencers: 5,
                    budget: 1900000,
                    target_audience: "Individuals aged 16-45 interested in eye health, fashion-conscious people, and those needing eyewear",
                    required_channels: ["Instagram", "YouTube"],
                    min_followers: 180000,
                    objectives: "Increase brand awareness by 40%, drive 25% growth in eyewear sales, and promote eye health awareness"
                },
                campaignMetrics: {
                    brand_id: brands[3]._id,
                    overall_progress: 100,
                    performance_score: 88,
                    engagement_rate: 4.3,
                    reach: 3200000,
                    conversion_rate: 3.6,
                    clicks: 115000,
                    impressions: 4800000,
                    revenue: 855000,
                    roi: 145
                },
                campaignPayments: [
                    {
                        brand_id: brands[3]._id,
                        influencer_id: influencers[2]._id, // Masoom Minawala
                        amount: 400000,
                        status: "completed",
                        payment_date: new Date(pastDate2.getTime() + (20 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    },
                    {
                        brand_id: brands[3]._id,
                        influencer_id: influencers[6]._id, // Aashna Shroff
                        amount: 350000,
                        status: "completed",
                        payment_date: new Date(pastDate2.getTime() + (25 * 24 * 60 * 60 * 1000)),
                        payment_method: "bank_transfer"
                    }
                ],
                campaignInfluencers: [
                    {
                        influencer_id: influencers[2]._id, // Masoom Minawala
                        status: "completed",
                        progress: 100,
                        engagement_rate: 4.5,
                        reach: 1400000,
                        clicks: 63000,
                        conversions: 2270,
                        timeliness_score: 96,
                        deliverables: [
                            {
                                title: "Eyewear Styling Guide",
                                description: "Complete guide to choosing and styling eyewear",
                                status: "completed",
                                due_date: new Date(pastDate2.getTime() + (15 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(pastDate2.getTime() + (14 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "Eye Health Awareness",
                                description: "Educational content about eye health and care",
                                status: "completed",
                                due_date: new Date(pastDate2.getTime() + (35 * 24 * 60 * 60 * 1000)),
                                completed_at: new Date(pastDate2.getTime() + (34 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    }
                ]
            },
            {
                // Campaign 9: Nykaa - Beauty Masterclass (Influencer Invite)
                campaignInfo: {
                    brand_id: brands[2]._id, // Nykaa
                    title: "Beauty Masterclass",
                    description: "An exclusive influencer-driven campaign for Nykaa's beauty education initiative. Influencers will create tutorial content, share beauty tips, and showcase Nykaa's diverse product range.",
                    status: "influencer-invite",
                    start_date: futureDate2,
                    end_date: new Date(futureDate2.getTime() + (35 * 24 * 60 * 60 * 1000)),
                    duration: 35,
                    required_influencers: 6,
                    budget: 2800000,
                    target_audience: "Beauty enthusiasts aged 18-40, makeup lovers, and individuals seeking beauty education",
                    required_channels: ["Instagram", "YouTube", "TikTok"],
                    min_followers: 300000,
                    objectives: "Increase beauty product sales by 40%, boost brand engagement, and establish Nykaa as the ultimate beauty education platform"
                },
                campaignMetrics: {
                    brand_id: brands[2]._id,
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
                        influencer_id: influencers[2]._id, // Masoom Minawala
                        status: "influencer-invite",
                        progress: 0,
                        engagement_rate: 0,
                        reach: 0,
                        clicks: 0,
                        conversions: 0,
                        timeliness_score: 0,
                        deliverables: [
                            {
                                title: "Beauty Tutorial Series",
                                description: "Complete beauty tutorial series for different looks",
                                status: "pending",
                                due_date: new Date(futureDate2.getTime() + (20 * 24 * 60 * 60 * 1000))
                            },
                            {
                                title: "Product Review Series",
                                description: "Detailed reviews of Nykaa beauty products",
                                status: "pending",
                                due_date: new Date(futureDate2.getTime() + (30 * 24 * 60 * 60 * 1000))
                            }
                        ]
                    }
                ]
            },
            {
                // Campaign 10: Swiggy - Weekend Specials (Cancelled)
                campaignInfo: {
                    brand_id: brands[5]._id, // Swiggy
                    title: "Weekend Specials",
                    description: "A campaign that was cancelled due to budget reallocation. Was intended to promote weekend food specials and exclusive restaurant offers on Swiggy.",
                    status: "cancelled",
                    start_date: futureDate1,
                    end_date: new Date(futureDate1.getTime() + (21 * 24 * 60 * 60 * 1000)),
                    duration: 21,
                    required_influencers: 3,
                    budget: 1200000,
                    target_audience: "Weekend food enthusiasts and casual diners",
                    required_channels: ["Instagram", "YouTube"],
                    min_followers: 200000,
                    objectives: "Increase weekend orders and promote special restaurant offers"
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

        // Insert additional campaigns
        for (const campaign of additionalCampaigns) {
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

            console.log(`✅ Created additional campaign: ${campaign.campaignInfo.title}`);
        }

        console.log(`\n📊 Successfully created ${additionalCampaigns.length} additional campaigns with complete data\n`);

        console.log('🎉 Additional campaign data initialization completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   • ${additionalCampaigns.length} Additional campaigns created`);
        console.log('   • Complete campaign metrics, payments, and influencer data');
        console.log('   • Diverse campaign statuses and scenarios');
        console.log('   • Realistic performance metrics and relationships');

    } catch (error) {
        console.error('❌ Error during additional campaign data initialization:', error);
        throw error;
    }
};

module.exports = { initializeAdditionalCampaignData };

// Run the initialization if this file is executed directly
if (require.main === module) {
    initializeAdditionalCampaignData()
        .then(() => {
            console.log('✅ Additional campaign initialization completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Additional campaign initialization failed:', error);
            process.exit(1);
        });
}
