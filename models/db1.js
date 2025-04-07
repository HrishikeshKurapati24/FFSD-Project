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

            // Check if we need to insert sample data
            db.get('SELECT COUNT(*) as count FROM influencers', (err, row) => {
                if (err) {
                    console.error('Error checking influencer count:', err);
                    resolve(db);
                    return;
                }

                if (row.count === 0) {
                    console.log('Inserting sample data...');
                    // Insert sample data
                    const influencerStmt = db.prepare(`
                        INSERT INTO influencers (
                            name, username, email, bio, location,
                            audience_gender, audience_age_range,
                            profile_pic_url, banner_url,
                            categories, languages, social_media_links,
                            verified
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `);

                    const sampleInfluencer = {
                        name: "Sarah Johnson",
                        username: "sarahj",
                        email: "sarah@example.com",
                        bio: "Lifestyle influencer and content creator",
                        location: "New York, USA",
                        audience_gender: "Female",
                        audience_age_range: "18-35",
                        profile_pic_url: "/images/profiles/sarah.jpg",
                        banner_url: "/images/banners/sarah-banner.jpg",
                        categories: JSON.stringify(["Lifestyle", "Fashion", "Beauty"]),
                        languages: JSON.stringify(["English", "Spanish"]),
                        social_media_links: JSON.stringify([
                            { platform: "instagram", url: "https://instagram.com/sarahj" },
                            { platform: "youtube", url: "https://youtube.com/sarahj" }
                        ]),
                        verified: 1
                    };

                    influencerStmt.run(
                        sampleInfluencer.name,
                        sampleInfluencer.username,
                        sampleInfluencer.email,
                        sampleInfluencer.bio,
                        sampleInfluencer.location,
                        sampleInfluencer.audience_gender,
                        sampleInfluencer.audience_age_range,
                        sampleInfluencer.profile_pic_url,
                        sampleInfluencer.banner_url,
                        sampleInfluencer.categories,
                        sampleInfluencer.languages,
                        sampleInfluencer.social_media_links,
                        sampleInfluencer.verified
                    );

                    // Insert social media stats
                    const socialStatsStmt = db.prepare(`
                        INSERT INTO influencer_social_stats (
                            influencer_id, platform, followers_count,
                            avg_likes, avg_comments, avg_views, category
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);

                    const sampleSocialStats = [
                        {
                            platform: "instagram",
                            followers_count: 50000,
                            avg_likes: 2500,
                            avg_comments: 150,
                            avg_views: 0,
                            category: "Lifestyle"
                        },
                        {
                            platform: "youtube",
                            followers_count: 100000,
                            avg_likes: 5000,
                            avg_comments: 300,
                            avg_views: 10000,
                            category: "Lifestyle"
                        }
                    ];

                    sampleSocialStats.forEach(stat => {
                        socialStatsStmt.run(
                            1, // influencer_id
                            stat.platform,
                            stat.followers_count,
                            stat.avg_likes,
                            stat.avg_comments,
                            stat.avg_views,
                            stat.category
                        );
                    });

                    // Insert sample content
                    const contentStmt = db.prepare(`
                        INSERT INTO influencer_content (
                            influencer_id, platform, post_url,
                            thumbnail_url, likes_count, comments_count, post_date
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);

                    const sampleContent = [
                        {
                            platform: "instagram",
                            post_url: "https://instagram.com/p/123",
                            thumbnail_url: "/images/posts/insta1.jpg",
                            likes_count: 3000,
                            comments_count: 200,
                            post_date: "2024-03-15"
                        },
                        {
                            platform: "youtube",
                            post_url: "https://youtube.com/watch?v=123",
                            thumbnail_url: "/images/posts/yt1.jpg",
                            likes_count: 6000,
                            comments_count: 400,
                            post_date: "2024-03-10"
                        }
                    ];

                    sampleContent.forEach(content => {
                        contentStmt.run(
                            1, // influencer_id
                            content.platform,
                            content.post_url,
                            content.thumbnail_url,
                            content.likes_count,
                            content.comments_count,
                            content.post_date
                        );
                    });

                    // Insert sample engagement data
                    const engagementStmt = db.prepare(`
                        INSERT INTO influencer_engagement (
                            influencer_id, month, engagement_rate
                        ) VALUES (?, ?, ?)
                    `);

                    const sampleEngagement = [
                        { month: "2024-03", engagement_rate: 4.5 },
                        { month: "2024-02", engagement_rate: 4.2 },
                        { month: "2024-01", engagement_rate: 4.0 }
                    ];

                    sampleEngagement.forEach(engagement => {
                        engagementStmt.run(
                            1, // influencer_id
                            engagement.month,
                            engagement.engagement_rate
                        );
                    });

                    // Insert sample follower growth data
                    const followersStmt = db.prepare(`
                        INSERT INTO influencer_followers (
                            influencer_id, month, new_followers
                        ) VALUES (?, ?, ?)
                    `);

                    const sampleFollowers = [
                        { month: "2024-03", new_followers: 1000 },
                        { month: "2024-02", new_followers: 800 },
                        { month: "2024-01", new_followers: 600 }
                    ];

                    sampleFollowers.forEach(followers => {
                        followersStmt.run(
                            1, // influencer_id
                            followers.month,
                            followers.new_followers
                        );
                    });

                    // Insert sample brand data
                    const brandStmt = db.prepare(`
                        INSERT INTO brands (
                            name, industry, logo_url, status, rating
                        ) VALUES (?, ?, ?, ?, ?)
                    `);

                    const sampleBrands = [
                        {
                            name: "Fashion Forward",
                            industry: "Fashion",
                            logo_url: "/images/brands/fashion-forward.png",
                            status: "active",
                            rating: 4.8
                        },
                        {
                            name: "Beauty Bliss",
                            industry: "Beauty",
                            logo_url: "/images/brands/beauty-bliss.png",
                            status: "active",
                            rating: 4.6
                        },
                        {
                            name: "Lifestyle Luxe",
                            industry: "Lifestyle",
                            logo_url: "/images/brands/lifestyle-luxe.png",
                            status: "active",
                            rating: 4.7
                        }
                    ];

                    sampleBrands.forEach(brand => {
                        brandStmt.run(
                            brand.name,
                            brand.industry,
                            brand.logo_url,
                            brand.status,
                            brand.rating
                        );
                    });

                    // Insert brand categories
                    const brandCategoryStmt = db.prepare(`
                        INSERT INTO brand_categories (
                            brand_id, category
                        ) VALUES (?, ?)
                    `);

                    const sampleBrandCategories = [
                        { brand_id: 1, category: "Fashion" },
                        { brand_id: 1, category: "Lifestyle" },
                        { brand_id: 2, category: "Beauty" },
                        { brand_id: 2, category: "Lifestyle" },
                        { brand_id: 3, category: "Lifestyle" },
                        { brand_id: 3, category: "Fashion" }
                    ];

                    sampleBrandCategories.forEach(category => {
                        brandCategoryStmt.run(
                            category.brand_id,
                            category.category
                        );
                    });
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