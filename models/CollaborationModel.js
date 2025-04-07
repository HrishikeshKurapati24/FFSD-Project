const db = require("../config/database");
const dbPromise = require('./db');

class CollaborationModel {
    static async getAllCollaborations() {
        try {
            return db.collaborations || [];
        } catch (error) {
            console.error('Error in getAllCollaborations:', error);
            return [];
        }
    }

    static async getCollaborationById(id) {
        try {
            return db.collaborations.find(collab => collab.id === parseInt(id));
        } catch (error) {
            console.error('Error in getCollaborationById:', error);
            return null;
        }
    }
}

// Get active collaborations count
const getActiveCollaborationsCount = async (influencerId) => {
    try {
        const db = await dbPromise;
        const result = await db.get(
            `SELECT COUNT(*) as count 
             FROM collaborations 
             WHERE influencer_id = ? AND status = 'active'`,
            [influencerId]
        );
        return result.count;
    } catch (error) {
        console.error('Error getting active collaborations count:', error);
        throw error;
    }
};

// Get completion percentage
const getCompletionPercentage = async (influencerId) => {
    try {
        const db = await dbPromise;
        const result = await db.get(
            `SELECT AVG(progress) as percentage 
             FROM collaborations 
             WHERE influencer_id = ? AND status = 'active'`,
            [influencerId]
        );
        return Math.round(result.percentage || 0);
    } catch (error) {
        console.error('Error getting completion percentage:', error);
        throw error;
    }
};

// Get nearing completion count
const getNearingCompletionCount = async (influencerId) => {
    try {
        const db = await dbPromise;
        const result = await db.get(
            `SELECT COUNT(*) as count 
             FROM collaborations 
             WHERE influencer_id = ? AND status = 'active' AND progress >= 75`,
            [influencerId]
        );
        return result.count;
    } catch (error) {
        console.error('Error getting nearing completion count:', error);
        throw error;
    }
};

// Get pending requests count
const getPendingRequestsCount = async (influencerId) => {
    try {
        const db = await dbPromise;
        const result = await db.get(
            `SELECT COUNT(*) as count 
             FROM collaboration_requests 
             WHERE influencer_id = ? AND status = 'pending'`,
            [influencerId]
        );
        return result.count;
    } catch (error) {
        console.error('Error getting pending requests count:', error);
        throw error;
    }
};

// Get monthly earnings
const getMonthlyEarnings = async (influencerId) => {
    try {
        const db = await dbPromise;
        const result = await db.get(
            `SELECT SUM(amount) as total 
             FROM payments 
             WHERE influencer_id = ? 
             AND strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now')`,
            [influencerId]
        );
        return result.total || 0;
    } catch (error) {
        console.error('Error getting monthly earnings:', error);
        throw error;
    }
};

// Get earnings change from last month
const getEarningsChange = async (influencerId) => {
    try {
        const db = await dbPromise;
        const currentMonth = await db.get(
            `SELECT SUM(amount) as total 
             FROM payments 
             WHERE influencer_id = ? 
             AND strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now')`,
            [influencerId]
        );

        const lastMonth = await db.get(
            `SELECT SUM(amount) as total 
             FROM payments 
             WHERE influencer_id = ? 
             AND strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now', '-1 month')`,
            [influencerId]
        );

        const current = currentMonth.total || 0;
        const last = lastMonth.total || 0;

        if (last === 0) return 100; // If no earnings last month, return 100% increase
        return Math.round(((current - last) / last) * 100);
    } catch (error) {
        console.error('Error getting earnings change:', error);
        throw error;
    }
};

// Get upcoming deadlines
const getUpcomingDeadlines = async (influencerId) => {
    try {
        const db = await dbPromise;
        const deadlines = await db.all(
            `SELECT c.id, c.campaign_name, c.deadline, c.progress
             FROM collaborations c
             WHERE c.influencer_id = ? 
             AND c.status = 'active'
             AND c.deadline > datetime('now')
             ORDER BY c.deadline ASC
             LIMIT 5`,
            [influencerId]
        );

        return deadlines.map(deadline => ({
            _id: deadline.id,
            campaignName: deadline.campaign_name,
            daysRemaining: Math.ceil((new Date(deadline.deadline) - new Date()) / (1000 * 60 * 60 * 24)),
            progress: deadline.progress
        }));
    } catch (error) {
        console.error('Error getting upcoming deadlines:', error);
        throw error;
    }
};

// Get performance metrics
const getPerformanceMetrics = async (influencerId) => {
    try {
        const db = await dbPromise;
        const metrics = await db.get(
            `SELECT 
                AVG(engagement_rate) as engagement,
                AVG(reach) as reach,
                AVG(conversion_rate) as conversions,
                AVG(content_quality_score) as content_quality,
                AVG(timeliness_score) as timeliness
             FROM collaboration_metrics
             WHERE influencer_id = ?`,
            [influencerId]
        );

        return [
            Math.round(metrics.engagement || 0),
            Math.round(metrics.reach || 0),
            Math.round(metrics.conversions || 0),
            Math.round(metrics.content_quality || 0),
            Math.round(metrics.timeliness || 0)
        ];
    } catch (error) {
        console.error('Error getting performance metrics:', error);
        throw error;
    }
};

// Get earnings by source
const getEarningsBySource = async (influencerId) => {
    try {
        const db = await dbPromise;
        const sources = await db.all(
            `SELECT 
                source,
                SUM(amount) as total
             FROM payments
             WHERE influencer_id = ?
             GROUP BY source`,
            [influencerId]
        );

        return {
            labels: sources.map(s => s.source),
            data: sources.map(s => s.total)
        };
    } catch (error) {
        console.error('Error getting earnings by source:', error);
        throw error;
    }
};

module.exports = {
    getActiveCollaborationsCount,
    getCompletionPercentage,
    getNearingCompletionCount,
    getPendingRequestsCount,
    getMonthlyEarnings,
    getEarningsChange,
    getUpcomingDeadlines,
    getPerformanceMetrics,
    getEarningsBySource
};