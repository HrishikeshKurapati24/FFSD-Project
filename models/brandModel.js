// model/brandModel.js
const { db: db1 } = require('./db1');
const db2 = require('./db2').db2;

class brandModel {
  // Get recommended brands for an influencer
  static getRecommendedBrands = async (influencerId) => {
    try {
      // First get influencer's categories
      const influencer = await new Promise((resolve, reject) => {
        db1.get(
          `SELECT categories FROM influencers WHERE id = ?`,
          [influencerId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!influencer || !influencer.categories) {
        return [];
      }

      const categories = JSON.parse(influencer.categories);

      // Get brands that match influencer's categories and have active campaigns
      const brands = await new Promise((resolve, reject) => {
        db1.all(
          `SELECT b.id, b.name, b.industry, b.logo_url as logo
           FROM brands b
           JOIN brand_categories bc ON b.id = bc.brand_id
           WHERE bc.category IN (${categories.map(() => '?').join(',')})
           AND b.status = 'active'
           GROUP BY b.id
           ORDER BY b.rating DESC
           LIMIT 5`,
          categories,
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      return brands.map(brand => ({
        _id: brand.id,
        name: brand.name,
        industry: brand.industry,
        logo: brand.logo
      }));
    } catch (error) {
      console.error('Error getting recommended brands:', error);
      throw error;
    }
  };

  // Get all brands
  static getAllBrands = (callback) => {
    db1.all('SELECT * FROM brands', (err, rows) => {
      if (err) {
        console.error('Error fetching brands:', err.message);
        callback(err, null);
      } else {
        console.log('Fetched brands from database:', rows);
        callback(null, rows || []);
      }
    });
  };

  // Get brand by ID
  static async getBrandById(id) {
    return new Promise((resolve, reject) => {
      db2.get('SELECT * FROM brands WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Update brand profile
  static updateBrandProfile(brandId, updateData) {
    return new Promise((resolve, reject) => {
      // Escape the 'values' column name since it's a reserved keyword
      const fields = Object.keys(updateData).map(field =>
        field === 'values' ? '"values"' : field
      );
      const values = Object.values(updateData);
      const placeholders = fields.map(field => `${field} = ?`).join(', ');

      db2.run(
        `UPDATE brands SET ${placeholders} WHERE id = ?`,
        [...values, brandId],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  // Get social stats for a brand
  static getSocialStats(brandId) {
    return new Promise((resolve, reject) => {
      db2.all(
        `SELECT * FROM brand_social_stats WHERE brand_id = ?`,
        [brandId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  // Get top campaigns for a brand
  static getTopCampaigns(brandId) {
    return new Promise((resolve, reject) => {
      db2.all(
        `SELECT * FROM campaigns 
         WHERE brand_id = ? 
         ORDER BY performance_score DESC 
         LIMIT 5`,
        [brandId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  // Get verification status
  static getVerificationStatus(brandId) {
    return new Promise((resolve, reject) => {
      db2.get(
        `SELECT * FROM brand_verification WHERE brand_id = ?`,
        [brandId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || { status: 'unverified' });
          }
        }
      );
    });
  }

  // Request verification
  static requestVerification(brandId, verificationData) {
    return new Promise((resolve, reject) => {
      db2.run(
        `INSERT INTO brand_verification 
         (brand_id, status, requested_at, verification_data) 
         VALUES (?, 'pending', CURRENT_TIMESTAMP, ?)`,
        [brandId, JSON.stringify(verificationData)],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              brand_id: brandId,
              status: 'pending',
              requested_at: new Date().toISOString(),
              verification_data: verificationData
            });
          }
        }
      );
    });
  }

  // Update social links
  static updateSocialLinks(brandId, socials) {
    return new Promise((resolve, reject) => {
      // First delete existing links
      db2.run(
        `DELETE FROM brand_social_links WHERE brand_id = ?`,
        [brandId],
        async (err) => {
          if (err) {
            reject(err);
            return;
          }

          // Then insert new links
          const stmt = db2.prepare(
            `INSERT INTO brand_social_links 
             (brand_id, platform, url, followers) 
             VALUES (?, ?, ?, ?)`
          );

          try {
            // Convert socials object to array if needed
            const socialLinks = Array.isArray(socials) ? socials : Object.entries(socials).map(([platform, data]) => ({
              platform,
              url: data.url,
              followers: data.followers
            }));

            for (const social of socialLinks) {
              await new Promise((resolve, reject) => {
                stmt.run(
                  [
                    brandId,
                    social.platform,
                    social.url,
                    social.followers || 0
                  ],
                  (err) => {
                    if (err) reject(err);
                    else resolve();
                  }
                );
              });
            }
            stmt.finalize();
            resolve(true);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  // Get brand statistics
  static getBrandStats(brandId) {
    return new Promise((resolve, reject) => {
      db2.get(
        `SELECT 
            COUNT(DISTINCT c.id) as total_campaigns,
            AVG(cm.engagement_rate) as avg_engagement,
            SUM(cm.reach) as total_reach,
            AVG(cm.conversion_rate) as avg_conversion_rate,
            SUM(cm.revenue) as total_revenue,
            SUM(c.budget) as total_spend,
            SUM(cm.clicks) as total_clicks,
            AVG(cm.roi) as roi,
            (
                SELECT COUNT(DISTINCT c2.id) 
                FROM campaigns c2 
                WHERE c2.brand_id = ? 
                AND c2.created_at >= date('now', '-30 days')
            ) * 100.0 / COUNT(DISTINCT c.id) as campaign_growth,
            (
                SELECT AVG(cm2.engagement_rate) 
                FROM campaign_metrics cm2 
                JOIN campaigns c2 ON cm2.campaign_id = c2.id 
                WHERE c2.brand_id = ? 
                AND c2.created_at >= date('now', '-30 days')
            ) - AVG(cm.engagement_rate) as engagement_trend,
            (
                SELECT SUM(cm2.reach) 
                FROM campaign_metrics cm2 
                JOIN campaigns c2 ON cm2.campaign_id = c2.id 
                WHERE c2.brand_id = ? 
                AND c2.created_at >= date('now', '-30 days')
            ) * 100.0 / SUM(cm.reach) as reach_growth,
            (
                SELECT AVG(cm2.roi) 
                FROM campaign_metrics cm2 
                JOIN campaigns c2 ON cm2.campaign_id = c2.id 
                WHERE c2.brand_id = ? 
                AND c2.created_at >= date('now', '-30 days')
            ) - AVG(cm.roi) as roi_trend
        FROM campaigns c
        LEFT JOIN campaign_metrics cm ON c.id = cm.campaign_id
        WHERE c.brand_id = ?
    `, [brandId, brandId, brandId, brandId, brandId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get brand analytics
  static getBrandAnalytics(brandId) {
    return new Promise((resolve, reject) => {
      db2.all(
        `SELECT 
            strftime('%Y-%m', c.created_at) as month,
            COUNT(DISTINCT c.id) as campaigns,
            COUNT(DISTINCT ci.influencer_id) as influencers,
            AVG(cm.engagement_rate) as avg_engagement,
            SUM(p.amount) as total_spent
         FROM brands b
         LEFT JOIN campaigns c ON b.id = c.brand_id
         LEFT JOIN campaign_influencers ci ON c.id = ci.campaign_id
         LEFT JOIN collaboration_metrics cm ON c.id = cm.collaboration_id
         LEFT JOIN payments p ON c.id = p.collaboration_id
         WHERE b.id = ?
         GROUP BY strftime('%Y-%m', c.created_at)
         ORDER BY month DESC
         LIMIT 12`,
        [brandId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }

  // Get notifications for a brand
  static async getNotifications(brandId) {
    return new Promise((resolve, reject) => {
      db2.all(`
        SELECT * FROM notifications 
        WHERE brand_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
      `, [brandId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get top performing influencers for a brand
  static async getTopInfluencers(brandId) {
    return new Promise((resolve, reject) => {
      // First try to get influencers with campaign data
      db2.all(`
        SELECT i.*, iss.followers, iss.engagement_rate as avgEngagement
        FROM influencers i
        JOIN influencer_social_stats iss ON i.id = iss.influencer_id
        LEFT JOIN campaign_influencers ci ON i.id = ci.influencer_id
        LEFT JOIN campaigns c ON ci.campaign_id = c.id AND c.brand_id = ?
        GROUP BY i.id
        ORDER BY iss.followers DESC
        LIMIT 5
      `, [brandId], (err, rows) => {
        if (err) {
          console.error('Error fetching top influencers:', err);
          reject(err);
        } else if (rows && rows.length > 0) {
          resolve(rows);
        } else {
          // If no influencers with campaign data, get top influencers by followers
          db2.all(`
            SELECT i.*, iss.followers, iss.engagement_rate as avgEngagement
            FROM influencers i
            JOIN influencer_social_stats iss ON i.id = iss.influencer_id
            ORDER BY iss.followers DESC
            LIMIT 5
          `, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          });
        }
      });
    });
  }

  static async getCampaignMetrics(brandId) {
    return new Promise((resolve, reject) => {
      db2.all(`
        SELECT 
            cm.campaign_id,
            AVG(cm.engagement_rate) as engagement_rate,
            SUM(cm.reach) as total_reach,
            AVG(cm.conversion_rate) as conversion_rate,
            SUM(cm.clicks) as clicks,
            SUM(cm.impressions) as impressions,
            SUM(cm.revenue) as revenue,
            AVG(cm.roi) as roi
        FROM campaign_metrics cm
        JOIN campaigns c ON cm.campaign_id = c.id
        WHERE c.brand_id = ?
        GROUP BY cm.campaign_id
      `, [brandId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async getInfluencerMetrics(brandId) {
    return new Promise((resolve, reject) => {
      db2.all(`
        SELECT 
            im.influencer_id,
            AVG(im.engagement_rate) as avg_engagement,
            COUNT(im.post_id) as posts_count,
            AVG(im.reach) as avg_reach,
            AVG(im.likes) as avg_likes,
            AVG(im.comments) as avg_comments
        FROM influencer_metrics im
        JOIN campaign_influencers ci ON im.influencer_id = ci.influencer_id
        JOIN campaigns c ON ci.campaign_id = c.id
        WHERE c.brand_id = ?
        GROUP BY im.influencer_id
      `, [brandId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async getAudienceDemographics(brandId) {
    return new Promise((resolve, reject) => {
      db2.all(`
        SELECT 
            age_range,
            gender,
            COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
        FROM audience_demographics
        WHERE brand_id = ?
        GROUP BY age_range, gender
      `, [brandId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async getActiveCampaigns(brandId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
            c.*,
            COUNT(ci.influencer_id) as influencers_count,
            cm.engagement_rate,
            cm.reach,
            cm.conversion_rate,
            cm.clicks,
            cm.impressions,
            cm.revenue,
            cm.roi
        FROM campaigns c
        LEFT JOIN campaign_influencers ci ON c.id = ci.campaign_id
        LEFT JOIN campaign_metrics cm ON c.id = cm.campaign_id
        WHERE c.brand_id = ? AND c.status = 'active'
        GROUP BY c.id
        ORDER BY c.start_date DESC
        LIMIT 5
      `;

      db2.all(query, [brandId], (err, rows) => {
        if (err) {
          console.error('Error fetching active campaigns:', err);
          reject(err);
        } else {
          const campaigns = rows.map(campaign => {
            const startDate = new Date(campaign.start_date);
            const endDate = new Date(campaign.end_date);
            const today = new Date();

            const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            const daysElapsed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
            const daysRemaining = Math.max(0, totalDays - daysElapsed);

            return {
              ...campaign,
              progress: Math.min(100, Math.round((daysElapsed / totalDays) * 100)),
              daysRemaining,
              engagement_rate: campaign.engagement_rate || 0,
              reach: campaign.reach || 0,
              conversion_rate: campaign.conversion_rate || 0,
              budget: campaign.budget || 0,
              influencersCount: campaign.influencers_count || 0,
              status: today < endDate ? 'active' : 'completed'
            };
          });
          resolve(campaigns);
        }
      });
    });
  }
}

module.exports = brandModel;