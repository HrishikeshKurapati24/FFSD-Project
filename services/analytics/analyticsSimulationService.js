'use strict';

const { CampaignInfo, CampaignInfluencers, CampaignMetrics } = require('../../models/CampaignMongo');
const { InfluencerAnalytics } = require('../../models/InfluencerMongo');
const SaturationSimulationEngine = require('./saturationSimulationEngine');
const HeartbeatService = require('./analyticsHeartbeatService');

function hoursSince(dateLike, now = new Date()) {
  const ts = dateLike ? new Date(dateLike).getTime() : now.getTime();
  const diffMs = Math.max(0, now.getTime() - ts);
  return diffMs / (1000 * 60 * 60);
}

function safeDate(...candidates) {
  for (const c of candidates) {
    if (!c) continue;
    const d = new Date(c);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

class AnalyticsSimulationService {
  /**
   * @param {string} [trigger='manual'] - Label describing what triggered this run.
   */
  static async runSimulationCycle(trigger = 'manual') {
    const now = new Date();
    const campaigns = await CampaignInfo.find({ status: 'active' })
      .select('_id brand_id start_date end_date min_followers required_channels budget metrics')
      .lean();

    if (!campaigns.length) {
      return { campaignsProcessed: 0, collabsProcessed: 0, postsProcessed: 0 };
    }

    const campaignMap = new Map(campaigns.map(c => [String(c._id), c]));
    const campaignIds = campaigns.map(c => c._id);

    const collabs = await CampaignInfluencers.find({
      campaign_id: { $in: campaignIds },
      status: { $in: ['active', 'completed'] },
    })
      .select('_id campaign_id influencer_id deliverables progress engagement_rate reach impressions likes comments clicks conversions')
      .lean();

    if (!collabs.length) {
      return { campaignsProcessed: campaigns.length, collabsProcessed: 0, postsProcessed: 0 };
    }

    const influencerIds = [...new Set(collabs.map(c => String(c.influencer_id)).filter(Boolean))];
    const analyticsRows = await InfluencerAnalytics.find({ influencerId: { $in: influencerIds } })
      .select('influencerId totalFollowers avgEngagementRate')
      .lean();
    const analyticsMap = new Map(analyticsRows.map(a => [String(a.influencerId), a]));

    const collabBulkOps = [];
    let postsProcessed = 0;

    for (const collab of collabs) {
      const campaign = campaignMap.get(String(collab.campaign_id));
      if (!campaign) continue;

      const influencerAnalytics = analyticsMap.get(String(collab.influencer_id)) || {};
      const followers = Number(influencerAnalytics.totalFollowers || 0);
      const engagementRate = Number(influencerAnalytics.avgEngagementRate || 3.5);
      const campaignPotentialFactor = Math.max(
        0.45,
        Math.min(1.8, (Number(campaign.min_followers || 1000) / Math.max(followers || 1, 1000)) * 0.9)
      );

      const deliverables = Array.isArray(collab.deliverables) ? collab.deliverables : [];
      const publishedDeliverables = deliverables.filter(d => d && d.status === 'published');
      const posts = publishedDeliverables.length ? publishedDeliverables : [{ platform: campaign.required_channels?.[0] || 'instagram', createdAt: campaign.start_date || collab.createdAt }];

      let totals = {
        impressions: 0,
        reach: 0,
        likes: 0,
        comments: 0,
        clicks: 0,
        conversions: 0,
      };

      for (const post of posts) {
        const publishAt = safeDate(
          post.published_at,
          post.completed_at,
          post.submitted_at,
          post.reviewed_at,
          post.createdAt,
          campaign.start_date
        ) || now;

        const hs = hoursSince(publishAt, now);
        console.log(`[Simulation] Post Platform: ${post.platform}, Hours Since: ${hs}`);
        
        const sim = SaturationSimulationEngine.simulate({
          followers,
          engagementRate,
          hoursSincePublish: hs,
          basePotentialFactor: campaignPotentialFactor,
          platformFactor: SaturationSimulationEngine.getPlatformFactor(post.platform || post.deliverable_type),
        });

        totals.impressions += sim.impressions;
        totals.reach += sim.reach;
        totals.likes += sim.likes;
        totals.comments += sim.comments;
        totals.clicks += sim.clicks;
        totals.conversions += sim.conversions;
        postsProcessed += 1;
      }

      const engagement = totals.impressions > 0 ? ((totals.likes + totals.comments) / totals.impressions) * 100 : 0;
      const progress = Math.min(100, Math.max(Number(collab.progress || 0), posts.length * 20));

      collabBulkOps.push({
        updateOne: {
          filter: { _id: collab._id },
          update: {
            $set: {
              impressions: SaturationSimulationEngine.round(totals.impressions),
              reach: SaturationSimulationEngine.round(totals.reach),
              likes: SaturationSimulationEngine.round(totals.likes),
              comments: SaturationSimulationEngine.round(totals.comments),
              clicks: SaturationSimulationEngine.round(totals.clicks),
              conversions: SaturationSimulationEngine.round(totals.conversions),
              engagement_rate: SaturationSimulationEngine.round(engagement),
              progress: SaturationSimulationEngine.round(progress),
              simulated_post_count: posts.length,
              last_simulated_at: now,
            },
          },
        },
      });
    }

    if (collabBulkOps.length) {
      await CampaignInfluencers.bulkWrite(collabBulkOps, { ordered: false });
    }

    // Aggregate per campaign after per-collab updates so totals remain idempotent.
    for (const campaign of campaigns) {
      const rows = await CampaignInfluencers.find({
        campaign_id: campaign._id,
        status: { $in: ['active', 'completed'] },
      })
        .select('impressions reach likes comments clicks conversions engagement_rate progress')
        .lean();

      const agg = rows.reduce((acc, row) => {
        acc.impressions += Number(row.impressions || 0);
        acc.reach += Number(row.reach || 0);
        acc.likes += Number(row.likes || 0);
        acc.comments += Number(row.comments || 0);
        acc.clicks += Number(row.clicks || 0);
        acc.conversions += Number(row.conversions || 0);
        acc.progress += Number(row.progress || 0);
        return acc;
      }, {
        impressions: 0,
        reach: 0,
        likes: 0,
        comments: 0,
        clicks: 0,
        conversions: 0,
        progress: 0,
      });

      const engagementRate = agg.impressions > 0 ? ((agg.likes + agg.comments) / agg.impressions) * 100 : 0;
      const conversionRate = agg.clicks > 0 ? (agg.conversions / agg.clicks) * 100 : 0;
      const avgProgress = rows.length ? agg.progress / rows.length : 0;
      const performanceScore = Math.min(100, (engagementRate * 6) + (conversionRate * 2) + (avgProgress * 0.4));

      await CampaignMetrics.findOneAndUpdate(
        { campaign_id: campaign._id },
        {
          $set: {
            brand_id: campaign.brand_id,
            impressions: SaturationSimulationEngine.round(agg.impressions),
            reach: SaturationSimulationEngine.round(agg.reach),
            likes: SaturationSimulationEngine.round(agg.likes),
            comments: SaturationSimulationEngine.round(agg.comments),
            clicks: SaturationSimulationEngine.round(agg.clicks),
            conversion_rate: SaturationSimulationEngine.round(conversionRate),
            engagement_rate: SaturationSimulationEngine.round(engagementRate),
            overall_progress: SaturationSimulationEngine.round(avgProgress),
            performance_score: SaturationSimulationEngine.round(performanceScore),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await CampaignInfo.updateOne(
        { _id: campaign._id },
        {
          $set: {
            'metrics.impressions': SaturationSimulationEngine.round(agg.impressions),
            'metrics.reach': SaturationSimulationEngine.round(agg.reach),
            'metrics.likes': SaturationSimulationEngine.round(agg.likes),
            'metrics.comments': SaturationSimulationEngine.round(agg.comments),
            'metrics.clicks': SaturationSimulationEngine.round(agg.clicks),
            'metrics.conversions': SaturationSimulationEngine.round(agg.conversions),
            'metrics.engagement_rate': SaturationSimulationEngine.round(engagementRate),
            'metrics.overall_progress': SaturationSimulationEngine.round(avgProgress),
            'metrics.performance_score': SaturationSimulationEngine.round(performanceScore),
            'metrics.simulated_at': now,
          },
        }
      );
    }

    const result = {
      campaignsProcessed: campaigns.length,
      collabsProcessed: collabBulkOps.length,
      postsProcessed,
      simulatedAt: now.toISOString(),
    };

    // Persist heartbeat so startup staleness check knows when we last ran.
    await HeartbeatService.recordRun(trigger, result);

    return result;
  }
}

module.exports = AnalyticsSimulationService;

