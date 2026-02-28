const { BrandInfo, BrandSocials, BrandAnalytics } = require('../../models/BrandMongo');
const { InfluencerInfo } = require('../../models/InfluencerMongo');
const { CampaignInfo, CampaignInfluencers } = require('../../models/CampaignMongo');
const mongoose = require('mongoose');
const CampaignMetrics = mongoose.model('CampaignMetrics');

class brandProfileService {
    // Get brand by ID
    static async getBrandById(id) {
        try {
            const brand = await BrandInfo.findById(id).lean();
            if (brand) {
                const socialLinks = await BrandSocials.findOne({ brandId: id }).lean();
                brand.socialLinks = socialLinks ? socialLinks.platforms : [];
            }
            return brand;
        } catch (err) {
            throw err;
        }
    }

    // Get brand profile formatted for frontend
    static async getBrandProfileData(brandId) {
        try {
            const brand = await this.getBrandById(brandId);
            if (!brand) return null;

            const socialStats = await this.getSocialStats(brandId);
            const topCampaigns = await this.getTopCampaigns(brandId);

            return this.transformBrandProfile(brand, socialStats, topCampaigns);
        } catch (err) {
            console.error('Error fetching brand profile data:', err);
            throw err;
        }
    }

    // Update brand profile with all validation and transformations
    static async updateBrandProfileData(brandId, data) {
        try {
            const requiredFields = ['name', 'username'];
            const missingFields = requiredFields.filter(field => !data[field]);

            if (missingFields.length > 0) {
                throw new Error('Missing required fields: ' + missingFields.join(', '));
            }

            const updateData = {
                brandName: data.name ? data.name.trim() : undefined,
                displayName: data.name ? data.name.trim() : undefined,
                username: data.username ? data.username.trim() : undefined,
                description: data.description ? data.description.trim() : undefined,
                bio: data.mission ? data.mission.trim() : (data.description ? data.description.trim() : undefined),
                location: (data.location || '').trim(),
                primaryMarket: (data.primaryMarket || '').trim(),
                phone: (data.phone || '').trim(),
                industry: (data.industry || '').trim(),
                tagline: (data.tagline || '').trim(),
                website: (data.website || '').trim(),
                audienceGender: (data.targetGender || '').trim(),
                audienceAgeRange: (data.targetAgeRange || '').trim(),
                categories: Array.isArray(data.categories) ? data.categories : [],
                mission: (data.mission || '').trim(),
                currentCampaign: (data.currentCampaign || '').trim(),
                values: Array.isArray(data.values) ? data.values : [],
                targetInterests: Array.isArray(data.targetInterests) ? data.targetInterests : []
            };

            if (data.socialLinks && Array.isArray(data.socialLinks)) {
                try {
                    const socialLinksPayload = data.socialLinks.map(link => {
                        const url = link.url ? link.url.trim() : '';
                        let handle = link.handle;

                        if (!handle && url) {
                            try {
                                const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
                                const pathParts = urlObj.pathname.split('/').filter(p => p);
                                handle = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'brand';
                            } catch (e) {
                                handle = 'brand';
                            }
                        }

                        return {
                            platform: link.platform || 'instagram',
                            url: url,
                            followers: parseInt(link.followers) || 0,
                            handle: handle || 'brand'
                        };
                    });

                    await this.updateSocialLinks(brandId, socialLinksPayload);
                } catch (error) {
                    console.error('Error updating social links:', error);
                }
            }

            return await this.updateBrandProfile(brandId, updateData);
        } catch (error) {
            throw error;
        }
    }

    // Update brand profile (base implementation used above)
    static async updateBrandProfile(brandId, updateData) {
        try {
            // Check if brand exists
            const brand = await BrandInfo.findById(brandId);
            if (!brand) {
                throw new Error('Brand not found');
            }

            // Define allowed fields and their validation rules
            const allowedFields = {
                brandName: { type: 'string', required: false },
                industry: { type: 'string', required: false },
                description: { type: 'string', required: false },
                logoUrl: { type: 'string', required: false },
                website: { type: 'string', required: false },
                categories: { type: 'array', required: false },
                contactEmail: { type: 'string', required: false },
                contactPhone: { type: 'string', required: false },
                status: { type: 'string', required: false, enum: ['active', 'inactive', 'suspended'] }
            };

            // Sanitize and validate update data
            const sanitizedData = {};
            for (const [field, value] of Object.entries(updateData)) {
                if (allowedFields[field]) {
                    const fieldConfig = allowedFields[field];

                    // Type validation
                    if (fieldConfig.type === 'string' && typeof value !== 'string') {
                        throw new Error(`Invalid type for ${field}. Expected string.`);
                    }
                    if (fieldConfig.type === 'array' && !Array.isArray(value)) {
                        throw new Error(`Invalid type for ${field}. Expected array.`);
                    }

                    // Enum validation
                    if (fieldConfig.enum && !fieldConfig.enum.includes(value)) {
                        throw new Error(`Invalid value for ${field}. Allowed values: ${fieldConfig.enum.join(', ')}`);
                    }

                    sanitizedData[field] = value;
                }
            }

            // Update the brand profile
            const updated = await BrandInfo.findByIdAndUpdate(
                brandId,
                { $set: sanitizedData },
                {
                    new: true,
                    runValidators: true
                }
            );

            return updated;
        } catch (err) {
            console.error('Error updating brand profile:', err);
            throw err;
        }
    }

