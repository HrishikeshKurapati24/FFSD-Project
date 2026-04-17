const { mongoose } = require('../mongoDB');

const analyticsSnapshotSchema = new mongoose.Schema({
    influencerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InfluencerInfo',
        required: true,
        index: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    metrics: {
        totalFollowers: Number,
        avgEngagementRate: Number,
        totalReach: Number,
        totalImpressions: Number
    },
    platformStats: [{
        platform: String,
        followers: Number,
        engagement: Number
    }]
}, {
    timestamps: true
});

// Index for efficient historical trend lookups (influencer + time)
analyticsSnapshotSchema.index({ influencerId: 1, timestamp: -1 });

const AnalyticsSnapshot = mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema);

module.exports = { AnalyticsSnapshot };
