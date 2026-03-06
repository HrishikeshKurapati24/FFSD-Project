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

const brandSchema = new mongoose.Schema({
  brandName: { type: String, required: true },
  industry: { type: String, required: true, enum: CATEGORIES_ENUM },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bannerUrl: String,
  logo: String,
  website: String,
  description: String,
  location: {
    country: String,
    state: String,
    city: String
  },
  companySize: { type: String, enum: ["startup", "small", "medium", "enterprise"] },
  campaignStats: {
    totalCampaignsLaunched: { type: Number, default: 0 },
    avgCampaignBudget: Number,
    campaignCompletionRate: Number,
    successRate: Number,
    noOfProductsLaunched: Number,
    noOfProductsSold: Number,
    marketShareTrends: [mongoose.Schema.Types.Mixed],
    activeCampaigns: Number,
    revenueGeneratedInWebsite: Number,
    overallMoneySpent: Number,
    influencersConnected: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Influencer' }]
  },
  ratings: {
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  socialLinks: [{
    platform: String,
    url: String
  }],
  isVerified: { type: Boolean, default: false },
  availabilityStatus: {
    type: String,
    enum: ["available", "busy", "inactive"],
    default: "available"
  },
  customerInsights: {
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
  user_subscription_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserSubscription' },
  stripeCustomerId: String,
  defaultPaymentMethodId: String,
  billingAddress: String
}, { timestamps: true });

const campaignSchema = new mongoose.Schema({
  brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ["active", "completed"], required: true },
  description: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  categories: [{ type: String, enum: CATEGORIES_ENUM }],
  campaign_type: { type: String, enum: ["one-one", "one-many"] },
  budget: { type: Number, required: true },
  required_channels_min_followers: [{
    platform: String,
    min_followers: Number
  }],
  objectives: String,
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
  }
}, { timestamps: true });

const Brand = mongoose.model('Brand', brandSchema);
const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = { Brand, Campaign, CATEGORIES_ENUM };
