import React from 'react';
import styles from '../../styles/landing/about.module.css';
import LandingNavbar from '../../components/landing/LandingNavbar';
import LandingFooter from '../../components/landing/LandingFooter';

const About = () => {
    return (
        <div className={styles['about-page']}>
            <LandingNavbar />

            {/* Hero Section */}
            <section className={styles['about-hero']}>
                <div className={styles['hero-content']}>
                    <h1>About CollabSync</h1>
                    <p>Connecting Brands and Influencers for Successful Collaborations</p>
                </div>
            </section>

            {/* Main Content */}
            <main className={styles['about-content']}>
                <section className={styles['about-section']}>
                    <h2>Our Mission</h2>
                    <p>
                        <strong>CollabSync</strong> is revolutionizing the way brands and influencers collaborate. Our platform bridges
                        the gap between these two dynamic forces, creating a seamless ecosystem for meaningful partnerships that drive
                        growth and engagement.
                    </p>
                </section>

                <section className={styles['about-section']}>
                    <h2>What We Offer</h2>
                    <div className={styles['features-grid']}>
                        <div className={styles['feature-card']}>
                            <i className="fas fa-building"></i>
                            <h3>For Brands</h3>
                            <ul>
                                <li>Create and manage collaborations</li>
                                <li>Browse influencer profiles</li>
                                <li>Track campaign analytics</li>
                                <li>Handle influencer requests</li>
                            </ul>
                        </div>

                        <div className={styles['feature-card']}>
                            <i className="fas fa-user-circle"></i>
                            <h3>For Influencers</h3>
                            <ul>
                                <li>Discover relevant collaborations</li>
                                <li>Showcase your portfolio</li>
                                <li>Track performance metrics</li>
                                <li>Manage campaign progress</li>
                            </ul>
                        </div>

                        <div className={styles['feature-card']}>
                            <i className="fas fa-chart-line"></i>
                            <h3>Analytics & Insights</h3>
                            <ul>
                                <li>Real-time performance tracking</li>
                                <li>Engagement metrics</li>
                                <li>ROI analysis</li>
                                <li>Audience insights</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className={styles['about-section']}>
                    <h2>Why Choose CollabSync?</h2>
                    <div className={styles['benefits-container']}>
                        <div className={styles.benefit}>
                            <i className="fas fa-bolt"></i>
                            <h3>Efficiency</h3>
                            <p>Streamline your collaboration process with our intuitive platform</p>
                        </div>
                        <div className={styles.benefit}>
                            <i className="fas fa-shield-alt"></i>
                            <h3>Trust</h3>
                            <p>Verified profiles and secure transactions for peace of mind</p>
                        </div>
                        <div className={styles.benefit}>
                            <i className="fas fa-chart-pie"></i>
                            <h3>Growth</h3>
                            <p>Data-driven insights to maximize your campaign success</p>
                        </div>
                    </div>
                </section>

                {/* Subscription Plans Section */}
                <section className={styles['about-section']}>
                    <h2>📋 Subscription Plans</h2>
                    <div className={styles['subscription-plans-container']}>
                        <div className={styles['plans-intro']}>
                            <p>Choose the perfect plan for your needs. We offer flexible subscription options for both brands and influencers.</p>
                        </div>

                        {/* Brands Plans */}
                        <div className={styles['plans-section']}>
                            <h3 className={styles['plans-section-title']}>For Brands</h3>
                            <div className={styles['plans-grid']}>
                                <div className={styles['plan-card']}>
                                    <div className={styles['plan-header']}>
                                        <h4>Free Plan</h4>
                                        <div className={styles['plan-price']}>$0<span>/month</span></div>
                                    </div>
                                    <ul className={styles['plan-features']}>
                                        <li>2 campaigns</li>
                                        <li>2 influencer connections</li>
                                        <li>Basic analytics</li>
                                        <li>Collaboration tools</li>
                                    </ul>
                                </div>

                                <div className={`${styles['plan-card']} ${styles.popular}`}>
                                    <div className={styles['popular-badge']}>Most Popular</div>
                                    <div className={styles['plan-header']}>
                                        <h4>Basic Plan</h4>
                                        <div className={styles['plan-price']}>$29<span>/month</span></div>
                                        <div className={styles['plan-yearly']}>$290/year</div>
                                    </div>
                                    <ul className={styles['plan-features']}>
                                        <li>5 campaigns</li>
                                        <li>10 influencer connections</li>
                                        <li>Basic analytics</li>
                                        <li>Collaboration tools</li>
                                    </ul>
                                </div>

                                <div className={styles['plan-card']}>
                                    <div className={styles['plan-header']}>
                                        <h4>Premium Plan</h4>
                                        <div className={styles['plan-price']}>$99<span>/month</span></div>
                                        <div className={styles['plan-yearly']}>$990/year</div>
                                    </div>
                                    <ul className={styles['plan-features']}>
                                        <li>Unlimited campaigns</li>
                                        <li>Unlimited influencer connections</li>
                                        <li>Basic analytics</li>
                                        <li>Advanced analytics</li>
                                        <li>Priority support</li>
                                        <li>Custom branding</li>
                                        <li>Collaboration tools</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Influencers Plans */}
                        <div className={styles['plans-section']}>
                            <h3 className={styles['plans-section-title']}>For Influencers</h3>
                            <div className={styles['plans-grid']}>
                                <div className={styles['plan-card']}>
                                    <div className={styles['plan-header']}>
                                        <h4>Free Plan</h4>
                                        <div className={styles['plan-price']}>$0<span>/month</span></div>
                                    </div>
                                    <ul className={styles['plan-features']}>
                                        <li>2 brand connections</li>
                                        <li>Basic analytics</li>
                                        <li>Collaboration tools</li>
                                    </ul>
                                </div>

                                <div className={`${styles['plan-card']} ${styles.popular}`}>
                                    <div className={styles['popular-badge']}>Most Popular</div>
                                    <div className={styles['plan-header']}>
                                        <h4>Basic Plan</h4>
                                        <div className={styles['plan-price']}>$19<span>/month</span></div>
                                        <div className={styles['plan-yearly']}>$190/year</div>
                                    </div>
                                    <ul className={styles['plan-features']}>
                                        <li>5 brand connections</li>
                                        <li>Basic analytics</li>
                                        <li>Collaboration tools</li>
                                    </ul>
                                </div>

                                <div className={styles['plan-card']}>
                                    <div className={styles['plan-header']}>
                                        <h4>Premium Plan</h4>
                                        <div className={styles['plan-price']}>$49<span>/month</span></div>
                                        <div className={styles['plan-yearly']}>$490/year</div>
                                    </div>
                                    <ul className={styles['plan-features']}>
                                        <li>Unlimited brand connections</li>
                                        <li>Basic analytics</li>
                                        <li>Advanced analytics</li>
                                        <li>Priority support</li>
                                        <li>Custom branding</li>
                                        <li>Collaboration tools</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Key Features */}
                        <div className={styles['key-features']}>
                            <h3>Key Features</h3>
                            <div className={styles['features-list']}>
                                <div className={styles['feature-item']}>
                                    <i className="fas fa-check-circle"></i>
                                    <span>3 plans only (Free, Basic, Premium) - Pro plan removed</span>
                                </div>
                                <div className={styles['feature-item']}>
                                    <i className="fas fa-check-circle"></i>
                                    <span>Payment system - Full payment form with card validation</span>
                                </div>
                                <div className={styles['feature-item']}>
                                    <i className="fas fa-check-circle"></i>
                                    <span>Expiry alerts - Warns 7 days before subscription expires</span>
                                </div>
                                <div className={styles['feature-item']}>
                                    <i className="fas fa-check-circle"></i>
                                    <span>Limit enforcement - Blocks campaign creation when limit reached</span>
                                </div>
                                <div className={styles['feature-item']}>
                                    <i className="fas fa-check-circle"></i>
                                    <span>Auto-downgrade - Switches to Free plan when subscription expires</span>
                                </div>
                                <div className={styles['feature-item']}>
                                    <i className="fas fa-check-circle"></i>
                                    <span>Dashboard integration - Shows current plan and usage in dashboard</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles['about-section']}>
                    <h2>Our Pricing</h2>
                    <div className={styles['pricing-info']}>
                        <p>We believe in fair and transparent pricing:</p>
                        <ul>
                            <li><strong>5%</strong> commission on transactions below $1000</li>
                            <li><strong>1%</strong> commission on transactions above $1000</li>
                        </ul>
                    </div>
                </section>
            </main>

            <LandingFooter />
        </div>
    );
};

export default About;