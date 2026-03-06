1) Brand schemas:
Profile schema:
 {
    brandName, 
   industry = {"fashion", "tech", "beauty", "fitness", "education", "food", "gaming"}
   email:
   password:
   banner url, logo, 
   website:
   description:
   location: {country, state, city}
   companySize: {"startup", "small", "medium" "enterprise"}


   campaignStats: {
    totalCampaignsLaunched: { type: Number, default: 0 },
    avgCampaignBudget: Number,
    campaignCompletionRate: Number,
    successRate: Number
    no. of products launched:
    no. of products sold: 
    market share trends array, 
    activeCampaigns: 
    revenue generate in this website, 
    overall money spent, 

influencersConnected: 

  },


  ratings: {
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },

  socialLinks: [{
    platform: String,
    url: String
  }],

  isVerified: { type: Boolean, default: false }


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
    
    user_subscription_id,
    stripeCustomerId, 
    defaultPaymentMethodId, 
    billingAddress

}

Campaigns schema:
{
camapign_id, 
brand_id, 
title, 
status: active, compleated, 
description, 
start_date, 
end_date, 
categories(options to select from),
campaign_type: {1-1, 1-m} 
budget, 

required_channels & min_followers: {array of objects, platform, min_followers}
objectives, 

// aggrigated from influencer_campaign
progressPercentage,   // optional (can also compute dynamically)

  overall_metrics: {
  total_views,
  total_likes,
  total_comments,
  total_shares,
  total_saves,              // optional
  total_clicks,
  total_conversions,
  total_revenue_generated
}
}

2) Influencer Schemas:
Profile schema:
{fullName
email (shouldn't be shown to the brand)
password
profilePicUrl, bannerUrl 
verified, 
languages
bio
location {}
niches {options to select from}

socialProfiles:
 platform: {
      type: String,
      enum: ["instagram", "youtube", "twitter"]
    },
username: String,
    followers: Number,
    avgViews: Number,
    avgLikes: Number,
    avgComments: Number,
    engagementRate: Number,
    verified: { type: Boolean, default: false }


pricing: {
    postPrice: Number,
    reelPrice: Number,
    storyPrice: Number,
  },

performanceMetrics: {
    totalCampaigns: { type: Number, default: 0 },
    avgCampaignEngagementRate: Number,
    performanceScore: Number

    brands_connected, 
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

referralCode Auto-generated

TotalEarnings, 

 availabilityStatus: {
    type: String,
    enum: ["available", "busy", "inactive"],
    default: "available"
  },

new options(Think about it-> If you can detect it after simulation also, only then add it.), 
--

fraud_flags,
follower_spike_detected, 
bot_detection_score, 
engagement_discrepancy

user_subscription_id, stripeCustomerId, defaultPaymentMethodId, billingAddress}

Campaign schema:
InfluencerCampaign {
  _id,

  campaignId,        // parent campaign
  brandId,
  influencerId,

  status,            // INVITED | ACTIVE | SUBMITTED | APPROVED | COMPLETED | REJECTED

  agreedPaymentAmount,
  paymentStatus,     // PENDING | RELEASED | FAILED
  paymentId,

  attributionRevenue,   // commission from orders

  progressPercentage,   // optional (can also compute dynamically)

  overall_metrics: {
  total_views,
  total_likes,
  total_comments,
  total_shares,
  total_saves,              // optional
  total_clicks,
  total_conversions,
  total_revenue_generated
}

  Deliverable {
  _id,

  influencerCampaignId,

  title,
  description,

  platform,            // INSTAGRAM | YOUTUBE | TIKTOK
  deliverableType,     // POST | REEL | VIDEO | STORY

  requirements: {
    numPosts,
    numReels,
    numVideos
  },

  dueDate,

  status,              // PENDING | SUBMITTED | REVISION_REQUESTED | APPROVED

  submissions: [
    {
      version,
      contentUrl,
      submittedAt,
      feedback: [
        {
          message,
          givenBy,         // BRAND
          createdAt
        }
      ],
      reviewedAt,
      reviewStatus        // APPROVED | REJECTED
    }
  ],

  metrics: {
  views,
  likes,
  comments,
  shares,
  saves,              // optional
  clicks,
  conversions,
}

  completedAt,

  createdAt,
  updatedAt
}

message: Optional(When influencer applies to campaign, they can add a message to the brand)

  createdAt,
  updatedAt
}

3) Products:
Products schema:
{brand_id, 
campaign_id, 
name_product, 
description, 
images   --- to show for the influencer and the brand, 
original_price, 
campaign_price, 

category {fasion, beauty, games, accessories, etc, }
target_quantity
sold_quantity

delivery_info {have estimated days, shipping cost, }
status {active, inactive, out_of_stock, discontinued}
attributed_influencer_id}

4)Customer schemas:
Customer schema:
{customer_id, 
name, 
email, 
password, 
phone, 
is_verified, 
location: {array of "city", "state", "country"}
 
| preferences | Existing | Object with categories, brands, price_range |
| categories | Existing | Array |
| brands | Existing | Array |
| price_range | Existing | Object with min, max |

| total_purchases | Existing | Default 0 |
| total_spent | Existing | Default 0 |
| status : {active, inactive, suspended, banned} |

| last_purchase_date | Existing | Default null |

active_order_ids

stripeCustomerId, 
    defaultPaymentMethodId, 
    billingAddress}


Orders schema:
customers -- orders -- product ---which brands, influencer,  

customer_id, 

items: product_id, {array of objects:
quantity, 
price_at_purchase,
brand_id, 
influencer_id
}

total amount
shipping cost


status_history{
    we'll fetch the last entry, 
    [status {pending, paid, shipped, delivered, cancelled }, 
    timestamp, 
    tracking_number, 
    shipping_address{address_line1}
    shipping_cost
    , 
    ]
}

4) Campaign payments schema:
{
 Entry | Status | Notes |
|-------|--------|-------|
| campaign_id | Existing | Required, ref: CampaignInfo |
| brand_id | Existing | Required, ref: BrandInfo |
| influencer_id | Existing | Required, ref: InfluencerInfo |
| amount | Existing | Required |
| status | Existing | Enum: pending, processing, completed, failed |
| payment_date | Existing | Required |
| split_percentage | NEW | For influencer split choice (60/40, 70/30, 50/50) |
|type: {bonus, firsthalf, secondhalf, fullpayment} 
paymentProvider, paymentMethodId, providerPaymentId, 
}


5)Admin schemas:
User schema:
{_id, name, password, role, isActive,lastLogin,createdAt, updatedAt}
Admin Action log:
{_id, admin_id, action, timestamp, targetId, targetType, reason, metadata, status, ip_address,createdAt}

6)Subscription schemas:
Subscription Plans:
{_id, name, version, billingCycle, price, userType, features, limits,createdAt, isActive}

User Subscription:
{_id, user_id, userType,subscription_id, status, billingCycle, autoRenew,providerSubscriptionId,currentPeriodStart,currentPeriodEnd, cancelAtPeriodEnd, start_date, end_date, createdAt, updatedAt}

Subscription Payment:
{_id, user_id, userType, plan_id, amount, status,
paymentProvider, paymentMethodId, providerPaymentId, payment_date, createdAt, updatedAt}

7)Notification schema:
{_id, receipientId, receipientType, message, type,link_to, action{type, url, modalType}, expiresAt, isRead, createdAt, updatedAt}

8)Feedback schema:
{_id, createdById, createdByType, subject, feedbackType,  messages: [
    {
      senderId,
      senderType,       // user or admin
      message,
      attachments: [String],
      createdAt
    }
  ], priority, status, createdAt, updatedAt}