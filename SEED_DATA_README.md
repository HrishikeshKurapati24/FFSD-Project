# Seed Data Documentation

## Overview
This project includes comprehensive seed data for testing the influencer marketing platform. The seed data includes realistic brands, influencers, and campaign information with complete social media analytics and performance metrics.

## Database Collections Populated

### Brands (10 total)
- **Original Brands (5)**: Mamaearth, Boat, Nykaa, Lenskart, Zomato
- **Extended Brands (5)**: Swiggy, Myntra, Netflix India, Urban Company, CRED

### Influencers (10 total)
- **Original Influencers (5)**: Kusha Kapila, Dolly Singh, Masoom Minawala, Ranveer Allahbadia, Prajakta Koli
- **Extended Influencers (5)**: Mithila Palkar, Aashna Shroff, Ashish Chanchlani, Diipa Khosla, Rohan Joshi

### Campaigns
- 5 active and request campaigns with realistic metrics
- Complete payment and influencer collaboration data

## User Credentials

### Brand Accounts
**Password for all brands: `Brand@123`**

| # | Brand Name | Email | Industry |
|---|------------|-------|----------|
| 1 | Mamaearth | mamaearth@example.com | Beauty & Personal Care |
| 2 | Boat | boat@example.com | Electronics |
| 3 | Nykaa | nykaa@example.com | E-commerce |
| 4 | Lenskart | lenskart@example.com | Eyewear |
| 5 | Zomato | zomato@example.com | Food Delivery |
| 6 | Swiggy | swiggy@example.com | Food Delivery |
| 7 | Myntra | myntra@example.com | E-commerce |
| 8 | Netflix India | netflix@example.com | Entertainment |
| 9 | Urban Company | urbancompany@example.com | Home Services |
| 10 | CRED | cred@example.com | Fintech |

### Influencer Accounts
**Password for all influencers: `Influencer@123`**

| # | Influencer Name | Email | Niche |
|---|-----------------|-------|-------|
| 1 | Kusha Kapila | kusha@example.com | Lifestyle & Comedy |
| 2 | Dolly Singh | dolly@example.com | Comedy & Entertainment |
| 3 | Masoom Minawala | masoom@example.com | Fashion & Lifestyle |
| 4 | Ranveer Allahbadia | ranveer@example.com | Fitness & Motivation |
| 5 | Prajakta Koli | prajakta@example.com | Comedy & Entertainment |
| 6 | Mithila Palkar | mithila@example.com | Entertainment & Acting |
| 7 | Aashna Shroff | aashna@example.com | Fashion & Lifestyle |
| 8 | Ashish Chanchlani | ashish@example.com | Comedy & Entertainment |
| 9 | Diipa Khosla | diipa@example.com | Fashion & Beauty |
| 10 | Rohan Joshi | rohan@example.com | Comedy & Writing |

## How to Initialize Seed Data

### Option 1: Initialize All Data (Recommended)
```bash
node initAllSeedData.js
```

### Option 2: Initialize Individual Collections
```bash
# Original brand data (5 brands)
node initBrandData.js

# Original influencer data (5 influencers)
node initInfluencerData.js

# Extended brand data (5 additional brands)
node initExtendedBrandData.js

# Extended influencer data (5 additional influencers)
node initExtendedInfluencerData.js

# Campaign data (requires brands and influencers to exist first)
node initCampaignData.js
```

## Data Structure Details

### Brand Data Includes:
- **BrandInfo**: Basic information, contact details, company info
- **BrandSocials**: Social media platforms with follower counts and engagement metrics
- **BrandAnalytics**: Performance analytics, audience demographics, campaign metrics

### Influencer Data Includes:
- **InfluencerInfo**: Personal information, niche, bio, contact details
- **InfluencerSocials**: Social media platforms with detailed metrics
- **InfluencerAnalytics**: Performance analytics, earnings, audience demographics

### Campaign Data Includes:
- **CampaignInfo**: Campaign details, objectives, budget, timeline
- **CampaignMetrics**: Performance tracking and analytics
- **CampaignPayments**: Payment records and status
- **CampaignInfluencers**: Influencer participation and deliverables

## Features of the Seed Data

### Realistic Metrics
- Authentic follower counts ranging from 1M to 7M
- Realistic engagement rates (3.8% - 4.9%)
- Diverse audience demographics
- Varied campaign budgets and performance metrics

### Complete Social Media Profiles
- Instagram, YouTube, TikTok, Facebook, Twitter, LinkedIn data
- Platform-specific engagement metrics
- Recent performance statistics
- Category-based content classification

### Comprehensive Analytics
- Monthly performance trends
- Audience demographics (age, gender, location)
- Conversion rates and ROI metrics
- Historical campaign performance

### Industry Diversity
- **Brands**: Beauty, Electronics, E-commerce, Food Delivery, Entertainment, Fintech
- **Influencers**: Comedy, Fashion, Fitness, Lifestyle, Entertainment, Acting

## Testing Scenarios

With this seed data, you can test:

1. **Brand Dashboard**: View analytics, manage campaigns, track performance
2. **Influencer Dashboard**: Monitor earnings, view collaborations, manage content
3. **Campaign Management**: Create, manage, and track campaign performance
4. **Payment Processing**: View payment history and transaction status
5. **Analytics & Reporting**: Comprehensive performance metrics and insights
6. **User Management**: Profile management, social media integration
7. **Search & Discovery**: Find brands/influencers based on various criteria

## Notes

- All passwords are hashed using bcrypt
- Email addresses are unique across all users
- Social media handles and URLs are realistic but not functional
- All dates are set to future dates for active campaigns
- Performance metrics are realistic industry averages
- The data includes both active and request status campaigns for comprehensive testing

## Troubleshooting

If you encounter issues during initialization:

1. Ensure MongoDB is running
2. Check database connection configuration
3. Verify all required dependencies are installed
4. Run individual initialization scripts to identify specific issues
5. Check console logs for detailed error messages

## Support

For questions or issues with the seed data, please refer to the individual initialization files or check the database connection configuration in `config/database.js`.
