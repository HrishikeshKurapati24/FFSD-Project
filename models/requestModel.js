// model/requestModel.js
const dbPromise = require('./db');

const getAllRequests = (callback) => {
  dbPromise.then((db) => {
    db.all('SELECT * FROM collab_requests', [], (err, rows) => {
      if (err) {
        console.error('Error fetching collab requests:', err.message);
        callback(err, null);
      } else {
        console.log('Fetched collab requests from database:', rows);
        callback(null, rows || []);
      }
    });
  }).catch((err) => {
    console.error('Database not initialized:', err);
    callback(err, null);
  });
};

module.exports = { getAllRequests };