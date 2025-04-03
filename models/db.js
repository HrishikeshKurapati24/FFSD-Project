// model/db.js
const sqlite3 = require('sqlite3').verbose();

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('./brands.db', (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
      } else {
        console.log('Connected to SQLite database.');
      }
    });

    db.serialize(() => {
      // Create brands table
      db.run(`
        CREATE TABLE IF NOT EXISTS brands (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          field_of_operation TEXT NOT NULL,
          image_url TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating brands table:', err.message);
          reject(err);
        } else {
          console.log('Brands table created or already exists.');
        }
      });

      // Create influencers table
      db.run(`
        CREATE TABLE IF NOT EXISTS influencers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          field_of_influence TEXT NOT NULL,
          image_url TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating influencers table:', err.message);
          reject(err);
        } else {
          console.log('Influencers table created or already exists.');
        }
      });

      // Create collabs table
      db.run(`
        CREATE TABLE IF NOT EXISTS collabs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          brand_name TEXT NOT NULL,
          influence_regions TEXT NOT NULL,
          interests TEXT NOT NULL,
          pay_per_post TEXT NOT NULL,
          commission TEXT NOT NULL,
          offer_sentence TEXT NOT NULL,
          channels TEXT NOT NULL,
          min_followers TEXT NOT NULL,
          age_group TEXT NOT NULL,
          genders TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating collabs table:', err.message);
          reject(err);
        } else {
          console.log('Collabs table created or already exists.');
        }
      });

      // Create collab_requests table
      db.run(`
        CREATE TABLE IF NOT EXISTS collab_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          collab_title TEXT NOT NULL,
          influencer_name TEXT NOT NULL,
          influencer_channels TEXT NOT NULL,
          followers TEXT NOT NULL,
          engagement_rate TEXT NOT NULL,
          required_channels TEXT NOT NULL,
          min_followers TEXT NOT NULL,
          age_group TEXT NOT NULL,
          genders TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating collab_requests table:', err.message);
          reject(err);
        } else {
          console.log('Collab_requests table created or already exists.');
        }
      });

      // Insert sample brands
      const brandStmt = db.prepare('INSERT INTO brands (name, field_of_operation, image_url) VALUES (?, ?, ?)');
      const sampleBrands = [
        ['American Touristers', 'Travelling and explorations', '/i_index/american-tourister.png'],
        ['Boat', 'Technology, Gadgets', '/i_index/boat.png'],
        ['Garnier', 'Men\'s fashion, grooming', '/i_index/garnier.jpg'],
        ['Fair and Lovely', 'Fashion, Lifestyle', '/i_index/fair-and-lovely.png'],
        ['Canon', 'Photography', '/i_index/canon.png']
      ];

      db.get('SELECT COUNT(*) as count FROM brands', (err, row) => {
        if (err) {
          console.error('Error checking brands table count:', err.message);
          reject(err);
        } else if (row.count === 0) {
          console.log('Brands table is empty, inserting sample data.');
          sampleBrands.forEach((brand) => {
            brandStmt.run(brand[0], brand[1], brand[2], (err) => {
              if (err) {
                console.error(`Error inserting brand ${brand[0]}:`, err.message);
              } else {
                console.log(`Inserted brand: ${brand[0]}`);
              }
            });
          });
          brandStmt.finalize();
        } else {
          console.log('Brands table already contains data, skipping insertion.');
        }
      });

      // Insert sample influencers
      const influencerStmt = db.prepare('INSERT INTO influencers (name, field_of_influence, image_url) VALUES (?, ?, ?)');
      const sampleInfluencers = [
        ['Anushka Sen', 'Fashion, Lifestyle', '/B2_index/anushka-sen.jpg'],
        ['Simpleghar', 'Technology, Gadgets', '/B2_index/simpleghar-telugu.jpeg'],
        ['Anvesh', 'Travel, Exploration', '/B2_index/anvesh.jpeg'],
        ['Aye Jude', 'Men\'s fashion, grooming', '/B2_index/aye-jude.jpeg'],
        ['Surbhi Kaushik', 'Photography', '/B2_index/surbhi-kaushik.webp']
      ];

      db.get('SELECT COUNT(*) as count FROM influencers', (err, row) => {
        if (err) {
          console.error('Error checking influencers table count:', err.message);
          reject(err);
        } else if (row.count === 0) {
          console.log('Influencers table is empty, inserting sample data.');
          sampleInfluencers.forEach((influencer) => {
            influencerStmt.run(influencer[0], influencer[1], influencer[2], (err) => {
              if (err) {
                console.error(`Error inserting influencer ${influencer[0]}:`, err.message);
              } else {
                console.log(`Inserted influencer: ${influencer[0]}`);
              }
            });
          });
          influencerStmt.finalize();
        } else {
          console.log('Influencers table already contains data, skipping insertion.');
        }
      });

      // Insert sample collabs
      const collabStmt = db.prepare(`
        INSERT INTO collabs (
          title, brand_name, influence_regions, interests, pay_per_post, commission, 
          offer_sentence, channels, min_followers, age_group, genders
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const sampleCollabs = [
        [
          'Calling All Pakistani and Indian Creators -- Wear Culture - Make Impact',
          '8 Billion Project',
          'India 🇮🇳 Pakistan 🇵🇰 United Arab Emirates 🇦🇪',
          'Streetwear Music Education',
          'None',
          '8%',
          'Every drop is limit ...',
          'Facebook, Instagram, Twitter',
          'Any',
          '18-50',
          'Any'
        ],
        [
          'A Cool Spring Treat for your Pup',
          'The Bear & The Rat',
          'United States 🇺🇸',
          'Pets, Nutrition',
          '$10 per post',
          'None',
          'Treat your pup with our frozen dog treats.',
          'Instagram, TikTok',
          'Any',
          'Any',
          'Any'
        ],
        [
          'Eco-Friendly Fashion Collaboration',
          'GreenWear',
          'Europe',
          'Fashion, Sustainability',
          '$50 per post + Free eco-friendly apparel',
          'N/A',
          'Support sustainability with our latest organic clothing line.',
          'Instagram',
          '10k+',
          '18-35',
          'Any'
        ]
      ];

      db.get('SELECT COUNT(*) as count FROM collabs', (err, row) => {
        if (err) {
          console.error('Error checking collabs table count:', err.message);
          reject(err);
        } else if (row.count === 0) {
          console.log('Collabs table is empty, inserting sample data.');
          sampleCollabs.forEach((collab) => {
            collabStmt.run(collab[0], collab[1], collab[2], collab[3], collab[4], collab[5], collab[6], collab[7], collab[8], collab[9], collab[10], (err) => {
              if (err) {
                console.error(`Error inserting collab ${collab[0]}:`, err.message);
              } else {
                console.log(`Inserted collab: ${collab[0]}`);
              }
            });
          });
          collabStmt.finalize();
        } else {
          console.log('Collabs table already contains data, skipping insertion.');
        }
      });

      // Insert sample collab_requests
      const requestStmt = db.prepare(`
        INSERT INTO collab_requests (
          collab_title, influencer_name, influencer_channels, followers, engagement_rate,
          required_channels, min_followers, age_group, genders
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const sampleRequests = [
        [
          'Calling All Pakistani and Indian Creators -- Wear Culture - Make Impact',
          'Michael Chen',
          'TikTok, Snapchat',
          '75K',
          '3.8%',
          'Facebook, Instagram, Twitter',
          'Any',
          '18-50',
          'Any'
        ],
        [
          'A Cool Spring Treat for your Pup',
          'Alex Johnson',
          'Instagram, TikTok',
          '150K',
          '4.5%',
          'Instagram, TikTok',
          'Any',
          'Any',
          'Any'
        ],
        [
          'Eco-Friendly Fashion Collaboration',
          'Sarah Lee',
          'Instagram, YouTube',
          '250K',
          '5.2%',
          'Instagram',
          '10k+',
          '18-35',
          'Any'
        ]
      ];

      db.get('SELECT COUNT(*) as count FROM collab_requests', (err, row) => {
        if (err) {
          console.error('Error checking collab_requests table count:', err.message);
          reject(err);
        } else if (row.count === 0) {
          console.log('Collab_requests table is empty, inserting sample data.');
          sampleRequests.forEach((request) => {
            requestStmt.run(request[0], request[1], request[2], request[3], request[4], request[5], request[6], request[7], request[8], (err) => {
              if (err) {
                console.error(`Error inserting request ${request[0]}:`, err.message);
              } else {
                console.log(`Inserted request: ${request[0]}`);
              }
            });
          });
          requestStmt.finalize((err) => {
            if (err) {
              console.error('Error finalizing request statement:', err.message);
              reject(err);
            } else {
              console.log('Sample data insertion completed.');
              resolve(db);
            }
          });
        } else {
          console.log('Collab_requests table already contains data, skipping insertion.');
          resolve(db);
        }
      });
    });
  });
};

module.exports = initializeDatabase().then((db) => db).catch((err) => {
  console.error('Database initialization failed:', err);
  throw err;
});