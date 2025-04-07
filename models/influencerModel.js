// model/influencerModel.js
const dbPromise = require('./db');
const { db, initializeDatabase } = require('./db1');

// Initialize the database when the model is loaded
initializeDatabase().catch(console.error);

// Get influencer by ID
const getInfluencerById = async (influencerId) => {
  try {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM influencers WHERE id = ?`,
        [influencerId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        }
      );
    });
  } catch (error) {
    console.error('Error getting influencer by ID:', error);
    throw error;
  }
};

// Get influencer profile details with social media stats
const getInfluencerProfileDetails = async (influencerId) => {
  try {
    // Get basic influencer info
    const influencer = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
            id, name, username, email, bio, location,
            audience_gender, audience_age_range,
            profile_pic_url, banner_url,
            categories, languages, social_media_links,
            verified, created_at
         FROM influencers 
         WHERE id = ?`,
        [influencerId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!influencer) {
      return null;
    }

    // Get social media stats
    const socialStats = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
            platform, followers_count, avg_likes,
            avg_comments, avg_views, category
         FROM influencer_social_stats
         WHERE influencer_id = ?`,
        [influencerId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Format social media data
    const socials = socialStats.map(stat => ({
      platform: stat.platform,
      name: stat.platform.charAt(0).toUpperCase() + stat.platform.slice(1),
      icon: stat.platform.toLowerCase(),
      followers: stat.followers_count,
      avgLikes: stat.avg_likes,
      avgComments: stat.avg_comments,
      avgViews: stat.avg_views,
      category: stat.category
    }));

    // Get top performing content
    const bestPosts = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
            platform, post_url, thumbnail_url,
            likes_count, comments_count, post_date
         FROM influencer_content
         WHERE influencer_id = ?
         ORDER BY (likes_count + comments_count) DESC
         LIMIT 5`,
        [influencerId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Format the data for the view
    return {
      ...influencer,
      displayName: influencer.name,
      profilePicUrl: influencer.profile_pic_url,
      bannerUrl: influencer.banner_url,
      audienceGender: influencer.audience_gender,
      audienceAgeRange: influencer.audience_age_range,
      categories: JSON.parse(influencer.categories || '[]'),
      languages: JSON.parse(influencer.languages || '[]'),
      socials: socials,
      bestPosts: bestPosts.map(post => ({
        platform: post.platform,
        url: post.post_url,
        thumbnail: post.thumbnail_url,
        likes: post.likes_count,
        comments: post.comments_count,
        date: post.post_date
      })),
      createdAt: influencer.created_at
    };
  } catch (error) {
    console.error('Error getting influencer profile details:', error);
    throw error;
  }
};

// Update influencer profile
const updateInfluencerProfile = async (influencerId, profileData) => {
  try {
    const {
      name,
      username,
      bio,
      location,
      audience_gender,
      audience_age_range,
      categories,
      languages,
      social_media_links,
      profile_pic_url,
      banner_url
    } = profileData;

    // Update basic profile info
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE influencers 
         SET name = ?, username = ?, bio = ?, location = ?,
             audience_gender = ?, audience_age_range = ?,
             categories = ?, languages = ?, social_media_links = ?,
             profile_pic_url = ?, banner_url = ?
         WHERE id = ?`,
        [
          name, username, bio, location,
          audience_gender, audience_age_range,
          JSON.stringify(categories),
          JSON.stringify(languages),
          JSON.stringify(social_media_links),
          profile_pic_url, banner_url,
          influencerId
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Update social media stats if provided
    if (social_media_links && social_media_links.length > 0) {
      for (const social of social_media_links) {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT OR REPLACE INTO influencer_social_stats 
             (influencer_id, platform, followers_count, avg_likes, 
              avg_comments, avg_views, category)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              influencerId,
              social.platform,
              social.followers || 0,
              social.avgLikes || 0,
              social.avgComments || 0,
              social.avgViews || 0,
              social.category || 'general'
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating influencer profile:', error);
    throw error;
  }
};

// Get all influencers
const getAllInfluencers = (callback) => {
  dbPromise.then((db) => {
    db.all('SELECT * FROM influencers', [], (err, rows) => {
      if (err) {
        console.error('Error fetching influencers:', err.message);
        callback(err, null);
      } else {
        console.log('Fetched influencers from database:', rows);
        callback(null, rows || []);
      }
    });
  }).catch((err) => {
    console.error('Database not initialized:', err);
    callback(err, null);
  });
};

// Get engagement rates for the last 6 months
const getEngagementRates = async (influencerId) => {
  try {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT month, engagement_rate 
         FROM influencer_engagement 
         WHERE influencer_id = ? 
         ORDER BY month DESC 
         LIMIT 6`,
        [influencerId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(rate => rate.engagement_rate));
        }
      );
    });
  } catch (error) {
    console.error('Error getting engagement rates:', error);
    throw error;
  }
};

// Get follower growth for the last 6 months
const getFollowerGrowth = async (influencerId) => {
  try {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT month, new_followers 
         FROM influencer_followers 
         WHERE influencer_id = ? 
         ORDER BY month DESC 
         LIMIT 6`,
        [influencerId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows.map(g => g.new_followers));
        }
      );
    });
  } catch (error) {
    console.error('Error getting follower growth:', error);
    throw error;
  }
};

module.exports = {
  getInfluencerById,
  getInfluencerProfileDetails,
  updateInfluencerProfile,
  getAllInfluencers,
  getEngagementRates,
  getFollowerGrowth
};