    // Get social stats for a brand
    static async getSocialStats(brandId) {
        try {
            const socials = await BrandSocials.findOne({ brandId });
            if (!socials) {
                return [];
            }
            return socials.platforms || [];
        } catch (err) {
            console.error('Error fetching social stats:', err);
            return [];
        }
    }

    // Get verification status
    static async getVerificationStatus(brandId) {
        try {
            const brand = await BrandInfo.findById(brandId).select('verified');
            return { status: brand?.verified ? 'verified' : 'unverified' };
        } catch (err) {
            console.error('Error getting verification status:', err);
            return { status: 'unverified' };
        }
    }

    // Request verification
    static async requestVerification(brandId, verificationData) {
        try {
            const updated = await BrandInfo.findByIdAndUpdate(
                brandId,
                {
                    $set: {
                        verified: true,
                        verificationData
                    }
                },
                { new: true }
            );
            return updated;
        } catch (err) {
            console.error('Error requesting verification:', err);
            throw err;
        }
    }

    // Update social links
    static async updateSocialLinks(brandId, socials) {
        try {
            // Map input to match BrandSocials schema
            const socialLinksArray = Array.isArray(socials)
                ? socials
                : Object.entries(socials).map(([platform, data]) => ({
                    platform: platform.toLowerCase(),
                    url: data.url,
                    followers: data.followers || 0,
                    // Extract handle from URL if not provided, fallback to brand name part or platform
                    handle: data.handle || (data.url ? data.url.split('/').filter(Boolean).pop() : 'brand')
                }));

            // Update the main BrandSocials document
            const updated = await BrandSocials.findOneAndUpdate(
                { brandId: new mongoose.Types.ObjectId(brandId) },
                {
                    $set: {
                        platforms: socialLinksArray,
                        lastUpdated: new Date()
                    }
                },
                { new: true, upsert: true, runValidators: false }
            );

            return true;
        } catch (err) {
            console.error('Error updating social links:', err);
            throw err;
        }
    }

    // Get brand statistics
    static async getBrandStats(brandId) {
        try {
            const analytics = await BrandAnalytics.findOne({ brandId });
            const activeCampaigns = await CampaignInfo.countDocuments({
                brand_id: brandId,
                status: 'active',
                end_date: { $gt: new Date() }
            });

            const lastMonthAnalytics = await BrandAnalytics.findOne(
                { brandId },
                { monthlyStats: { $slice: [-2, 2] } }
            );

            const currentMonth = lastMonthAnalytics?.monthlyStats[1] || {};
            const previousMonth = lastMonthAnalytics?.monthlyStats[0] || {};

            return {
                total_campaigns: activeCampaigns || 0,
                campaign_growth: activeCampaigns - analytics?.campaignMetrics?.totalCampaigns || 0, // Example growth calculation
                avg_engagement: analytics?.avgEngagementRate || 0,
                engagement_trend: currentMonth.engagementRate - previousMonth.engagementRate || 0,
                total_reach: analytics?.performanceMetrics?.reach || 0,
                reach_growth: ((currentMonth.reach - previousMonth.reach) / (previousMonth.reach || 1)) * 100 || 0,
                roi: analytics?.campaignMetrics?.avgROI || 0,
                roi_trend: 5, // Example trend
                total_clicks: analytics?.performanceMetrics?.clicks || 0,
                total_revenue: analytics?.campaignMetrics?.totalRevenue || 0,
                total_spend: analytics?.campaignMetrics?.totalSpend || 0
            };
        } catch (err) {
            console.error('Error fetching brand stats:', err);
            return {
                total_campaigns: 0,
                campaign_growth: 0,
                avg_engagement: 0,
                engagement_trend: 0,
                total_reach: 0,
                reach_growth: 0,
                roi: 0,
                roi_trend: 0,
                total_clicks: 0,
                total_revenue: 0,
                total_spend: 0
            };
        }
    }

