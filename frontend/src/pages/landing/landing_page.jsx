import React, { useState } from 'react';
import BrandsModal from '../../components/BrandsModal';
import InfluencersModal from '../../components/InfluencersModal';
import '../../styles/landing_page.css';

const LandingPage = () => {
    const [showBrandsModal, setShowBrandsModal] = useState(false);
    const [showInfluencersModal, setShowInfluencersModal] = useState(false);

    const handleOpenBrandsModal = () => {
        setShowBrandsModal(true);
    };

    const handleOpenInfluencersModal = () => {
        setShowInfluencersModal(true);
    };

    return (
        <div className="landing-page">
            {/* Header */}
            <header>
                <div className="header-container">
                    <div className="logo">CollabSync</div>
                    <nav>
                        <ul>
                            <li><a href="/">Home</a></li>
                            <li><a href="/role-selection">Sign Up</a></li>
                            <li><a href="/signin">Sign In</a></li>
                            <li><a href="/about">About</a></li>
                        </ul>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero">
                <video autoPlay muted loop id="heroVideo">
                    <source src="/Lp_index/Anima_001.mp4" type="video/mp4" />
                </video>
                <div className="hero-content">
                    <h1>Bridging Influencers, Brands & Customers</h1>
                    <p>
                        Your one-stop platform for authentic connections, strategic collaborations,
                        and sustainable growth in the digital ecosystem.
                    </p>
                    <a href="/role-selection" className="btn-hero">Join Us Today</a>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="benefits">
                <h2 className="section-title">Who We Serve</h2>
                <div className="benefits-container">
                    <div className="benefit">
                        <div className="benefit-icon">👑</div>
                        <h2>For Influencers</h2>
                        <p>
                            Showcase your authentic voice and reach to connect with brands that align
                            with your values. Manage campaigns, track performance metrics, and grow
                            your professional network all in one place.
                        </p>
                        <a href="/influencer/Signup" className="button">I'm an Influencer</a>
                    </div>
                    <div className="benefit">
                        <div className="benefit-icon">🏢</div>
                        <h2>For Brands</h2>
                        <p>
                            Discover creators who truly resonate with your brand values and audience.
                            Launch data-driven campaigns, measure ROI with precision, and build lasting
                            relationships with influential voices in your industry.
                        </p>
                        <a href="/brand/Signup" className="button">I'm a Brand</a>
                    </div>
                    <div className="benefit">
                        <div className="benefit-icon">👥</div>
                        <h2>For Customers</h2>
                        <p>
                            Access exclusive deals from your favorite brands and influencers.
                            Participate in interactive live sessions, read authentic reviews,
                            and enjoy a direct line of communication with the creators you trust.
                        </p>
                        <a href="/customer" className="button">I'm a Customer</a>
                    </div>
                </div>
            </section>

            {/* Info Blocks Section */}
            <section className="info-blocks">
                <div className="info-block block-one">
                    <h2>Strategic Growth Through Authentic Connections</h2>
                    <p>
                        Our data-driven platform helps brands find the perfect influencer match
                        based on audience demographics, engagement rates, and content quality.
                        Create more impactful content, measure real campaign results, and scale
                        your reach across multiple channels.
                    </p>
                    <div className="stats">
                        <div className="stat-item">
                            <div className="stat-number">93%</div>
                            <div className="stat-label">Higher Engagement</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">5.2x</div>
                            <div className="stat-label">ROI Increase</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">10K+</div>
                            <div className="stat-label">Active Creators</div>
                        </div>
                    </div>
                </div>
                <div className="info-block block-two">
                    <h2>Full-Service Campaign Management</h2>
                    <p>
                        Our expert team handles every aspect of your influencer campaigns.
                        From strategy development and creator selection to content review,
                        performance tracking, and optimization. We've helped Fortune 500
                        companies and fast-growing e-commerce brands maximize their influencer
                        marketing efforts since 2013.
                    </p>
                    <div className="stats">
                        <div className="stat-item">
                            <div className="stat-number">1.2K+</div>
                            <div className="stat-label">Brands Served</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">15K+</div>
                            <div className="stat-label">Campaigns Managed</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">48hr</div>
                            <div className="stat-label">Average Setup Time</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Three Blocks Section */}
            <section className="three-blocks">
                <div className="block">
                    <div className="block-image">
                        <img src="/Lp_index/pic4-removebg.png" alt="Influencer Marketing" />
                    </div>
                    <div className="block-text">
                        <h2>For Influencers</h2>
                        <p>
                            As an influencer on CollabSync, you gain access to a curated marketplace
                            of brand partnerships that align with your unique voice and audience.
                            Our platform helps you monetize your content while maintaining authenticity
                            and creative control.
                        </p>
                        <ul>
                            <li>Build a comprehensive profile showcasing your metrics and content style</li>
                            <li>Access exclusive brand deals matched to your audience demographics</li>
                            <li>Track campaign performance with detailed analytics</li>
                            <li>Join a community of like-minded creators for collaboration and growth</li>
                        </ul>
                    </div>
                </div>
                <div className="block reverse">
                    <div className="block-image">
                        <img src="/Lp_index/pic66-removebg.png" alt="Brand Partnerships" />
                    </div>
                    <div className="block-text">
                        <h2>For Brands</h2>
                        <p>
                            CollabSync provides brands with a data-driven approach to influencer
                            marketing. Our platform helps you identify the perfect creators based
                            on audience alignment, engagement quality, and proven performance metrics.
                        </p>
                        <ul>
                            <li>Access our network of pre-vetted influencers across all major platforms</li>
                            <li>Launch campaigns with streamlined contract management and payments</li>
                            <li>Track real-time performance metrics and campaign ROI</li>
                            <li>Utilize our AI-powered matching technology for optimal creator partnerships</li>
                        </ul>
                    </div>
                </div>
                <div className="block">
                    <div className="block-image">
                        <img src="/Lp_index/pic7.png" alt="Customer Engagement" />
                    </div>
                    <div className="block-text">
                        <h2>For Customers</h2>
                        <p>
                            As a customer on CollabSync, you're at the heart of a vibrant community
                            connecting you with influencers and brands. Enjoy exclusive offers,
                            authentic content, and direct engagement opportunities.
                        </p>
                        <ul>
                            <li>Access exclusive discounts and promotions from partnered brands</li>
                            <li>Participate in live Q&A sessions with your favorite influencers</li>
                            <li>Read verified reviews and ratings from the community</li>
                            <li>Engage directly with creators for personalized recommendations</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Partners Section */}
            <section className="partners">
                <div className="partners-content">
                    <h2 className="section-title">Marketing Integrations and Social Partners</h2>
                    <div className="partners-description">
                        Collaborate with leading marketing tools and social platforms to amplify
                        your reach and streamline your campaigns. Discover top influencers and
                        brands driving authentic connections.
                    </div>
                    <div className="partners-logos">
                        <div className="partner-logo">
                            <img src="/Lp_index/Brand_logo_01.png" alt="The Sunrise Shop" />
                        </div>
                        <div className="partner-logo">
                            <img src="/Lp_index/Brand_logo_02.jpg" alt="BCBP" />
                        </div>
                        <div className="partner-logo">
                            <img src="/Lp_index/Brand_logo_03.jpg" alt="Horizon" />
                        </div>
                        <div className="partner-logo">
                            <img src="/Lp_index/Brand_logo_05.jpg" alt="Canyon BBQ & Grill" />
                        </div>
                        <div className="partner-logo">
                            <img src="/Lp_index/Brand_logo_06.png" alt="Outrun" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Explore Section */}
            <section className="explore-section">
                <div className="explore-container">
                    <h2 className="section-title">Explore Our Platform</h2>
                    <p className="explore-description">
                        Discover the amazing brands and influencers who are part of our community
                    </p>
                    <div className="explore-buttons">
                        <button className="btn-explore" onClick={handleOpenBrandsModal}>
                            <i className="fas fa-store me-2"></i>View All Brands
                        </button>
                        <button className="btn-explore" onClick={handleOpenInfluencersModal}>
                            <i className="fas fa-users me-2"></i>View All Influencers
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer>
                <div className="footer-logo">CollabSync</div>
                <p>&copy; 2025 CollabSync. All rights reserved.</p>
                <div className="social-media">
                    <img src="/Lp_index/SocialMedia_logo_i.png" alt="Instagram" />
                    <img src="/Lp_index/SocialMedia_logo_y2.png" alt="YouTube" />
                    <img src="/Lp_index/SocialMedia_logo_l.png" alt="LinkedIn" />
                    <img src="/Lp_index/SocialMedia_logo_f3.jpg" alt="Facebook" />
                    <img src="/Lp_index/SocialMedia_logo_t.png" alt="Twitter" />
                </div>
            </footer>

            {/* Modals */}
            <BrandsModal
                isOpen={showBrandsModal}
                onClose={() => setShowBrandsModal(false)}
            />
            <InfluencersModal
                isOpen={showInfluencersModal}
                onClose={() => setShowInfluencersModal(false)}
            />
        </div>
    );
};

export default LandingPage;
