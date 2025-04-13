const { db2 } = require('./db2');
const db1 = require("../config/database");

class CollaborationModel {
    static async getAllCollaborations() {
        try {
            return db1.collaborations || [];
        } catch (error) {
            console.error('Error in getAllCollaborations:', error);
            return [];
        }
    }

    static async getCollaborationById(id) {
        try {
            return db1.collaborations.find(collab => collab.id === parseInt(id));
        } catch (error) {
            console.error('Error in getCollaborationById:', error);
            return null;
        }
    }

    static async getActiveCollaborationsCount(influencerId) {
        try {
            return new Promise((resolve, reject) => {
                db2.get(
                    `SELECT COUNT(*) as count FROM collaborations 
                    WHERE influencer_id = ? AND status = 'active'`,
                    [influencerId],
                    (err, row) => {
                        if (err) {
                            console.error('Error getting active collaborations count:', err);
                            reject(err);
                        } else {
                            resolve(row.count);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error in getActiveCollaborationsCount:', error);
            throw error;
        }
    }

    static async getCompletionPercentage(influencerId) {
        try {
            return new Promise((resolve, reject) => {
                db2.get(
                    `SELECT AVG(progress) as avg_progress FROM collaborations 
                    WHERE influencer_id = ? AND status = 'active'`,
                    [influencerId],
                    (err, row) => {
                        if (err) {
                            console.error('Error getting completion percentage:', err);
                            reject(err);
                        } else {
                            resolve(row.avg_progress || 0);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error in getCompletionPercentage:', error);
            throw error;
        }
    }

    static async getNearingCompletionCount(influencerId) {
        try {
            return new Promise((resolve, reject) => {
                db2.get(
                    `SELECT COUNT(*) as count FROM collaborations 
                    WHERE influencer_id = ? AND status = 'active' AND progress >= 75`,
                    [influencerId],
                    (err, row) => {
                        if (err) {
                            console.error('Error getting nearing completion count:', err);
                            reject(err);
                        } else {
                            resolve(row.count);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error in getNearingCompletionCount:', error);
            throw error;
        }
    }

    static async getPendingRequestsCount(influencerId) {
        try {
            return new Promise((resolve, reject) => {
                db2.get(
                    `SELECT COUNT(*) as count FROM collaboration_requests 
                    WHERE influencer_id = ? AND status = 'pending'`,
                    [influencerId],
                    (err, row) => {
                        if (err) {
                            console.error('Error getting pending requests count:', err);
                            reject(err);
                        } else {
                            resolve(row.count);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error in getPendingRequestsCount:', error);
            throw error;
        }
    }

    static async getMonthlyEarnings(influencerId) {
        try {
            return new Promise((resolve, reject) => {
                db2.get(
                    `SELECT SUM(p.amount) as total_earnings 
                    FROM payments p
                    JOIN collaborations c ON p.collaboration_id = c.id
                    WHERE c.influencer_id = ? 
                    AND p.status = 'completed'
                    AND strftime('%Y-%m', p.payment_date) = strftime('%Y-%m', 'now')`,
                    [influencerId],
                    (err, row) => {
                        if (err) {
                            console.error('Error getting monthly earnings:', err);
                            reject(err);
                        } else {
                            resolve(row.total_earnings || 0);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error in getMonthlyEarnings:', error);
            throw error;
        }
    }

    static async getEarningsChange(influencerId) {
        try {
            return new Promise((resolve, reject) => {
                db2.get(
                    `SELECT 
                        (SELECT SUM(amount) FROM payments p
                         JOIN collaborations c ON p.collaboration_id = c.id
                         WHERE c.influencer_id = ? 
                         AND p.status = 'completed'
                         AND strftime('%Y-%m', p.payment_date) = strftime('%Y-%m', 'now')) as current_month,
                        (SELECT SUM(amount) FROM payments p
                         JOIN collaborations c ON p.collaboration_id = c.id
                         WHERE c.influencer_id = ? 
                         AND p.status = 'completed'
                         AND strftime('%Y-%m', p.payment_date) = strftime('%Y-%m', date('now', '-1 month'))) as previous_month`,
                    [influencerId, influencerId],
                    (err, row) => {
                        if (err) {
                            console.error('Error getting earnings change:', err);
                            reject(err);
                        } else {
                            const current = row.current_month || 0;
                            const previous = row.previous_month || 0;
                            const change = previous === 0 ? 100 : ((current - previous) / previous) * 100;
                            resolve(change);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error in getEarningsChange:', error);
            throw error;
        }
    }

    static async getUpcomingDeadlines(influencerId) {
        try {
            return new Promise((resolve, reject) => {
                db2.all(
                    `SELECT c.id, c.title, c.deadline, b.name as brand_name, b.logo_url as brand_logo
                    FROM collaborations c
                    JOIN brands b ON c.brand_id = b.id
                    WHERE c.influencer_id = ? 
                    AND c.status = 'active'
                    AND c.deadline > datetime('now')
                    ORDER BY c.deadline ASC
                    LIMIT 5`,
                    [influencerId],
                    (err, rows) => {
                        if (err) {
                            console.error('Error getting upcoming deadlines:', err);
                            reject(err);
                        } else {
                            resolve(rows);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error in getUpcomingDeadlines:', error);
            throw error;
        }
    }

    static async getPerformanceMetrics(influencerId) {
        try {
            return new Promise((resolve, reject) => {
                db2.get(
                    `SELECT 
                        AVG(cm.engagement_rate) as avg_engagement_rate,
                        AVG(cm.reach) as avg_reach,
                        AVG(cm.clicks) as avg_conversion_rate,
                        AVG(cm.timeliness_score) as avg_timeliness
                    FROM collaboration_metrics cm
                    JOIN collaborations c ON cm.collaboration_id = c.id
                    WHERE c.influencer_id = ?`,
                    [influencerId],
                    (err, row) => {
                        if (err) {
                            console.error('Error getting performance metrics:', err);
                            reject(err);
                        } else {
                            resolve({
                                engagementRate: row.avg_engagement_rate || 0,
                                reach: row.avg_reach || 0,
                                conversionRate: row.avg_conversion_rate || 0,
                                contentQuality: row.avg_content_quality || 0,
                                timeliness: row.avg_timeliness || 0
                            });
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error in getPerformanceMetrics:', error);
            throw error;
        }
    }

    static async getEarningsBySource(influencerId) {
        try {
            return new Promise((resolve, reject) => {
                db2.all(
                    `SELECT 
                        b.name as brand_name,
                        SUM(p.amount) as total_earnings
                    FROM payments p
                    JOIN collaborations c ON p.collaboration_id = c.id
                    JOIN brands b ON c.brand_id = b.id
                    WHERE c.influencer_id = ? 
                    AND p.status = 'completed'
                    GROUP BY b.name
                    ORDER BY total_earnings DESC`,
                    [influencerId],
                    (err, rows) => {
                        if (err) {
                            console.error('Error getting earnings by source:', err);
                            reject(err);
                        } else {
                            resolve(rows);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Error in getEarningsBySource:', error);
            throw error;
        }
    }

    // Get collaboration requests for an influencer
    async getCollaborationRequests(influencerId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    cr.id,
                    cr.collab_title,
                    cr.status,
                    cr.created_at,
                    b.name as brand_name,
                    b.logo_url as brand_logo,
                    c.budget,
                    c.duration,
                    c.required_channels,
                    c.min_followers,
                    c.target_audience
                FROM collaboration_requests cr
                JOIN brands b ON cr.brand_id = b.id
                JOIN campaigns c ON cr.campaign_id = c.id
                WHERE cr.influencer_id = ? AND cr.status = 'pending'
                ORDER BY cr.created_at DESC
            `;

            db2.all(query, [influencerId], (err, rows) => {
                if (err) {
                    console.error('Error fetching collaboration requests:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Accept a collaboration request
    async acceptRequest(requestId) {
        return new Promise((resolve, reject) => {
            db2.run('BEGIN TRANSACTION');

            // Update request status
            db2.run(
                'UPDATE collaboration_requests SET status = "accepted" WHERE id = ?',
                [requestId],
                function (err) {
                    if (err) {
                        db2.run('ROLLBACK');
                        reject(err);
                        return;
                    }

                    // Get request details
                    db2.get(
                        'SELECT * FROM collaboration_requests WHERE id = ?',
                        [requestId],
                        (err, request) => {
                            if (err) {
                                db2.run('ROLLBACK');
                                reject(err);
                                return;
                            }

                            // Create new collaboration
                            db2.run(
                                `INSERT INTO collaborations (
                                    title, brand_id, influencer_id, campaign_id, status
                                ) VALUES (?, ?, ?, ?, 'active')`,
                                [
                                    request.collab_title,
                                    request.brand_id,
                                    request.influencer_id,
                                    request.campaign_id
                                ],
                                function (err) {
                                    if (err) {
                                        db2.run('ROLLBACK');
                                        reject(err);
                                        return;
                                    }

                                    db2.run('COMMIT');
                                    resolve({ success: true, collaborationId: this.lastID });
                                }
                            );
                        }
                    );
                }
            );
        });
    }

    // Decline a collaboration request
    async declineRequest(requestId) {
        return new Promise((resolve, reject) => {
            db2.run(
                'UPDATE collaboration_requests SET status = "declined" WHERE id = ?',
                [requestId],
                function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ success: true });
                    }
                }
            );
        });
    }
}

module.exports = CollaborationModel;