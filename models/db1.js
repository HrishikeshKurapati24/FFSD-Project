const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

// Initialize database with tables and sample data
const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create tables with IF NOT EXISTS
            db.run(`CREATE TABLE IF NOT EXISTS influencers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                username TEXT,
                email TEXT,
                bio TEXT,
                location TEXT,
                audience_gender TEXT,
                audience_age_range TEXT,
                profile_pic_url TEXT,
                banner_url TEXT,
                categories TEXT,
                languages TEXT,
                social_media_links TEXT,
                verified INTEGER DEFAULT 0,
                total_followers INTEGER DEFAULT 0,
                avg_engagement_rate REAL DEFAULT 0,
                monthly_earnings DECIMAL(10,2) DEFAULT 0,
                earnings_change DECIMAL(5,2) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) console.error('Error creating influencers table:', err);
            });

            db.run(`CREATE TABLE IF NOT EXISTS influencer_social_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                influencer_id INTEGER,
                platform TEXT,
                followers_count INTEGER,
                avg_likes INTEGER,
                avg_comments INTEGER,
                avg_views INTEGER,
                category TEXT,
                FOREIGN KEY (influencer_id) REFERENCES influencers(id)
            )`, (err) => {
                if (err) console.error('Error creating influencer_social_stats table:', err);
            });

            db.run(`CREATE TABLE IF NOT EXISTS influencer_content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                influencer_id INTEGER,
                platform TEXT,
                post_url TEXT,
                thumbnail_url TEXT,
                likes_count INTEGER,
                comments_count INTEGER,
                post_date DATETIME,
                FOREIGN KEY (influencer_id) REFERENCES influencers(id)
            )`, (err) => {
                if (err) console.error('Error creating influencer_content table:', err);
            });

            db.run(`CREATE TABLE IF NOT EXISTS influencer_engagement (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                influencer_id INTEGER,
                month TEXT,
                engagement_rate REAL,
                FOREIGN KEY (influencer_id) REFERENCES influencers(id)
            )`, (err) => {
                if (err) console.error('Error creating influencer_engagement table:', err);
            });

            db.run(`CREATE TABLE IF NOT EXISTS influencer_followers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                influencer_id INTEGER,
                month TEXT,
                new_followers INTEGER,
                FOREIGN KEY (influencer_id) REFERENCES influencers(id)
            )`, (err) => {
                if (err) console.error('Error creating influencer_followers table:', err);
            });

            db.run(`CREATE TABLE IF NOT EXISTS brands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                industry TEXT,
                logo_url TEXT,
                status TEXT DEFAULT 'active',
                rating REAL DEFAULT 0.0
            )`, (err) => {
                if (err) console.error('Error creating brands table:', err);
            });

            db.run(`CREATE TABLE IF NOT EXISTS brand_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER,
                category TEXT,
                FOREIGN KEY (brand_id) REFERENCES brands(id)
            )`, (err) => {
                if (err) console.error('Error creating brand_categories table:', err);
            });

            db.run(`CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                title TEXT,
                message TEXT,
                type TEXT,
                read INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES influencers(id)
            )`, (err) => {
                if (err) console.error('Error creating notifications table:', err);
            });

            // Check if we need to insert sample data
            db.get('SELECT COUNT(*) as count FROM influencers', (err, row) => {
                if (err) {
                    console.error('Error checking influencer count:', err);
                    resolve(db);
                    return;
                }

                if (row.count === 0) {
                    console.log('Inserting sample data...');
                    // Insert sample influencer
                    const influencerStmt = db.prepare(`
                        INSERT INTO influencers (
                            name, username, email, bio, location,
                            audience_gender, audience_age_range,
                            profile_pic_url, banner_url,
                            categories, languages, social_media_links,
                            verified, total_followers, avg_engagement_rate, 
                            monthly_earnings, earnings_change
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `);

                    influencerStmt.run(
                        'Sarah Johnson',
                        'sarahjohnson',
                        'sarah@example.com',
                        'Fashion and lifestyle content creator',
                        'New York, USA',
                        'female',
                        '18-34',
                        '/images/influencers/sarah.jpg',
                        '/images/influencers/sarah-banner.jpg',
                        JSON.stringify(['fashion', 'lifestyle', 'beauty']),
                        JSON.stringify(['English', 'Spanish']),
                        JSON.stringify({ instagram: 'https://instagram.com/sarahjohnson', youtube: 'https://youtube.com/sarahjohnson' }),
                        1,
                        50000,
                        4.5,
                        2500.00,
                        15.5
                    );

                    // Insert social stats
                    const socialStatsStmt = db.prepare(`
                        INSERT INTO influencer_social_stats (
                            influencer_id, platform, followers_count,
                            avg_likes, avg_comments, avg_views, category
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);

                    socialStatsStmt.run(1, 'instagram', 150000, 5000, 300, 0, 'Fashion');
                    socialStatsStmt.run(1, 'youtube', 50000, 0, 0, 10000, 'Lifestyle');
                    socialStatsStmt.run(1, 'tiktok', 200000, 0, 0, 50000, 'Beauty');

                    // Insert content
                    const contentStmt = db.prepare(`
                        INSERT INTO influencer_content (
                            influencer_id, platform, post_url,
                            thumbnail_url, likes_count, comments_count, post_date
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);

                    contentStmt.run(
                        1,
                        'instagram',
                        'https://instagram.com/p/abc123',
                        '/images/content/insta-post1.jpg',
                        5500,
                        320,
                        '2024-03-15'
                    );

                    // Insert engagement data
                    const engagementStmt = db.prepare(`
                        INSERT INTO influencer_engagement (
                            influencer_id, month, engagement_rate
                        ) VALUES (?, ?, ?)
                    `);

                    engagementStmt.run(1, 'Jan', 4.5);
                    engagementStmt.run(1, 'Feb', 4.8);
                    engagementStmt.run(1, 'Mar', 5.2);

                    // Insert follower growth
                    const followersStmt = db.prepare(`
                        INSERT INTO influencer_followers (
                            influencer_id, month, new_followers
                        ) VALUES (?, ?, ?)
                    `);

                    followersStmt.run(1, 'Jan', 5000);
                    followersStmt.run(1, 'Feb', 4500);
                    followersStmt.run(1, 'Mar', 6000);

                    // Insert sample brands
                    const brandStmt = db.prepare(`
                        INSERT INTO brands (name, industry, logo_url, status, rating)
                        VALUES (?, ?, ?, ?, ?)
                    `);

                    brandStmt.run('Nike', 'Sportswear', '/images/brands/nike-logo.png', 'active', 4.8);
                    brandStmt.run('Sephora', 'Beauty', '/images/brands/sephora-logo.png', 'active', 4.6);
                    brandStmt.run('Zara', 'Fashion', '/images/brands/zara-logo.png', 'active', 4.5);

                    // Insert brand categories
                    const brandCategoryStmt = db.prepare(`
                        INSERT INTO brand_categories (brand_id, category)
                        VALUES (?, ?)
                    `);

                    brandCategoryStmt.run(1, 'Fashion');
                    brandCategoryStmt.run(1, 'Sportswear');
                    brandCategoryStmt.run(2, 'Beauty');
                    brandCategoryStmt.run(3, 'Fashion');

                    // Insert sample notifications
                    const notificationStmt = db.prepare(`
                        INSERT INTO notifications (user_id, title, message, type, read)
                        VALUES (?, ?, ?, ?, ?)
                    `);

                    notificationStmt.run(
                        1,
                        'New Collaboration Request',
                        'Nike has sent you a collaboration request',
                        'collaboration',
                        0
                    );

                    notificationStmt.run(
                        1,
                        'Payment Received',
                        'Your payment of $500 has been processed',
                        'payment',
                        0
                    );

                    notificationStmt.run(
                        1,
                        'Profile Update',
                        'Your profile has been successfully updated',
                        'system',
                        1
                    );

                    // Finalize all prepared statements
                    influencerStmt.finalize();
                    socialStatsStmt.finalize();
                    contentStmt.finalize();
                    engagementStmt.finalize();
                    followersStmt.finalize();
                    brandStmt.finalize();
                    brandCategoryStmt.finalize();
                    notificationStmt.finalize();

                    console.log('Sample data inserted successfully');
                } else {
                    console.log('Sample data already exists, skipping insertion');
                }
                resolve(db);
            });
        });
    });
};

// Export the database instance and initialization function
module.exports = {
    db,
    initializeDatabase
};