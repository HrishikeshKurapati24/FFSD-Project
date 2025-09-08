const { mongoose } = require('../models/mongoDB');

// Campaign Info Schema
const campaignInfoSchema = new mongoose.Schema({
    brand_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BrandInfo',
        required: [true, 'Brand ID is required']
    },
    title: {
        type: String,
        required: [true, 'Campaign title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Campaign description is required'],
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'draft', 'cancelled', 'request', 'brand-invite', 'influencer-invite'],
        default: 'draft',
        required: [true, 'Campaign status is required']
    },
    start_date: {
        type: Date,
        required: [true, 'Start date is required']
    },
    end_date: {
        type: Date,
        required: [true, 'End date is required'],
        validate: {
            validator: function (value) {
                return value > this.start_date;
            },
            message: 'End date must be after start date'
        }
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required'],
        min: [1, 'Duration must be at least 1 day']
    },
    budget: {
        type: Number,
        required: [true, 'Budget is required'],
        min: [0, 'Budget cannot be negative']
    },
    target_audience: {
        type: String,
        required: [true, 'Target audience is required'],
        trim: true
    },
    required_channels: [{
        type: String,
        enum: ['Instagram', 'YouTube', 'TikTok', 'Facebook', 'Twitter', 'LinkedIn'],
        required: [true, 'At least one channel is required']
    }],
    min_followers: {
        type: Number,
        required: [true, 'Minimum followers is required'],
        min: [0, 'Minimum followers cannot be negative']
    },
    objectives: {
        type: String,
        required: [true, 'Campaign objectives are required'],
        trim: true,
        maxlength: [500, 'Objectives cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

// Campaign Metrics Schema
const campaignMetricsSchema = new mongoose.Schema({
    campaign_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CampaignInfo',
        required: [true, 'Campaign ID is required']
    },
    brand_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BrandInfo',
        required: [true, 'Brand ID is required']
    },
    performance_score: {
        type: Number,
        min: [0, 'Performance score cannot be negative'],
        max: [100, 'Performance score cannot exceed 100']
    },
    engagement_rate: {
        type: Number,
        min: [0, 'Engagement rate cannot be negative'],
        max: [100, 'Engagement rate cannot exceed 100']
    },
    reach: {
        type: Number,
        min: [0, 'Reach cannot be negative']
    },
    conversion_rate: {
        type: Number,
        min: [0, 'Conversion rate cannot be negative'],
        max: [100, 'Conversion rate cannot exceed 100']
    },
    clicks: {
        type: Number,
        min: [0, 'Clicks cannot be negative']
    },
    impressions: {
        type: Number,
        min: [0, 'Impressions cannot be negative']
    },
    revenue: {
        type: Number,
        min: [0, 'Revenue cannot be negative']
    },
    roi: {
        type: Number,
        min: [0, 'ROI cannot be negative']
    }
}, {
    timestamps: true
});

// Campaign Payments Schema
const campaignPaymentsSchema = new mongoose.Schema({
    campaign_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CampaignInfo',
        required: [true, 'Campaign ID is required']
    },
    brand_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BrandInfo',
        required: [true, 'Brand ID is required']
    },
    influencer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InfluencerInfo',
        required: [true, 'Influencer ID is required']
    },
    amount: {
        type: Number,
        required: [true, 'Payment amount is required'],
        min: [0, 'Payment amount cannot be negative']
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
        required: [true, 'Payment status is required']
    },
    payment_date: {
        type: Date,
        required: [true, 'Payment date is required']
    },
    payment_method: {
        type: String,
        enum: ['bank_transfer', 'credit_card', 'paypal', 'other'],
        required: [true, 'Payment method is required']
    }
}, {
    timestamps: true
});

// Campaign Influencers Schema
const campaignInfluencersSchema = new mongoose.Schema({
    campaign_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CampaignInfo',
        required: [true, 'Campaign ID is required']
    },
    influencer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InfluencerInfo',
        required: [true, 'Influencer ID is required']
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled', 'request', 'brand-invite', 'influencer-invite'],
        default: 'active',
        required: [true, 'Status is required']
    },
    progress: {
        type: Number,
        min: [0, 'Progress cannot be negative'],
        max: [100, 'Progress cannot exceed 100'],
        default: 0
    },
    engagement_rate: {
        type: Number,
        min: [0, 'Engagement rate cannot be negative'],
        max: [100, 'Engagement rate cannot exceed 100']
    },
    reach: {
        type: Number,
        min: [0, 'Reach cannot be negative']
    },
    clicks: {
        type: Number,
        min: [0, 'Clicks cannot be negative']
    },
    conversions: {
        type: Number,
        min: [0, 'Conversions cannot be negative']
    },
    timeliness_score: {
        type: Number,
        min: [0, 'Timeliness score cannot be negative'],
        max: [100, 'Timeliness score cannot exceed 100']
    },
    deliverables: [{
        title: {
            type: String,
            required: [true, 'Deliverable title is required'],
            trim: true
        },
        description: {
            type: String,
            required: [true, 'Deliverable description is required'],
            trim: true
        },
        status: {
            type: String,
            enum: ['request', 'active', 'completed', 'cancelled', 'pending'],
            default: 'pending',
            required: [true, 'Deliverable status is required']
        },
        due_date: {
            type: Date,
            required: [true, 'Due date is required']
        },
        completed_at: {
            type: Date
        }
    }]
}, {
    timestamps: true
});

// Create indexes for better query performance
campaignInfoSchema.index({ brand_id: 1, status: 1 });
campaignMetricsSchema.index({ campaign_id: 1, brand_id: 1 });
campaignPaymentsSchema.index({ campaign_id: 1, brand_id: 1, influencer_id: 1 });
campaignInfluencersSchema.index({ campaign_id: 1, influencer_id: 1 });

// Create models
const CampaignInfo = mongoose.model('CampaignInfo', campaignInfoSchema);
const CampaignMetrics = mongoose.model('CampaignMetrics', campaignMetricsSchema);
const CampaignPayments = mongoose.model('CampaignPayments', campaignPaymentsSchema);
const CampaignInfluencers = mongoose.model('CampaignInfluencers', campaignInfluencersSchema);

module.exports = {
    CampaignInfo,
    CampaignMetrics,
    CampaignPayments,
    CampaignInfluencers
};