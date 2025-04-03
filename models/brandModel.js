// model/brandModel.js
const dbPromise = require('./db');

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

module.exports = { getAllBrands };