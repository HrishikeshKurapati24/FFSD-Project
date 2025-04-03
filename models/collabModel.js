// model/collabModel.js
const dbPromise = require('./db');

const getAllCollabs = (callback) => {
  dbPromise.then((db) => {
    db.all('SELECT * FROM collabs', [], (err, rows) => {
      if (err) {
        console.error('Error fetching collabs:', err.message);
        callback(err, null);
      } else {
        console.log('Fetched collabs from database:', rows);
        callback(null, rows || []);
      }
    });
  }).catch((err) => {
    console.error('Database not initialized:', err);
    callback(err, null);
  });
};

const getCollabById = (id, callback) => {
  dbPromise.then((db) => {
    db.get('SELECT * FROM collabs WHERE id = ?', [id], (err, row) => {
      if (err) {
        console.error('Error fetching collab by ID:', err.message);
        callback(err, null);
      } else if (!row) {
        console.log(`No collab found with ID: ${id}`);
        callback(null, null);
      } else {
        console.log('Fetched collab from database:', row);
        callback(null, row);
      }
    });
  }).catch((err) => {
    console.error('Database not initialized:', err);
    callback(err, null);
  });
};

module.exports = { getAllCollabs, getCollabById };