    // Get brand statistics
    static async getBrandStats(brandId) {
        try {
            const analytics = await BrandAnalytics.findOne({ brandId });
            const activeCampaigns = await CampaignInfo.countDocuments({
                brand_id: brandId,
                status: 'active',
                end_date: { $gt: new Date() }
            });

            const lastMonthAnalytics = await BrandAnalytics.findOne(
                { brandId },
                { monthlyStats: { $slice: [-2, 2] } }
            );

            const currentMonth = lastMonthAnalytics?.monthlyStats[1] || {};
            const previousMonth = lastMonthAnalytics?.monthlyStats[0] || {};

            return {
                total_campaigns: activeCampaigns || 0,
                campaign_growth: activeCampaigns - analytics?.campaignMetrics?.totalCampaigns || 0, // Example growth calculation
                avg_engagement: analytics?.avgEngagementRate || 0,
                engagement_trend: currentMonth.engagementRate - previousMonth.engagementRate || 0,
                total_reach: analytics?.performanceMetrics?.reach || 0,
                reach_growth: ((currentMonth.reach - previousMonth.reach) / (previousMonth.reach || 1)) * 100 || 0,
                roi: analytics?.campaignMetrics?.avgROI || 0,
                roi_trend: 5, // Example trend
                total_clicks: analytics?.performanceMetrics?.clicks || 0,
                total_revenue: analytics?.campaignMetrics?.totalRevenue || 0,
                total_spend: analytics?.campaignMetrics?.totalSpend || 0
            };
        } catch (err) {
            console.error('Error fetching brand stats:', err);
            return {
                total_campaigns: 0,
                campaign_growth: 0,
                avg_engagement: 0,
                engagement_trend: 0,
                total_reach: 0,
                reach_growth: 0,
                roi: 0,
                roi_trend: 0,
                total_clicks: 0,
                total_revenue: 0,
                total_spend: 0
            };
        }
    }

    // Get brand analytics
    static async getBrandAnalytics(brandId) {
        try {
            const analytics = await BrandAnalytics.findOne({ brandId });

            if (!analytics) {
                // Return default analytics if none exist
                return {
                    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    engagementRates: [5, 6, 7, 8, 9, 10],
                    clickThroughRates: [2, 3, 4, 5, 6, 7],
                    productsSold: [100, 150, 200, 250, 300, 350],
                    conversionRates: [1, 2, 3, 4, 5, 6],
                    demographics: {
                        labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
                        data: [25, 35, 20, 15, 5]
                    }
                };
            }

            // Transform the analytics data for the dashboard
            const monthlyStats = analytics.monthlyStats || [];
            const last6Months = monthlyStats.slice(-6);

            return {
                months: last6Months.map(stat => {
                    const date = new Date(stat.month);
                    return date.toLocaleString('default', { month: 'short' });
                }),
                engagementRates: last6Months.map(stat => stat.engagementRate || 0),
                clickThroughRates: last6Months.map(stat => {
                    const clicks = stat.clicks || 0;
                    const impressions = stat.impressions || 1;
                    return (clicks / impressions) * 100;
                }),
                productsSold: last6Months.map(stat => stat.conversions || 0),
                conversionRates: last6Months.map(stat => stat.conversionRate || 0),
                demographics: {
                    labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
                    data: [25, 35, 20, 15, 5] // Example demographic data
                }
            };
        } catch (err) {
            console.error('Error fetching brand analytics:', err);
            // Return default analytics in case of error
            return {
                months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                engagementRates: [5, 6, 7, 8, 9, 10],
                clickThroughRates: [2, 3, 4, 5, 6, 7],
                productsSold: [100, 150, 200, 250, 300, 350],
                conversionRates: [1, 2, 3, 4, 5, 6],
                demographics: {
                    labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
                    data: [25, 35, 20, 15, 5]
                }
            };
        }
    }

    static async getExplorePageData(brandId, category, search) {
        const searchQuery = search || '';
        const selectedCategory = category || 'all';

        // Get all influencers
        let allInfluencers = [];
        try {
            allInfluencers = await InfluencerInfo.find({}).lean();
        } catch (e) { console.error(e); }

        const categoriesSet = new Set();
        allInfluencers.forEach(influencer => {
            if (influencer.categories && Array.isArray(influencer.categories)) {
                influencer.categories.forEach(cat => categoriesSet.add(cat.trim()));
            }
        });
        const categories = Array.from(categoriesSet).sort();

        let filteredInfluencers = allInfluencers;
        if (selectedCategory && selectedCategory !== 'all') {
            filteredInfluencers = filteredInfluencers.filter(influencer =>
                influencer.categories && influencer.categories.some(cat =>
                    cat.toLowerCase().includes(selectedCategory.toLowerCase())
                )
            );
        }

        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            filteredInfluencers = filteredInfluencers.filter(influencer =>
                (influencer.fullName && influencer.fullName.toLowerCase().includes(searchLower)) ||
                (influencer.username && influencer.username.toLowerCase().includes(searchLower)) ||
                (influencer.bio && influencer.bio.toLowerCase().includes(searchLower)) ||
                (influencer.categories && influencer.categories.some(cat =>
                    cat.toLowerCase().includes(searchLower)
                ))
            );
        }

