const { mongoose } = require('../models/mongoDB');

// Schema for influencer_info
const influencerInfoSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Full name must be at least 2 characters long'],
        maxlength: [50, 'Full name cannot exceed 50 characters']
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
        minlength: [8, 'Password must be at least 8 characters long']
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
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
    },
    location: {
        type: String,
        trim: true,
        maxlength: [100, 'Location cannot exceed 100 characters']
    },
    profilePicUrl: {
        type: String,
        default: '/images/default-avatar.jpg',
        match: [/^(https?:\/\/.*\.(jpg|jpeg|png|gif)$|\/.*\.(jpg|jpeg|png|gif)$)/, 'Please provide a valid image URL']
    },
    bannerUrl: {
        type: String,
        default: '/images/default-banner.jpg',
        match: [/^(https?:\/\/.*\.(jpg|jpeg|png|gif)$|\/.*\.(jpg|jpeg|png|gif)$)/, 'Please provide a valid image URL']
    },
    verified: {
        type: Boolean,
        default: false
    },
    niche: {
        type: String,
        required: [true, 'Niche is required'],
        trim: true
    },
    categories: [{
        type: String,
        trim: true
    }],
    languages: [{
        type: String,
        trim: true
    }],
    website: {
        type: String,
        trim: true,
        match: [/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'Please provide a valid website URL']
    },
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
    displayName: {
        type: String,
        required: [true, 'Display name is required'],
        trim: true,
        maxlength: [50, 'Display name cannot exceed 50 characters']
    },
    primaryMarket: {
        type: String,
        default: 'Global'
    },
    audienceAgeRange: String,
    audienceGender: {
        type: String,
        enum: ['Male', 'Female', 'Mixed', 'Other']
    },
    avgRating: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be negative'],
        max: [5, 'Rating cannot exceed 5']
    },
    completedCollabs: {
        type: Number,
        default: 0,
        min: [0, 'Completed collabs cannot be negative']
    },
    bestPosts: [{
        platform: {
            type: String,
            enum: ['Instagram', 'YouTube', 'TikTok', 'Twitter', 'Facebook']
        },
        title: String,
        thumbnail: String,
        likes: Number,
        comments: Number,
        views: Number
    }]
}, {
    timestamps: true
});

// Schema for influencer_socials
const influencerSocialsSchema = new mongoose.Schema({
    influencerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InfluencerInfo',
        required: [true, 'Influencer ID is required']
    },
    socialHandle: {
        type: String,
        required: [true, 'Social handle is required'],
        trim: true
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
        category: {
            type: String,
            default: 'general',
            trim: true
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Schema for influencer_analytics
const influencerAnalyticsSchema = new mongoose.Schema({
    influencerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InfluencerInfo',
        required: [true, 'Influencer ID is required']
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
    }]
}, {
    timestamps: true
});

// Create indexes for better query performance
influencerSocialsSchema.index({ influencerId: 1 });
influencerAnalyticsSchema.index({ influencerId: 1 });

// Create models
const InfluencerInfo = mongoose.model('InfluencerInfo', influencerInfoSchema);
const InfluencerSocials = mongoose.model('InfluencerSocials', influencerSocialsSchema);
const InfluencerAnalytics = mongoose.model('InfluencerAnalytics', influencerAnalyticsSchema);

module.exports = {
    InfluencerInfo,
    InfluencerSocials,
    InfluencerAnalytics
};