const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a new database connection
const db2 = new sqlite3.Database(path.join(__dirname, 'db9.sqlite'));

// Function to check if a table exists
const tableExists = (tableName) => {
    return new Promise((resolve, reject) => {
        db2.get(
            `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
            [tableName],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(!!row);
                }
            }
        );
    });
};

// Function to check if a column exists
const columnExists = async (tableName, columnName) => {
    try {
        const tableInfo = await new Promise((resolve, reject) => {
            db2.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        return tableInfo.some(column => column.name === columnName);
    } catch (error) {
        console.error('Error checking column existence:', error);
        return false;
    }
};

// Function to create a table if it doesn't exist
const createTable = (tableName, createQuery) => {
    return new Promise(async (resolve, reject) => {
        try {
            const exists = await tableExists(tableName);
            if (!exists) {
                db2.run(createQuery, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        } catch (error) {
            reject(error);
        }
    });
};

// Initialize the database
const initializeDatabase = async () => {
    try {
        // Create brands table if it doesn't exist
        await createTable('brands', `
            CREATE TABLE brands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                industry TEXT,
                logo_url TEXT,
                rating REAL,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                displayName TEXT,
                username TEXT UNIQUE,
                bio TEXT,
                location TEXT,
                audienceGender TEXT,
                audienceAgeRange TEXT,
                categories TEXT,
                languages TEXT,
                profilePicUrl TEXT,
                bannerUrl TEXT,
                verified BOOLEAN DEFAULT 0,
                website TEXT,
                mission TEXT,
                currentCampaign TEXT,
                "values" TEXT,
                targetInterests TEXT,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create brand_social_links table
        await createTable('brand_social_links', `
            CREATE TABLE brand_social_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER,
                platform TEXT NOT NULL,
                url TEXT NOT NULL,
                followers INTEGER DEFAULT 0,
                avg_likes INTEGER DEFAULT 0,
                avg_comments INTEGER DEFAULT 0,
                avg_views INTEGER DEFAULT 0,
                FOREIGN KEY (brand_id) REFERENCES brands(id)
            )
        `);

        // Create brand_verification table
        await createTable('brand_verification', `
            CREATE TABLE brand_verification (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER UNIQUE,
                status TEXT DEFAULT 'pending',
                requested_at DATETIME,
                verified_at DATETIME,
                verification_data TEXT,
                FOREIGN KEY (brand_id) REFERENCES brands(id)
            )
        `);

        // Create brand_social_stats table
        await createTable('brand_social_stats', `
            CREATE TABLE brand_social_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER,
                platform TEXT NOT NULL,
                followers INTEGER DEFAULT 0,
                avg_engagement_rate DECIMAL(5,2),
                avg_reach INTEGER,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (brand_id) REFERENCES brands(id)
            )
        `);

        // Create campaigns table if it doesn't exist
        await createTable('campaigns', `
            CREATE TABLE campaigns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                start_date TEXT,
                end_date TEXT,
                budget REAL,
                status TEXT DEFAULT 'draft',
                target_audience TEXT,
                objectives TEXT,
                performance_score DECIMAL(5,2) DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (brand_id) REFERENCES brands(id)
            )
        `);

        // Check if campaigns table is empty
        const campaignCount = await new Promise((resolve, reject) => {
            db2.get('SELECT COUNT(*) as count FROM campaigns', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        if (campaignCount === 0) {
            // Insert sample campaign data
            const campaigns = [
                {
                    brand_id: 1,
                    name: 'Summer Collection Launch',
                    description: 'Promote our new summer fashion line with lifestyle content',
                    start_date: '2024-05-01',
                    end_date: '2024-07-31',
                    budget: 50000,
                    status: 'active',
                    target_audience: 'Fashion enthusiasts, 18-35',
                    objectives: 'Increase brand awareness and drive sales',
                    performance_score: 85.50
                },
                {
                    brand_id: 1,
                    name: 'Back to School Campaign',
                    description: 'Promote student essentials and back-to-school collections',
                    start_date: '2024-08-01',
                    end_date: '2024-09-30',
                    budget: 35000,
                    status: 'upcoming',
                    target_audience: 'Students, parents',
                    objectives: 'Drive seasonal sales and increase market share',
                    performance_score: 0.00
                },
                {
                    brand_id: 1,
                    name: 'Holiday Special',
                    description: 'Festive campaign promoting holiday collections and gift ideas',
                    start_date: '2024-11-15',
                    end_date: '2024-12-31',
                    budget: 75000,
                    status: 'draft',
                    target_audience: 'General audience, gift shoppers',
                    objectives: 'Maximize holiday sales and customer acquisition',
                    performance_score: 0.00
                },
                {
                    brand_id: 1,
                    name: 'Sustainability Initiative',
                    description: 'Highlight our eco-friendly products and sustainable practices',
                    start_date: '2024-04-01',
                    end_date: '2024-06-30',
                    budget: 40000,
                    status: 'active',
                    target_audience: 'Eco-conscious consumers',
                    objectives: 'Build brand reputation and educate consumers',
                    performance_score: 92.75
                },
                {
                    brand_id: 1,
                    name: 'New Store Opening',
                    description: 'Promote the opening of our new flagship store',
                    start_date: '2024-09-15',
                    end_date: '2024-10-15',
                    budget: 60000,
                    status: 'upcoming',
                    target_audience: 'Local community, fashion enthusiasts',
                    objectives: 'Drive foot traffic and create buzz',
                    performance_score: 0.00
                }
            ];

            for (const campaign of campaigns) {
                await new Promise((resolve, reject) => {
                    db2.run(`
                        INSERT INTO campaigns (
                            brand_id, name, description, start_date, end_date,
                            budget, status, target_audience, objectives, performance_score
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        campaign.brand_id,
                        campaign.name,
                        campaign.description,
                        campaign.start_date,
                        campaign.end_date,
                        campaign.budget,
                        campaign.status,
                        campaign.target_audience,
                        campaign.objectives,
                        campaign.performance_score
                    ], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
            console.log('Sample campaign data inserted successfully');
        } else {
            console.log('Campaigns table already contains data');
        }

        // Create influencers table
        await createTable('influencers', `
            CREATE TABLE influencers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                bio TEXT,
                profile_pic_url TEXT,
                banner_url TEXT,
                location TEXT,
                categories TEXT,
                audience_gender TEXT,
                audience_age_range TEXT,
                languages TEXT,
                rating DECIMAL(3,2) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Check if influencers table is empty before inserting sample data
        const influencerCount = await new Promise((resolve, reject) => {
            db2.get('SELECT COUNT(*) as count FROM influencers', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        if (influencerCount === 0) {
            // Insert sample influencer
            await db2.run(`
                INSERT INTO influencers (name, username, email, bio, profile_pic_url, location, categories)
                VALUES 
                    ('John Doe', 'johndoe', 'john@example.com', 'Fashion and lifestyle influencer', '/images/default-avatar.jpg', 'New York', '["Fashion", "Lifestyle"]'),
                    ('Jane Smith', 'janesmith', 'jane@example.com', 'Beauty and makeup expert', '/images/default-avatar.jpg', 'Los Angeles', '["Beauty", "Makeup"]')
            `);
        } else {
            console.log('Influencers table already contains data, skipping insertion.');
        }

        // Create influencer_social_stats table
        await createTable('influencer_social_stats', `
            CREATE TABLE influencer_social_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                influencer_id INTEGER,
                platform TEXT NOT NULL,
                followers INTEGER DEFAULT 0,
                engagement_rate DECIMAL(5,2),
                avg_reach INTEGER,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (influencer_id) REFERENCES influencers(id)
            )
        `);

        // Check if social stats table is empty before inserting sample data
        const socialStatsCount = await new Promise((resolve, reject) => {
            db2.get('SELECT COUNT(*) as count FROM influencer_social_stats', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        if (socialStatsCount === 0) {
            // Insert sample social stats
            await db2.run(`
                INSERT INTO influencer_social_stats (influencer_id, platform, followers, engagement_rate, avg_reach)
                VALUES 
                    (1, 'instagram', 50000, 4.5, 25000),
                    (1, 'youtube', 30000, 3.2, 15000),
                    (2, 'instagram', 75000, 5.2, 40000),
                    (2, 'tiktok', 100000, 6.8, 60000)
            `);
        } else {
            console.log('Social stats table already contains data, skipping insertion.');
        }

        // Create campaign_influencers table
        await createTable('campaign_influencers', `
            CREATE TABLE campaign_influencers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER,
                influencer_id INTEGER,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
                FOREIGN KEY (influencer_id) REFERENCES influencers(id)
            )
        `);

        // Create collaboration_metrics table
        await createTable('collaboration_metrics', `
            CREATE TABLE collaboration_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                collaboration_id INTEGER,
                engagement_rate DECIMAL(5,2),
                reach INTEGER,
                clicks INTEGER,
                conversions INTEGER,
                timeliness_score INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (collaboration_id) REFERENCES campaign_influencers(id)
            )
        `);

        // Check if collaboration_metrics table is empty
        const metricsCount = await new Promise((resolve, reject) => {
            db2.get('SELECT COUNT(*) as count FROM collaboration_metrics', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        if (metricsCount === 0) {
            // Insert sample collaboration metrics
            await db2.run(`
                INSERT INTO collaboration_metrics (
                    collaboration_id, engagement_rate, reach, clicks, conversions, timeliness_score
                ) VALUES 
                    (1, 4.75, 25000, 1200, 85, 90),
                    (2, 5.20, 35000, 1800, 120, 95),
                    (3, 3.90, 15000, 800, 45, 85),
                    (4, 6.10, 45000, 2200, 150, 92),
                    (5, 4.25, 20000, 1000, 65, 88),
                    (6, 5.50, 30000, 1500, 95, 94),
                    (7, 4.90, 28000, 1300, 75, 89),
                    (8, 5.80, 40000, 2000, 130, 96)
            `);
        } else {
            console.log('Collaboration metrics table already contains data, skipping insertion.');
        }

        // Create notifications table
        await createTable('notifications', `
            CREATE TABLE notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                read BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (brand_id) REFERENCES brands(id)
            )
        `);

        // Insert sample notifications
        await db2.run(`
            INSERT INTO notifications (brand_id, title, message, read)
            VALUES 
                (1, 'New Campaign Request', 'Influencer @johndoe requested to join your campaign', FALSE),
                (1, 'Campaign Update', 'Your campaign "Summer Collection" has reached 50% of its goal', FALSE),
                (1, 'New Message', 'You have a new message from @janedoe', TRUE)
        `);

        // Create collaborations table
        await createTable('collaborations', `
            CREATE TABLE collaborations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                brand_id INTEGER,
                influencer_id INTEGER,
                status TEXT DEFAULT 'active',
                progress INTEGER DEFAULT 0,
                deadline DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (brand_id) REFERENCES brands(id),
                FOREIGN KEY (influencer_id) REFERENCES influencers(id)
            )
        `);

        // Create collaboration_requests table
        await createTable('collaboration_requests', `
            CREATE TABLE collaboration_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER,
                influencer_id INTEGER,
                campaign_id INTEGER,
                collab_title TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (brand_id) REFERENCES brands(id),
                FOREIGN KEY (influencer_id) REFERENCES influencers(id),
                FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
            )
        `);

        // Check if collaboration_requests table is empty
        const requestsCount = await new Promise((resolve, reject) => {
            db2.get('SELECT COUNT(*) as count FROM collaboration_requests', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        if (requestsCount === 0) {
            // Insert sample collaboration requests
            await db2.run(`
                INSERT INTO collaboration_requests (
                    brand_id, influencer_id, campaign_id, collab_title, status
                ) VALUES 
                    (1, 1, 1, 'Summer Collection Campaign', 'pending'),
                    (2, 1, 2, 'Back to School Promotion', 'pending'),
                    (1, 1, 3, 'Holiday Special Campaign', 'pending'),
                    (2, 1, 4, 'New Product Launch', 'pending'),
                    (1, 1, 5, 'Sustainability Initiative', 'pending')
            `);
        } else {
            console.log('Collaboration requests table already contains data, skipping insertion.');
        }

        // Create payments table
        await createTable('payments', `
            CREATE TABLE payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                collaboration_id INTEGER,
                amount REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                payment_date DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (collaboration_id) REFERENCES collaborations(id)
            )
        `);

        // Insert sample brand data if brands table is empty
        const brandsCount = await new Promise((resolve, reject) => {
            db2.get('SELECT COUNT(*) as count FROM brands', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        if (brandsCount === 0) {
            const sampleBrands = [
                {
                    name: 'Nike',
                    displayName: 'Nike',
                    username: 'nike',
                    bio: 'Just Do It. We believe in the power of sport to move the world forward.',
                    industry: 'Sportswear',
                    location: 'Beaverton, Oregon',
                    audienceGender: 'Unisex',
                    audienceAgeRange: '15-45',
                    categories: '["Sportswear", "Athletics", "Lifestyle"]',
                    languages: '["English", "Spanish", "French"]',
                    logo_url: '/images/brands/nike.png',
                    profilePicUrl: '/images/brands/nike-profile.jpg',
                    bannerUrl: '/images/brands/nike-banner.jpg',
                    rating: 4.8,
                    verified: 1,
                    website: 'https://www.nike.com',
                    mission: 'To bring inspiration and innovation to every athlete in the world.',
                    currentCampaign: 'Promoting sustainable sportswear and encouraging active lifestyles',
                    "values": '["Innovation", "Sustainability", "Performance", "Community"]',
                    targetInterests: '["Sports", "Fitness", "Lifestyle", "Sustainability"]'
                },
                {
                    name: 'Apple',
                    displayName: 'Apple',
                    username: 'apple',
                    bio: 'Think Different. We create products that empower people to unleash their creativity.',
                    industry: 'Technology',
                    location: 'Cupertino, California',
                    audienceGender: 'Unisex',
                    audienceAgeRange: '18-65',
                    categories: '["Technology", "Lifestyle", "Entertainment"]',
                    languages: '["English", "Chinese", "Japanese"]',
                    logo_url: '/images/brands/apple.png',
                    profilePicUrl: '/images/brands/apple-profile.jpg',
                    bannerUrl: '/images/brands/apple-banner.jpg',
                    rating: 4.9,
                    verified: 1,
                    website: 'https://www.apple.com',
                    mission: 'To bring the best user experience to customers through innovative hardware and software.',
                    currentCampaign: 'Introducing the next generation of personal computing',
                    "values": '["Innovation", "Privacy", "Accessibility", "Environment"]',
                    targetInterests: '["Technology", "Design", "Creativity", "Innovation"]'
                }
            ];

            for (const brand of sampleBrands) {
                await new Promise((resolve, reject) => {
                    db2.run(
                        `INSERT INTO brands (
                            name, displayName, username, bio, industry, location,
                            audienceGender, audienceAgeRange, categories, languages,
                            logo_url, profilePicUrl, bannerUrl, rating, verified, website,
                            mission, currentCampaign, "values", targetInterests
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            brand.name, brand.displayName, brand.username, brand.bio,
                            brand.industry, brand.location, brand.audienceGender,
                            brand.audienceAgeRange, brand.categories, brand.languages,
                            brand.logo_url, brand.profilePicUrl, brand.bannerUrl,
                            brand.rating, brand.verified, brand.website,
                            brand.mission, brand.currentCampaign, brand["values"], brand.targetInterests
                        ],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }
        }

        // Create campaign_metrics table
        await createTable('campaign_metrics', `
            CREATE TABLE campaign_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id INTEGER,
                engagement_rate DECIMAL(5,2),
                reach INTEGER,
                conversion_rate DECIMAL(5,2),
                clicks INTEGER,
                impressions INTEGER,
                revenue DECIMAL(10,2),
                roi DECIMAL(5,2),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
            )
        `);

        // Create influencer_metrics table
        await createTable('influencer_metrics', `
            CREATE TABLE influencer_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                influencer_id INTEGER,
                post_id TEXT,
                engagement_rate DECIMAL(5,2),
                reach INTEGER,
                likes INTEGER,
                comments INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (influencer_id) REFERENCES influencers(id)
            )
        `);

        // Create audience_demographics table
        await createTable('audience_demographics', `
            CREATE TABLE audience_demographics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_id INTEGER,
                age_range TEXT,
                gender TEXT,
                count INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (brand_id) REFERENCES brands(id)
            )
        `);

        // Insert sample campaign metrics
        await db2.run(`
            INSERT INTO campaign_metrics (campaign_id, engagement_rate, reach, conversion_rate, clicks, impressions, revenue, roi)
            VALUES 
                (1, 4.5, 50000, 2.3, 1200, 25000, 5000.00, 150.0),
                (2, 5.2, 75000, 3.1, 1800, 35000, 7500.00, 180.0)
        `);

        // Insert sample influencer metrics
        await db2.run(`
            INSERT INTO influencer_metrics (influencer_id, post_id, engagement_rate, reach, likes, comments)
            VALUES 
                (1, 'post1', 4.8, 25000, 1200, 150),
                (1, 'post2', 5.2, 28000, 1400, 180),
                (2, 'post3', 6.1, 35000, 2000, 250)
        `);

        // Insert sample audience demographics
        await db2.run(`
            INSERT INTO audience_demographics (brand_id, age_range, gender, count)
            VALUES 
                (1, '18-24', 'male', 15000),
                (1, '18-24', 'female', 20000),
                (1, '25-34', 'male', 18000),
                (1, '25-34', 'female', 22000),
                (1, '35-44', 'male', 12000),
                (1, '35-44', 'female', 15000)
        `);

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

// Export the database instance and initialization function
module.exports = {
    db2,
    initializeDatabase
};