        let influencersWithCollaboration = filteredInfluencers;

        if (brandId) {
            const collaborations = await CampaignInfluencers.find({
                campaign_id: {
                    $in: await CampaignInfo.find({ brand_id: brandId }).distinct('_id')
                },
                status: { $in: ['active', 'completed'] }
            }).populate('campaign_id', 'title').populate('influencer_id', '_id').lean();

            const collaborationMap = {};
            collaborations.forEach(collab => {
                if (!collab || !collab.influencer_id) return;
                const influencerId = collab.influencer_id._id.toString();
                if (!collaborationMap[influencerId]) {
                    collaborationMap[influencerId] = [];
                }
                collaborationMap[influencerId].push({
                    campaignTitle: collab.campaign_id ? collab.campaign_id.title : '',
                    revenue: collab.revenue || 0
                });
            });

            influencersWithCollaboration = filteredInfluencers.map(influencer => ({
                ...influencer,
                previousCollaborations: collaborationMap[influencer._id.toString()] || []
            }));

            const demoInfluencer = {
                _id: 'demo-rohan-joshi',
                fullName: 'Rohan Joshi',
                displayName: 'Rohan Joshi',
                profilePicUrl: '/images/default-profile.jpg',
                verified: true,
                categories: ['Comedy', 'Writing', 'Acting', 'Entertainment'],
                totalFollowers: 2200000,
                avgEngagementRate: 4.10,
                audienceDemographics: {
                    gender: 'Mixed',
                    ageRange: '20-40'
                },
                previousCollaborations: [
                    { campaignTitle: 'Summer Fashion Campaign', revenue: 25000 },
                    { campaignTitle: 'Tech Gadgets Review', revenue: 18000 }
                ]
            };

            influencersWithCollaboration = [demoInfluencer, ...influencersWithCollaboration];
        }

