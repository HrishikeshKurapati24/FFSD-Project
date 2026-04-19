const { mongoose } = require('../mongoDB');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Schema for brandInfo
const brandInfoSchema = new mongoose.Schema({
    brandName: {
        type: String,
        required: [true, 'Brand name is required'],
        trim: true,
        minlength: [2, 'Brand name must be at least 2 characters long'],
        maxlength: [50, 'Brand name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    displayName: {
        type: String,
        trim: true,
        maxlength: [50, 'Display name cannot exceed 50 characters']
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    industry: {
        type: String,
        required: [true, 'Industry is required'],
        trim: true
    },
    location: {
        type: String,
        trim: true,
        maxlength: [100, 'Location cannot exceed 100 characters']
    },
    website: {
        type: String,
        trim: true,
        match: [/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Please provide a valid website URL']
    },
    mission: {
        type: String,
        trim: true,
        maxlength: [500, 'Mission statement cannot exceed 500 characters']
    },
    currentCampaign: {
        type: String,
        trim: true,
        maxlength: [500, 'Current campaign goals cannot exceed 500 characters']
    },
    values: [{
        type: String,
        trim: true
    }],
    verified: {
        type: Boolean,
        default: false
    },
    logoUrl: {
        type: String,
        default: '/images/default-brand-logo.jpg',
        match: [/^(https?:\/\/.*\.(jpg|jpeg|png|gif)$|\/.*\.(jpg|jpeg|png|gif)$)/, 'Please provide a valid image URL']
    },
    bannerUrl: {
        type: String,
        default: '/images/default-brand-banner.jpg',
        match: [/^(https?:\/\/.*\.(jpg|jpeg|png|gif)$|\/.*\.(jpg|jpeg|png|gif)$)/, 'Please provide a valid image URL']
    },
    categories: [{
        type: String,
        trim: true
    }],
    languages: [{
        type: String,
        trim: true
    }],
    about: {
        type: String,
        trim: true,
        maxlength: [1000, 'About section cannot exceed 1000 characters']
    },
    influenceRegions: {
        type: String,
        default: 'Global',
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    tagline: {
        type: String,
        trim: true,
        maxlength: [200, 'Tagline cannot exceed 200 characters']
    },
    primaryMarket: {
        type: String,
        default: 'Global'
    },
    completedCampaigns: {
        type: Number,
        default: 0,
        min: [0, 'Completed campaigns cannot be negative']
    },
    avgCampaignRating: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5']
    },
    totalAudience: {
        type: Number,
        default: 0,
        min: [0, 'Total audience cannot be negative']
    },
    targetAgeRange: String,
    targetGender: {
        type: String,
        enum: ['Male', 'Female', 'All']
    },
    targetInterests: [{
        type: String,
        trim: true
    }],
    razorpay: {
        customerId: {
            type: String,
            trim: true
        },
        defaultPaymentMethodId: {
            type: String,
            trim: true
        },
        paymentMethodConfigured: {
            type: Boolean,
            default: false
        },
        lastSetupOrderId: {
            type: String,
            trim: true
        }
    },
    paymentProfile: {
        billingName: {
            type: String,
            trim: true
        },
        billingEmail: {
            type: String,
            trim: true,
            lowercase: true
        },
        billingPhone: {
            type: String,
            trim: true
        },
        billingAddress: {
            line1: { type: String, trim: true },
            line2: { type: String, trim: true },
            city: { type: String, trim: true },
            state: { type: String, trim: true },
            postalCode: { type: String, trim: true },
            country: { type: String, trim: true, default: 'US' }
        },
        cardBrand: {
            type: String,
            trim: true
        },
        cardLast4: {
            type: String,
            trim: true
        },
        isComplete: {
            type: Boolean,
            default: false
        },
        completedAt: Date
    },
    brandAccountDetails: {
        legalBusinessName: {
            type: String,
            trim: true
        },
        accountType: {
            type: String,
            enum: ['individual', 'company', 'other'],
            default: 'company'
        },
        taxIdLast4: {
            type: String,
            trim: true
        },
        payoutPreference: {
            type: String,
            enum: ['standard', 'instant', 'manual'],
            default: 'standard'
        }
    },
    // ── High-Performance Embedding (Phase 5) ──────────────────────────────────
    socialProfiles: [{
        platform: { type: String, enum: ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'linkedin'] },
        handle: { type: String, trim: true },
        url: { type: String, trim: true },
        followers: { type: Number, default: 0 },
        engagementRate: { type: Number, default: 0 },
        avgLikes: { type: Number, default: 0 },
        avgComments: { type: Number, default: 0 },
        avgViews: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now }
    }],
    performance_metrics: {
        totalCampaigns: { type: Number, default: 0 },
        activeCampaigns: { type: Number, default: 0 },
        totalSpend: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 },
        avgROI: { type: Number, default: 0 },
        totalImpressions: { type: Number, default: 0 },
        totalReach: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Schema for brandSocials
const brandSocialsSchema = new mongoose.Schema({
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BrandInfo',
        required: [true, 'Brand ID is required']
    },
    platforms: [{
        platform: {
            type: String,
            required: [true, 'Platform name is required'],
            enum: ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'linkedin']
        },
        handle: {
            type: String,
            required: [true, 'Platform handle is required'],
            trim: true
        },
        url: {
            type: String,
            required: [true, 'Platform URL is required'],
            trim: true
        },
        followers: {
            type: Number,
            default: 0,
            min: [0, 'Followers count cannot be negative']
        },
        engagementRate: {
            type: Number,
            default: 0,
            min: [0, 'Engagement rate cannot be negative'],
            max: [100, 'Engagement rate cannot exceed 100']
        },
        avgLikes: {
            type: Number,
            default: 0,
            min: [0, 'Average likes cannot be negative']
        },
        avgComments: {
            type: Number,
            default: 0,
            min: [0, 'Average comments cannot be negative']
        },
        avgViews: {
            type: Number,
            default: 0,
            min: [0, 'Average views cannot be negative']
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Schema for brandAnalytics
const brandAnalyticsSchema = new mongoose.Schema({
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BrandInfo',
        required: [true, 'Brand ID is required']
    },
    totalFollowers: {
        type: Number,
        default: 0,
        min: [0, 'Total followers cannot be negative']
    },
    avgEngagementRate: {
        type: Number,
        default: 0,
        min: [0, 'Average engagement rate cannot be negative'],
        max: [100, 'Average engagement rate cannot exceed 100']
    },
    monthlyEarnings: {
        type: Number,
        default: 0,
        min: [0, 'Monthly earnings cannot be negative']
    },
    earningsChange: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5']
    },
    audienceDemographics: {
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Mixed', 'Other']
        },
        ageRange: {
            type: String,
            match: [/^\d+-\d+$/, 'Age range must be in format "min-max"']
        },
        topLocations: [{
            type: String,
            trim: true
        }]
    },
    performanceMetrics: {
        reach: {
            type: Number,
            default: 0,
            min: [0, 'Reach cannot be negative']
        },
        impressions: {
            type: Number,
            default: 0,
            min: [0, 'Impressions cannot be negative']
        },
        engagement: {
            type: Number,
            default: 0,
            min: [0, 'Engagement cannot be negative']
        },
        conversionRate: {
            type: Number,
            default: 0,
            min: [0, 'Conversion rate cannot be negative'],
            max: [100, 'Conversion rate cannot exceed 100']
        }
    },
    monthlyStats: [{
        month: {
            type: String,
            required: true,
            match: [/^\d{4}-\d{2}$/, 'Month must be in format YYYY-MM']
        },
        followers: Number,
        engagementRate: Number,
        earnings: Number,
        reach: Number,
        impressions: Number
    }],
    campaignMetrics: {
        totalCampaigns: {
            type: Number,
            default: 0,
            min: [0, 'Total campaigns cannot be negative']
        },
        activeCampaigns: {
            type: Number,
            default: 0,
            min: [0, 'Active campaigns cannot be negative']
        },
        totalSpend: {
            type: Number,
            default: 0,
            min: [0, 'Total spend cannot be negative']
        },
        totalRevenue: {
            type: Number,
            default: 0,
            min: [0, 'Total revenue cannot be negative']
        },
        avgROI: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Create indexes for better query performance
brandInfoSchema.index({ brandName: 'text', industry: 'text', description: 'text' }, { default_language: 'english', weights: { brandName: 10, description: 2 } });
brandInfoSchema.index({ brandName: 1 }, { collation: { locale: 'en', strength: 2 } }); // For case-insensitive prefix matching
brandInfoSchema.index({ industry: 1 });                    // explore page brand filter
brandInfoSchema.index({ verified: 1, industry: 1 });       // matchmaking (analogous to InfluencerInfo)
brandSocialsSchema.index({ brandId: 1 });
brandAnalyticsSchema.index({ brandId: 1 });

// Elasticsearch Synchronization Hooks
brandInfoSchema.post('save', async function (doc) {
    try {
        const ElasticsearchService = require('../services/search/elasticsearchService');
        await ElasticsearchService.indexDocument('brands', doc._id.toString(), {
            brandName: doc.brandName,
            displayName: doc.displayName,
            username: doc.username,
            industry: doc.industry,
            description: doc.description,
            bio: doc.bio,
            logoUrl: doc.logoUrl,
            verified: doc.verified,
            completedCampaigns: doc.completedCampaigns || 0
        });
    } catch (error) {
        console.error('[Elasticsearch Sync] Error after BrandInfo save:', error.message);
    }
});

const syncDeleteBrand = async function (doc) {
    if (doc) {
        try {
            const ElasticsearchService = require('../services/search/elasticsearchService');
            await ElasticsearchService.deleteDocument('brands', doc._id.toString());
        } catch (error) {
            console.error('[Elasticsearch Sync] Error after BrandInfo delete:', error.message);
        }
    }
};

brandInfoSchema.post('remove', syncDeleteBrand);
brandInfoSchema.post('findOneAndDelete', syncDeleteBrand);

// Pre-save hook to hash password before saving
brandInfoSchema.pre('save', async function (next) {
    if (this.isModified('password') || this.isNew) {
        try {
            this.password = await bcrypt.hash(this.password, saltRounds);
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// Create models
const BrandInfo = mongoose.model('BrandInfo', brandInfoSchema);
const BrandSocials = mongoose.model('BrandSocials', brandSocialsSchema);
const BrandAnalytics = mongoose.model('BrandAnalytics', brandAnalyticsSchema);

module.exports = {
    BrandInfo,
    BrandSocials,
    BrandAnalytics
};
