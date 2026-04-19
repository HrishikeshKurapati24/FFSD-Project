'use strict';

/**
 * Stateless saturation-curve simulation engine.
 * views(t) ~= A * (1 - e^(-k*t))
 */
class SaturationSimulationEngine {
  static round(num) {
    return Math.round((Number(num) || 0) * 1000) / 1000;
  }

  static clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }

  static getPlatformFactor(platform) {
    const p = String(platform || '').toLowerCase();
    if (p.includes('reel') || p.includes('tiktok')) return 1.18;
    if (p.includes('youtube') || p.includes('video')) return 1.08;
    if (p.includes('story')) return 0.78;
    return 1.0;
  }

  static simulate(input = {}) {
    const followers = Number(input.followers || 0);
    const engagementRate = Number(input.engagementRate || 0); // %
    const hoursSincePublish = Math.max(0, Number(input.hoursSincePublish || 0));
    const basePotentialFactor = Number(input.basePotentialFactor || 0.65);
    const platformFactor = Number(input.platformFactor || 1);

    // A: reach ceiling influenced by audience size + campaign/platform quality
    const A = followers * this.clamp(basePotentialFactor * platformFactor, 0.2, 2.25);

    // k: growth speed; higher engagement = quicker early growth
    const kBase = 0.06;
    const kEngagementBoost = this.clamp(engagementRate / 100, 0, 0.4);
    const k = this.clamp(kBase + kEngagementBoost, 0.03, 0.28);

    const impressions = A * (1 - Math.exp(-k * hoursSincePublish));
    const reach = impressions * 0.72;

    const normalizedEngagement = this.clamp(engagementRate / 100, 0.01, 0.2);
    const likes = impressions * (normalizedEngagement * 0.82);
    const comments = impressions * (normalizedEngagement * 0.11);
    const clicks = impressions * this.clamp(normalizedEngagement * 0.35, 0.006, 0.08);
    const conversions = clicks * this.clamp(normalizedEngagement * 0.2, 0.01, 0.06);
    const computedEngagementRate = impressions > 0 ? ((likes + comments) / impressions) * 100 : 0;

    return {
      saturationA: this.round(A),
      growthK: this.round(k),
      impressions: this.round(impressions),
      reach: this.round(reach),
      likes: this.round(likes),
      comments: this.round(comments),
      clicks: this.round(clicks),
      conversions: this.round(conversions),
      engagementRate: this.round(computedEngagementRate),
    };
  }
}

module.exports = SaturationSimulationEngine;