        return {
            influencers: influencersWithCollaboration,
            searchQuery,
            selectedCategory,
            categories
        };
    }

    static parseCategories(categories) {
        if (!categories) return [];
        if (Array.isArray(categories)) return categories;
        if (typeof categories === 'string') {
            try {
                return JSON.parse(categories);
            } catch (e) {
                return categories.split(',').map(cat => cat.trim()).filter(Boolean);
            }
        }
        return [];
    }

    static toArrayField(value) {
        if (!value) return [];
        if (Array.isArray(value)) return value.filter(Boolean);
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed.filter(Boolean);
                }
            } catch (error) {
            }
            return value.split(',').map(item => item.trim()).filter(Boolean);
        }
        return [];
    }

    static buildSocialSummaries(socialStats = []) {
        const platformIconMap = {
            instagram: 'instagram',
            youtube: 'youtube',
            tiktok: 'tiktok',
            facebook: 'facebook',
            twitter: 'twitter',
            linkedin: 'linkedin'
        };

        return socialStats.map(stat => {
            const platform = (stat.platform || 'link').toLowerCase();
            const followers = Number(stat.followers || 0);
            const avgLikes = stat.avgLikes !== undefined ? Number(stat.avgLikes) : Math.round(followers * 0.05);
            const avgComments = stat.avgComments !== undefined ? Number(stat.avgComments) : Math.round(followers * 0.01);
            const avgViews = stat.avgViews !== undefined
                ? Number(stat.avgViews)
                : (platform === 'youtube' ? Math.round(followers * 2) : Math.round(followers * 0.1));

            return {
                platform,
                name: stat.platform ? stat.platform.charAt(0).toUpperCase() + stat.platform.slice(1) : 'Platform',
                icon: platformIconMap[platform] || 'link',
                followers,
                avgLikes,
                avgComments,
                avgViews
            };
        });
    }

    static buildBestPosts(topCampaigns = []) {
        return topCampaigns.slice(0, 6).map(campaign => {
            const reach = Number(campaign.reach || 0);
            return {
                id: campaign._id || campaign.id,
                title: campaign.title || 'Campaign',
                thumbnail: campaign.thumbnail || '/images/default-campaign.jpg',
                platform: (campaign.platform || 'link').toLowerCase(),
                likes: campaign.likes || Math.round(reach * 0.05),
                comments: campaign.comments || Math.round(reach * 0.01),
                views: campaign.views || reach,
                url: campaign.url || '#'
            };
        });
    }

    static calculatePerformanceOverview(brandData = {}, socialStats = []) {
        const totalFollowers = socialStats.reduce((sum, stat) => sum + Number(stat.followers || 0), 0);
        const fallbackEngagement = socialStats.length
            ? socialStats.reduce((sum, stat) => sum + Number(stat.engagementRate || 3), 0) / socialStats.length
            : 3.5;
        const avgEngagementRateValue = Number(brandData.avgEngagementRate ?? fallbackEngagement);
        const avgEngagementRate = Number(avgEngagementRateValue.toFixed(1));

        const reach = brandData.performanceMetrics?.reach || Math.floor(totalFollowers * (avgEngagementRate / 100) * 10);
        const impressions = brandData.performanceMetrics?.impressions || Math.floor(reach * 3);
        const engagement = brandData.performanceMetrics?.engagement || Math.floor(impressions * (avgEngagementRate / 100));
        const conversionSeed = brandData.performanceMetrics?.conversionRate ?? brandData.conversionRate ?? 2.5;
        const conversionRate = Number(Number(conversionSeed || 0).toFixed(1));

        return {
            totalFollowers,
            avgEngagementRate,
            performanceMetrics: {
                reach,
                impressions,
                engagement,
                conversionRate
            }
        };
    }

    static transformBrandProfile(brandDoc, socialStats = [], topCampaigns = []) {
        if (!brandDoc) return null;

        const brandData = brandDoc.toObject ? brandDoc.toObject() : brandDoc;
        const categories = this.toArrayField(brandData.categories);
        const languages = this.toArrayField(brandData.languages);
        const socials = this.buildSocialSummaries(socialStats);
        const bestPosts = this.buildBestPosts(topCampaigns);
        const { totalFollowers, avgEngagementRate, performanceMetrics } = this.calculatePerformanceOverview(brandData, socialStats);

        return {
            ...brandData,
            displayName: brandData.displayName || brandData.brandName || brandData.name || 'Unknown Brand',
            fullName: brandData.fullName || brandData.displayName || brandData.brandName || 'Unknown Brand',
            name: brandData.brandName || brandData.displayName || 'Unknown Brand',
            username: brandData.username || '',
            bio: brandData.bio || brandData.mission || 'No bio available',
            description: brandData.description || brandData.bio || '',
            profilePicUrl: brandData.logoUrl || brandData.profilePicUrl || '/images/default-brand.png',
            totalFollowers,
            avgEngagementRate,
            completedCollabs: topCampaigns.length,
            rating: brandData.rating || brandData.avgCampaignRating || 0,
            socials,
            bestPosts,
            performanceMetrics,
            audienceDemographics: {
                gender: brandData.targetGender || 'Mixed',
                ageRange: brandData.targetAgeRange || '18-45'
            },
            categories,
            languages,
            mission: brandData.mission || brandData.bio || '',
            website: brandData.website || `https://${brandData.username || 'brand'}.com`,
            location: brandData.location || '',
            values: categories,
            socialLinks: Array.isArray(brandData.socialLinks) && brandData.socialLinks.length > 0
                ? brandData.socialLinks
                : socials.map(social => ({
                    platform: social.platform,
                    url: social.url || `https://${social.platform}.com/${brandData.username || ''}`,
                    followers: social.followers
                })),
            topCampaigns: topCampaigns.map(campaign => ({
                id: campaign.id || campaign._id,
                title: campaign.title,
                status: campaign.status || 'Active',
                performance_score: campaign.performance_score || 0,
                reach: campaign.reach || 0
            }))
        };
    }

    static async getBrandDashboardData(brandId, successMessage, SubscriptionService, brandCampaignService, Product, getInfluencerRankings) {
        try {
            const userType = 'brand';

            const [subscriptionStatus, subscriptionLimits] = await Promise.all([
                SubscriptionService.checkSubscriptionExpiry(brandId, userType),
                SubscriptionService.getSubscriptionLimitsWithUsage(brandId, userType)
            ]);

            const [brand, stats, activeCampaigns, analytics, campaignRequests, recentCompletedCampaigns, completedProgressCampaigns, influencerRankings, brandProducts] = await Promise.all([
                this.getBrandById(brandId),
                this.getBrandStats(brandId),
                brandCampaignService.getActiveCampaigns(brandId),
                this.getBrandAnalytics(brandId),
                brandCampaignService.getCampaignRequests(brandId),
                brandCampaignService.getRecentCompletedCampaigns(brandId, 3),
                brandCampaignService.getCompletedProgressCampaigns(brandId),
                this.getInfluencerRankings(brandId),
                (async () => {
                    try {
                        const products = await Product.find({ brand_id: brandId })
                            .populate('campaign_id', 'title status')
                            .sort({ createdAt: -1 })
                            .lean();

                        return products.map(product => ({
                            _id: product._id,
                            name: product.name,
                            description: product.description,
                            images: product.images,
                            original_price: product.original_price,
                            campaign_price: product.campaign_price,
                            discount_percentage: product.discount_percentage,
                            category: product.category,
                            tags: product.tags,
                            target_quantity: product.target_quantity,
                            sold_quantity: product.sold_quantity,
                            status: product.status,
                            campaign: product.campaign_id ? {
                                title: product.campaign_id.title,
                                status: product.campaign_id.status
                            } : null,
                            createdAt: product.createdAt
                        }));
                    } catch (error) {
                        return [];
                    }
                })()
            ]);

            if (!brand) throw new Error('Brand not found');

            const transformedBrandData = {
                brand: {
                    ...brand,
                    name: brand.brandName || brand.displayName || brand.name,
                    username: brand.username,
                    description: brand.bio,
                    logoUrl: brand.profilePicUrl || brand.logoUrl || brand.logo_url,
                    bannerUrl: brand.bannerUrl,
                    verified: brand.verified,
                    location: brand.location,
                    primaryMarket: brand.primaryMarket,
                    phone: brand.phone,
                    industry: brand.industry,
                    tagline: brand.tagline,
                    targetInterests: this.parseCategories(brand.targetInterests),
                    currentCampaign: brand.currentCampaign,
                    values: this.parseCategories(brand.values),
                    categories: this.parseCategories(brand.categories),
                    mission: brand.mission,
                    website: brand.website,
                    targetAgeRange: brand.targetAgeRange,
                    targetGender: brand.targetGender,
                    socialLinks: brand.socialLinks || []
                },
                stats: {
                    activeCampaigns: stats?.total_campaigns || 0,
                    campaignGrowth: stats?.campaign_growth || 0,
                    avgEngagement: stats?.avg_engagement || 0,
                    engagementTrend: stats?.engagement_trend || 0,
                    totalReach: stats?.total_reach || 0,
                    reachGrowth: stats?.reach_growth || 0,
                    roi: stats?.roi || 0,
                    roiTrend: stats?.roi_trend || 0,
                    totalClicks: stats?.total_clicks || 0,
                    totalRevenue: stats?.total_revenue || 0,
                    totalSpend: stats?.total_spend || 0
                },
                activeCampaigns: activeCampaigns.map(campaign => ({
                    ...campaign,
                    progress: Math.min(100, Math.max(0, campaign.progress || 0)),
                    engagement_rate: campaign.engagement_rate || 0,
                    reach: campaign.reach || 0,
                    conversion_rate: campaign.conversion_rate || 0,
                    daysRemaining: Math.max(0, Math.ceil((new Date(campaign.end_date) - new Date()) / (1000 * 60 * 60 * 24))),
                    influencersCount: campaign.influencers_count || 0
                })),
                campaignRequests: await Promise.all(campaignRequests.map(async (request) => {
                    const products = await Product.find({ campaign_id: request._id }).lean();
                    return {
                        _id: request._id,
                        title: request.title,
                        description: request.description,
                        status: request.status,
                        start_date: request.start_date,
                        startDate: request.start_date,
                        duration: request.duration,
                        budget: request.budget,
                        target_audience: request.target_audience,
                        required_channels: request.required_channels,
                        min_followers: request.min_followers,
                        objectives: request.objectives,
                        influencers_count: request.influencers_count || 0,
                        products: products.map(p => ({
                            _id: p._id,
                            name: p.name,
                            campaign_price: p.campaign_price,
                            images: p.images
                        }))
                    };
                })),
                analytics: {
                    months: analytics.months || [],
                    engagementRates: analytics.engagementRates || [],
                    clickThroughRates: analytics.clickThroughRates || [],
                    productsSold: analytics.productsSold || [],
                    conversionRates: analytics.conversionRates || [],
                    demographics: analytics.demographics || {
                        labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
                        data: [25, 35, 20, 15, 5]
                    }
                },
                successMessage,
                completedProgressCampaigns,
                subscriptionStatus,
                subscriptionLimits,
                recentCompletedCampaigns,
                influencerRankings,
                brandProducts
            };

            return transformedBrandData;
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    }

    // Get influencer rankings based on revenue from their links
    static async getInfluencerRankings(brandId) {
        try {
            const campaigns = await CampaignInfo.find({ brand_id: brandId }).select('_id title');
            if (campaigns.length === 0) return [];
            const campaignIds = campaigns.map(c => c._id);

            const rankings = await CampaignInfluencers.aggregate([
                { $match: { campaign_id: { $in: campaignIds }, status: { $in: ['active', 'completed'] } } },
                { $lookup: { from: 'influencerinfos', localField: 'influencer_id', foreignField: '_id', as: 'influencer' } },
                { $unwind: '$influencer' },
                {
                    $group: {
                        _id: '$influencer_id',
                        name: { $first: '$influencer.fullName' },
                        totalRevenue: { $sum: '$revenue' },
                        campaignCount: { $addToSet: '$campaign_id' }
                    }
                },
                { $project: { _id: 1, name: 1, totalRevenue: 1, campaignCount: { $size: '$campaignCount' } } },
                { $sort: { totalRevenue: -1 } },
                { $limit: 10 }
            ]);
            return rankings;
        } catch (error) {
            console.error('Error getting influencer rankings:', error);
            return [];
        }
    }

    // Get top campaigns for a brand (ported from brandModel.js)
    static async getTopCampaigns(brandId) {
        try {
            const validCampaigns = await CampaignInfo.find({
                brand_id: brandId,
                status: { $in: ['active', 'completed'] }
            }).select('_id').lean();

            const validCampaignIds = validCampaigns.map(c => c._id);
            if (validCampaignIds.length === 0) return [];

            const topCampaigns = await CampaignMetrics.find({
                brand_id: brandId,
                campaign_id: { $in: validCampaignIds }
            })
                .sort({ performance_score: -1 })
                .limit(5)
                .populate('campaign_id', 'title status')
                .lean();

            return topCampaigns.map(metric => ({
                _id: metric._id,
                id: metric.campaign_id?._id || metric.campaign_id,
                title: metric.campaign_id?.title || 'Untitled Campaign',
                status: metric.campaign_id?.status || 'active',
                performance_score: metric.performance_score || 0,
                reach: metric.reach || 0,
                engagement_rate: metric.engagement_rate || 0
            }));
        } catch (err) {
            console.error('Error fetching top campaigns:', err);
            return [];
        }
    }

    // Get previous collaborations (completed campaigns) sorted by ROI (ported from brandModel.js)
    static async getPreviousCollaborations(brandId) {
        try {
            const brandObjectId = new mongoose.Types.ObjectId(brandId);
            const campaigns = await CampaignInfo.find({
                brand_id: brandObjectId,
                status: 'completed'
            }).lean();

            if (!campaigns.length) return [];

            const campaignIds = campaigns.map(c => c._id);
            const [metrics, influencerCounts, campaignInfluencers] = await Promise.all([
                CampaignMetrics.find({ campaign_id: { $in: campaignIds } }).lean(),
                CampaignInfluencers.aggregate([
                    { $match: { campaign_id: { $in: campaignIds } } },
                    { $group: { _id: '$campaign_id', count: { $sum: 1 } } }
                ]),
                CampaignInfluencers.find({ campaign_id: { $in: campaignIds } })
                    .populate('influencer_id', 'displayName name username profilePicUrl verified')
                    .lean()
            ]);

            const metricsMap = new Map();
            metrics.forEach(m => metricsMap.set(m.campaign_id.toString(), m));

            const influencerCountMap = new Map();
            influencerCounts.forEach(c => influencerCountMap.set(c._id.toString(), c.count));

            const influencersByCampaign = {};
            campaignInfluencers.forEach(ci => {
                const campaignId = ci.campaign_id.toString();
                if (!influencersByCampaign[campaignId]) influencersByCampaign[campaignId] = [];
                if (ci.influencer_id) {
                    influencersByCampaign[campaignId].push({
                        id: ci.influencer_id._id,
                        name: ci.influencer_id.displayName || ci.influencer_id.name || 'Unknown Influencer',
                        username: ci.influencer_id.username || '',
                        profilePicUrl: ci.influencer_id.profilePicUrl || '/images/default-avatar.jpg',
                        verified: ci.influencer_id.verified || false,
                        progress: ci.progress || 0,
                        performance_score: ci.performance_score || 0,
                        engagement_rate: ci.engagement_rate || 0,
                        reach: ci.reach || 0,
                        status: ci.status || 'completed'
                    });
                }
            });

            return campaigns
                .map(campaign => {
                    const m = metricsMap.get(campaign._id.toString()) || {};
                    return {
                        _id: campaign._id,
                        title: campaign.title,
                        end_date: campaign.end_date,
                        budget: campaign.budget || 0,
                        roi: m.roi || 0,
                        influencersCount: influencerCountMap.get(campaign._id.toString()) || 0,
                        influencers: influencersByCampaign[campaign._id.toString()] || []
                    };
                })
                .sort((a, b) => b.roi - a.roi);
        } catch (err) {
            console.error('Error fetching previous collaborations:', err);
            return [];
        }
    }

    // Get current partnerships (active campaigns) (ported from brandModel.js)
    static async getCurrentPartnerships(brandId) {
        try {
            const brandObjectId = new mongoose.Types.ObjectId(brandId);
            const campaigns = await CampaignInfo.find({
                brand_id: brandObjectId,
                status: 'active'
            })
                .select('title start_date budget required_channels')
                .sort({ start_date: -1 })
                .lean();

            if (!campaigns.length) return [];

            const campaignIds = campaigns.map(c => c._id);
            const { Product } = require('../../models/ProductMongo');

            const [products, campaignInfluencers] = await Promise.all([
                Product.find({ campaign_id: { $in: campaignIds }, status: 'active' })
                    .select('campaign_id name description original_price campaign_price category images target_quantity sold_quantity is_digital delivery_info tags')
                    .lean(),
                CampaignInfluencers.find({ campaign_id: { $in: campaignIds }, status: 'active' })
                    .populate('influencer_id', 'displayName name username profilePicUrl verified')
                    .lean()
            ]);

            const productsByCampaign = {};
            products.forEach(product => {
                const cId = product.campaign_id.toString();
                if (!productsByCampaign[cId]) productsByCampaign[cId] = [];
                productsByCampaign[cId].push({
                    name: product.name,
                    description: product.description,
                    originalPrice: product.original_price,
                    campaignPrice: product.campaign_price,
                    category: product.category,
                    images: product.images,
                    targetQuantity: product.target_quantity,
                    soldQuantity: product.sold_quantity,
                    isDigital: product.is_digital,
                    deliveryInfo: product.delivery_info,
                    tags: product.tags
                });
            });

            const influencersByCampaign = {};
            campaignInfluencers.forEach(ci => {
                const cId = ci.campaign_id.toString();
                if (!influencersByCampaign[cId]) influencersByCampaign[cId] = [];
                if (ci.influencer_id) {
                    influencersByCampaign[cId].push({
                        id: ci.influencer_id._id,
                        name: ci.influencer_id.displayName || ci.influencer_id.name || 'Unknown Influencer',
                        username: ci.influencer_id.username || '',
                        profilePicUrl: ci.influencer_id.profilePicUrl || '/images/default-avatar.jpg',
                        verified: ci.influencer_id.verified || false,
                        progress: ci.progress || 0,
                        status: ci.status || 'active'
                    });
                }
            });

            return campaigns.map(campaign => ({
                ...campaign,
                products: productsByCampaign[campaign._id.toString()] || [],
                influencers: influencersByCampaign[campaign._id.toString()] || []
            }));
        } catch (err) {
            console.error('Error fetching current partnerships:', err);
            return [];
        }
    }

    static async updateProfileImages(brandId, files) {
        const updateData = {};
        const { uploadToCloudinary } = require('../../utils/cloudinary');

        if (files && files['logo']) {
            const logoUrl = await uploadToCloudinary(files['logo'][0], 'brand-logos');
            if (logoUrl) updateData.logoUrl = logoUrl;
        }

        if (files && files['banner']) {
            const bannerUrl = await uploadToCloudinary(files['banner'][0], 'brand-banners');
            if (bannerUrl) updateData.bannerUrl = bannerUrl;
        }

        if (Object.keys(updateData).length === 0) throw new Error('No images were uploaded');

        const updatedBrand = await BrandInfo.findByIdAndUpdate(
            brandId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedBrand) throw new Error('Brand not found');

        return updatedBrand;
    }

    static async deleteAccount(brandId) {
        const campaignIds = await CampaignInfo.find({ brand_id: brandId }).distinct('_id');

        await Promise.all([
            BrandInfo.findByIdAndDelete(brandId),
            CampaignInfo.deleteMany({ brand_id: brandId }),
            CampaignInfluencers.deleteMany({ campaign_id: { $in: campaignIds } }),
            BrandSocials.deleteOne({ brandId }),
            BrandAnalytics.deleteOne({ brandId }),
            mongoose.model('CampaignPayments').deleteMany({ brand_id: brandId })
        ]);

        return { success: true };
    }
}

module.exports = brandProfileService;
