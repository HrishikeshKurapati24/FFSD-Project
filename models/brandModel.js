// model/db.js
const sqlite3 = require('sqlite3').verbose();

// Create or open the SQLite database
const db = new sqlite3.Database('./brands.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create the brands table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      field_of_operation TEXT NOT NULL,
      image_url TEXT NOT NULL
    )
  `);

  // Insert sample data (you can modify this as needed)
  const stmt = db.prepare('INSERT INTO brands (name, field_of_operation, image_url) VALUES (?, ?, ?)');
  const sampleBrands = [
    ['American Touristers', 'Travelling and exploration', '/i_index/american-tourister.png'],
    ['Boat', 'Technology, Gadgets', '/i_index/boat.png'],
    ['Garnier', 'Men\'s fashion, grooming', '/i_index/garnier.jpg'],
    ['Fair and Lovely', 'Fashion, Lifestyle', '/i_index/fair-and-lovely.png'],
    ['Canon', 'Photography', '/i_index/canon.png']
  ];

  // Check if the table is empty before inserting sample data
  db.get('SELECT COUNT(*) as count FROM brands', (err, row) => {
    if (row.count === 0) {
      for (const brand of sampleBrands) {
        stmt.run(brand[0], brand[1], brand[2]);
      }
    }
    stmt.finalize();
  });
});

const brandModel = {
  getAllBrands: function (callback) {
    const sql = "SELECT * FROM brands";
    db.all(sql, [], (err, results) => {  // Use db.all instead of db.query
      if (err) return callback(err, null);
      callback(null, results);
    });
  }
};

module.exports = brandModel;  // Ensure correct export