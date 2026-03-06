const { mongoose } = require('../mongoDB');

const CATEGORIES_ENUM = [
    'Fashion & Apparel', 'Beauty & Personal Care', 'Health & Wellness',
    'Fitness & Sports', 'Food & Beverage', 'Travel & Hospitality',
    'Technology & Gadgets', 'Gaming & Esports', 'Entertainment & Pop Culture',
    'Education & Career', 'Finance & Business', 'Home, Garden & Decor',
    'Parenting & Family', 'Pets & Animals', 'Automotive',
    'Art & Photography', 'Books & Literature', 'Music & Audio',
    'Real Estate', 'Other'
];

const influencerSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePicUrl: String,
    bannerUrl: String,
    verified: { type: Boolean, default: false },
    languages: [String],
    bio: String,
    location: {
        country: String,
        state: String,
        city: String
    },
    niches: [{ type: String, enum: CATEGORIES_ENUM }],
    socialProfiles: [{
        platform: { type: String, enum: ["instagram", "youtube", "twitter"] },
        username: String,
        followers: Number,
        avgViews: Number,
        avgLikes: Number,
        avgComments: Number,
        engagementRate: Number,
        verified: { type: Boolean, default: false }
    }],
    pricing: {
        postPrice: Number,
        reelPrice: Number,
        storyPrice: Number
    },
    performanceMetrics: {
        totalCampaigns: { type: Number, default: 0 },
        avgCampaignEngagementRate: Number,
        performanceScore: Number,
        brands_connected: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }]
    },
    ratings: {
        averageRating: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 }
    },
    isVerified: { type: Boolean, default: false },
    audienceInsights: {
        genderSplit: {
            male: Number,
            female: Number
        },
        topCountries: [{
            country: String,
            percentage: Number
        }],
        ageDistribution: [{
            ageRange: String,
            percentage: Number
        }]
    },
    referralCode: String,
    TotalEarnings: { type: Number, default: 0 },
    availabilityStatus: {
        type: String,
        enum: ["available", "busy", "inactive"],
        default: "available"
    },
    fraud_flags: { type: Boolean, default: false },
    follower_spike_detected: { type: Boolean, default: false },
    bot_detection_score: Number,
    engagement_discrepancy: Number,
    user_subscription_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSubscription' },
    stripeCustomerId: String,
    defaultPaymentMethodId: String,
    billingAddress: String
}, { timestamps: true });

const influencerCampaignSchema = new mongoose.Schema({
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    influencerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Influencer', required: true },
    status: { type: String, enum: ["INVITED", "ACTIVE", "SUBMITTED", "APPROVED", "COMPLETED", "REJECTED"] },
    agreedPaymentAmount: Number,
    paymentStatus: { type: String, enum: ["PENDING", "RELEASED", "FAILED"] },
    paymentId: String,
    attributionRevenue: Number,
    progressPercentage: Number,
    overall_metrics: {
        total_views: { type: Number, default: 0 },
        total_likes: { type: Number, default: 0 },
        total_comments: { type: Number, default: 0 },
        total_shares: { type: Number, default: 0 },
        total_saves: { type: Number, default: 0 },
        total_clicks: { type: Number, default: 0 },
        total_conversions: { type: Number, default: 0 },
        total_revenue_generated: { type: Number, default: 0 }
    },
    message: String
}, { timestamps: true });

const deliverableSchema = new mongoose.Schema({
    influencerCampaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'InfluencerCampaign', required: true },
    title: String,
    description: String,
    platform: { type: String, enum: ["INSTAGRAM", "YOUTUBE", "TIKTOK"] },
    deliverableType: { type: String, enum: ["POST", "REEL", "VIDEO", "STORY"] },
    requirements: {
        numPosts: Number,
        numReels: Number,
        numVideos: Number
    },
    dueDate: Date,
    status: { type: String, enum: ["PENDING", "SUBMITTED", "REVISION_REQUESTED", "APPROVED"] },
    submissions: [{
        version: Number,
        contentUrl: String,
        submittedAt: Date,
        feedback: [{
            message: String,
            givenBy: { type: String, enum: ["BRAND"] },
            createdAt: Date
        }],
        reviewedAt: Date,
        reviewStatus: { type: String, enum: ["APPROVED", "REJECTED"] }
    }],
    metrics: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        saves: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 }
    },
    // add percentage split, enum:{40-60, 50-50, 100}
    payment_split: { type: String, enum: ["40-60", "50-50", "30-70", "100"] },
    completedAt: Date
}, { timestamps: true });

const Influencer = mongoose.model('Influencer', influencerSchema);
const InfluencerCampaign = mongoose.model('InfluencerCampaign', influencerCampaignSchema);
const Deliverable = mongoose.model('Deliverable', deliverableSchema);

module.exports = { Influencer, InfluencerCampaign, Deliverable };
