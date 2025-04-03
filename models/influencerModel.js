// model/influencerModel.js
const dbPromise = require('./db');

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

module.exports = { getAllInfluencers };