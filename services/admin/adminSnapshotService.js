const { InfluencerInfo, InfluencerAnalytics } = require('../../models/InfluencerMongo');
const { AnalyticsSnapshot } = require('../../models/AnalyticsSnapshot');

class AdminSnapshotService {
    /**
     * Captures a snapshot of all influencers currently tracked.
     * In a production environment, this would be called by a cron job.
     */
    static async takeSnapshots() {
        console.log('📸 Starting Analytics Snapshot process...');
        
        // High-Performance Embedding: Fetch everything including analytics snapshot
        const influencers = await InfluencerInfo.find({}).lean();
        const snapshots = [];

        for (const info of influencers) {
            const analytics = info.analytics_snapshot;
            
            if (analytics) {
                snapshots.push({
                    influencerId: info._id,
                    timestamp: new Date(),
                    metrics: {
                        totalFollowers: analytics.totalFollowers || 0,
                        avgEngagementRate: analytics.avgEngagementRate || 0,
                        totalReach: analytics.performanceMetrics?.reach || 0,
                        totalImpressions: analytics.performanceMetrics?.impressions || 0
                    }
                });
            }
        }

        if (snapshots.length > 0) {
            await AnalyticsSnapshot.insertMany(snapshots);
            console.log(`✅ Snapshot complete. Captured ${snapshots.length} influencer states.`);
        } else {
            console.log('⚠️ No analytics data found to snapshot.');
        }

        return snapshots;
    }

    /**
     * Generates dummy historical data for existing influencers
     * This is useful for testing the trend charts immediately after migration.
     */
    static async seedHistoricalSnapshots() {
        console.log('🌱 Seeding historical snapshots...');
        
        // High-Performance Embedding: Fetch everything including analytics snapshot
        const influencers = await InfluencerInfo.find({}).limit(50).lean(); 
        const historicalSnapshots = [];
        
        // Create 6 monthly snapshots for each influencer to demonstrate trends
        for (const info of influencers) {
            const analytics = info.analytics_snapshot;
            const baseFollowers = analytics?.totalFollowers || (Math.floor(Math.random() * 5000) + 1000);
            
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                date.setDate(1);

                const growthFactor = 1 - (i * 0.05); // 5% growth per month back in time
                historicalSnapshots.push({
                    influencerId: info._id,
                    timestamp: date,
                    metrics: {
                        totalFollowers: Math.round(baseFollowers * growthFactor),
                        avgEngagementRate: (Math.random() * 2) + 3,
                        totalReach: Math.round(baseFollowers * 0.4),
                        totalImpressions: Math.round(baseFollowers * 1.2)
                    }
                });
            }
        }

        if (historicalSnapshots.length > 0) {
            await AnalyticsSnapshot.insertMany(historicalSnapshots);
            console.log(`✅ Historical seeding complete. Added ${historicalSnapshots.length} records.`);
        }
    }
}

module.exports = AdminSnapshotService;
