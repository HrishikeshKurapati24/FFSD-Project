// model/brandModel.js
const dbPromise = require('./db');
const { db, initializeDatabase } = require('./db1');

// Initialize the database when the model is loaded
initializeDatabase().catch(console.error);

// Get recommended brands for an influencer
const getRecommendedBrands = async (influencerId) => {
  try {
    // First get influencer's categories
    const influencer = await new Promise((resolve, reject) => {
      db.get(
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
      db.all(
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
const getAllBrands = (callback) => {
  dbPromise.then((db) => {
    db.all('SELECT * FROM brands', [], (err, rows) => {
      if (err) {
        console.error('Error fetching brands:', err.message);
        callback(err, null);
      } else {
        console.log('Fetched brands from database:', rows);
        callback(null, rows || []);
      }
    });
  }).catch((err) => {
    console.error('Database not initialized:', err);
    callback(err, null);
  });
};

module.exports = {
  getRecommendedBrands,
  getAllBrands
};