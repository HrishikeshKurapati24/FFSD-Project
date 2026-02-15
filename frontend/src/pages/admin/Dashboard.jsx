import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';
import styles from '../../styles/admin/dashboard.module.css';
import adminStyles from '../../styles/admin/admin_dashboard.module.css';
import { API_BASE_URL } from '../../services/api';
import AdminNavbar from '../../components/admin/AdminNavbar';

export default function Dashboard() {
    const [user, setUser] = useState({ name: 'Admin' });
    const [dashboardData, setDashboardData] = useState({
        stats: [],
        totalSoldQuantity: 0,
        avgProductPrice: 0,
        totalProducts: 0,
        totalRevenue: 0,
        revenueGrowth: 0,
        activeCollabs: 0,
        avgDealSize: 0,
        recentTransactions: [],
        analytics: [],
        topBrands: [],
        topInfluencers: [],
        notifications: []
    });
    const [darkMode, setDarkMode] = useState(false);

    const chartRefs = useRef({});

    useEffect(() => {
        fetchUserData();
        fetchDashboardData();
        fetchNotifications();
        const savedDarkMode = localStorage.getItem('darkMode') === 'enabled';
        setDarkMode(savedDarkMode);
        if (savedDarkMode) {
            document.body.classList.add('dark-mode');
        }

        // Refresh notifications every 30 seconds
        const notificationsInterval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(notificationsInterval);
    }, []);

    useEffect(() => {
        if (dashboardData.analytics && dashboardData.analytics.length > 0) {
            initializeCharts();
        }
    }, [dashboardData.analytics]);

    const fetchUserData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/verify`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            // Handle 401 (Unauthorized) - user is not authenticated, this is expected
            if (response.status === 401) {
                // User is not authenticated, redirect to login
                window.location.href = '/admin/login';
                return;
            }

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && data.user) {
                    setUser(data.user);
                }
            } else {
                // Handle other error statuses
                const errorData = await response.json().catch(() => ({ message: 'Failed to fetch user data' }));
                console.error('Error fetching user data:', errorData.message);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            // Handle 401 (Unauthorized) - user is not authenticated, redirect to login
            if (response.status === 401) {
                window.location.href = '/admin/login';
                return;
            }

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setDashboardData(data);
                }
            } else {
                // Handle other error statuses
                const errorData = await response.json().catch(() => ({ message: 'Failed to fetch dashboard data' }));
                console.error('Error fetching dashboard data:', errorData.message);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.status === 401) {
                window.location.href = '/admin/login';
                return;
            }

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.notifications) {
                    // Get read notifications from localStorage
                    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');

                    // Mark notifications as read if they're in the read list
                    const updatedNotifications = data.notifications.map(n => ({
                        ...n,
                        read: readNotifications.includes(n.id || n._id) || n.read
                    }));

                    setDashboardData(prev => ({
                        ...prev,
                        notifications: updatedNotifications
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const initializeCharts = () => {
        dashboardData.analytics.forEach((metric) => {
            const canvasId = metric.chartId;
            if (!canvasId) return;

            const canvas = document.getElementById(canvasId);
            if (!canvas) return;

            // Destroy existing chart if it exists
            if (chartRefs.current[canvasId]) {
                chartRefs.current[canvasId].destroy();
            }

            const chartConfig = {
                type: metric.type || 'line',
                data: {
                    labels: metric.labels || [],
                    datasets: [{
                        label: metric.title || '',
                        data: metric.values || [],
                        backgroundColor: metric.type === 'doughnut' || metric.type === 'pie'
                            ? ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                            : 'rgba(75, 192, 192, 0.5)',
                        borderColor: metric.type === 'line' || metric.type === 'bar'
                            ? 'rgba(75, 192, 192, 1)'
                            : undefined,
                        borderWidth: 1,
                        fill: metric.type === 'line'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: metric.type !== 'bar'
                        }
                    }
                }
            };

            chartRefs.current[canvasId] = new Chart(canvas, chartConfig);
        });
    };

    const markAllAsRead = async () => {
        try {
            // Get current notification IDs
            const currentNotifications = dashboardData.notifications || [];
            const notificationIds = currentNotifications
                .map(n => n.id || n._id)
                .filter(Boolean);

            // Store read state in localStorage
            if (notificationIds.length > 0) {
                const existingRead = JSON.parse(localStorage.getItem('readNotifications') || '[]');
                const updatedRead = [...new Set([...existingRead, ...notificationIds])];
                localStorage.setItem('readNotifications', JSON.stringify(updatedRead));
            }

            // Update local state immediately for better UX
            setDashboardData(prev => ({
                ...prev,
                notifications: (prev.notifications || []).map(n => ({ ...n, read: true }))
            }));

            // Call backend API to mark all as read
            const response = await fetch(`${API_BASE_URL}/admin/notifications/mark-all-read`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.status === 401) {
                window.location.href = '/admin/login';
                return;
            }

            if (!response.ok) {
                console.error('Error marking notifications as read');
            }
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        if (newDarkMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'disabled');
        }
    };

    return (
        <AdminNavbar
            user={user}
            notifications={dashboardData.notifications || []}
            onMarkAllAsRead={markAllAsRead}
        >
            {/* Main Content */}
            <div className={adminStyles.mainContent} id="main-content">
                <h1>Welcome, {user.name || user.username || 'Admin'}</h1>
                <p>Let's get to work! Here are some key metrics and analytics to help you manage the platform effectively.</p>

                <div className={styles.statsContainer}>
                    {/* Product Metrics Section */}
                    <div className={styles.dashboardCard}>
                        <h3>Total Products Sold</h3>
                        <p>{dashboardData.totalSoldQuantity.toLocaleString()}</p>
                        <p>Units sold across all campaigns</p>
                    </div>
                    <div className={styles.dashboardCard}>
                        <h3>Average Product Price</h3>
                        <p>${dashboardData.avgProductPrice.toFixed(2)}</p>
                        <p>Average price across {dashboardData.totalProducts} products</p>
                    </div>

                    {dashboardData.stats.filter(stat => stat.label !== "Total Revenue").map((stat, index) => (
                        <div key={index} className={styles.dashboardCard}>
                            <p>{stat.label}</p>
                            <h2>
                                {stat.value}
                                {stat.growth && (
                                    <span className={`${styles.badge} ${styles[stat.color || 'green']}`}>
                                        {stat.growth}
                                    </span>
                                )}
                            </h2>
                            <p>{stat.description}</p>
                        </div>
                    ))}
                </div>

                <div className={styles.analyticsContainer}>
                    <h2>Revenue Analytics</h2>
                    <div className={styles.analyticsGrid}>
                        <div className={styles.analyticsCard}>
                            <h3>Commission Overview</h3>
                            <div className={styles.commissionStats}>
                                <div className={styles.statItem}>
                                    <span className={styles.label}>Total Revenue</span>
                                    <span className={styles.value}>${dashboardData.totalRevenue.toLocaleString()}</span>
                                    <span className={`${styles.growth} ${dashboardData.revenueGrowth >= 0 ? styles.positive : styles.negative}`}>
                                        <i className={`fas fa-${dashboardData.revenueGrowth >= 0 ? 'arrow-up' : 'arrow-down'}`}></i>
                                        {Math.abs(dashboardData.revenueGrowth || 0).toFixed(1)}%
                                    </span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.label}>Active Collaborations</span>
                                    <span className={styles.value}>{dashboardData.activeCollabs}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.label}>Average Deal Size</span>
                                    <span className={styles.value}>${dashboardData.avgDealSize.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className={`${styles.analyticsCard} ${styles.transactionsCard}`}>
                            <h3>Recent Transactions</h3>
                            <div className={styles.transactionsTable}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Collaboration</th>
                                            <th>Amount</th>
                                            <th>Commission</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboardData.recentTransactions.slice(0, 5).map((transaction, index) => (
                                            <tr key={index}>
                                                <td>{transaction.date || 'N/A'}</td>
                                                <td>{transaction.collab || 'N/A'}</td>
                                                <td>${(transaction.amount || 0).toLocaleString()}</td>
                                                <td>${((transaction.amount || 0) * 0.05).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.analyticsContainer}>
                    <h2>Performance Analytics Dashboard</h2>
                    <div className={styles.analyticsGrid}>
                        {dashboardData.analytics.map((metric) => (
                            <div key={metric.chartId} className={styles.analyticsCard}>
                                <h3>{metric.title}</h3>
                                <canvas id={metric.chartId}></canvas>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Brands and Influencers Section */}
                <div className={styles.analyticsContainer}>
                    <h2>Top Performers</h2>
                    <div className={styles.analyticsGrid}>
                        <div className={`${styles.analyticsCard} ${styles.topPerformerCard}`}>
                            <h3>Top Brands by Revenue</h3>
                            <div className={styles.topPerformersList}>
                                {dashboardData.topBrands && dashboardData.topBrands.length > 0 ? (
                                    dashboardData.topBrands.map((brand, index) => (
                                        <div key={index} className={styles.performerItem}>
                                            <div className={styles.rank}>#{index + 1}</div>
                                            <div className={styles.performerInfo}>
                                                <div className={styles.name}>{brand.name || 'Unknown Brand'}</div>
                                                <div className={styles.stats}>
                                                    <span className={styles.revenue}>${(brand.totalRevenue || 0).toLocaleString()}</span>
                                                    <span className={styles.deals}>{brand.dealCount || 0} deals</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.noData}>No brand data available</div>
                                )}
                            </div>
                        </div>
                        <div className={`${styles.analyticsCard} ${styles.topPerformerCard}`}>
                            <h3>Top Influencers by Audience</h3>
                            <div className={styles.topPerformersList}>
                                {dashboardData.topInfluencers && dashboardData.topInfluencers.length > 0 ? (
                                    dashboardData.topInfluencers.map((influencer, index) => (
                                        <div key={index} className={styles.performerItem}>
                                            <div className={styles.rank}>#{index + 1}</div>
                                            <div className={styles.performerInfo}>
                                                <div className={styles.name}>{influencer.displayName || 'Unknown Influencer'}</div>
                                                <div className={styles.stats}>
                                                    <span className={styles.audience}>{(influencer.audienceSize || 0).toLocaleString()} followers</span>
                                                    <span className={styles.category}>{influencer.categories ? influencer.categories.join(', ') : 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.noData}>No influencer data available</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Links Section */}
                <div className={styles.dashboardLinksContainer}>
                    <h2>Detailed Analytics Dashboards</h2>
                    <div className={styles.dashboardLinks}>
                        <Link to="/admin/brand-analytics" className={styles.dashboardLink}>
                            <i className="fas fa-building"></i>
                            <h3>Brand Analytics</h3>
                            <p>Detailed analysis of brand performance, engagement, and ROI metrics</p>
                        </Link>
                        <Link to="/admin/influencer-analytics" className={styles.dashboardLink}>
                            <i className="fas fa-star"></i>
                            <h3>Influencer Analytics</h3>
                            <p>Comprehensive insights into influencer performance and campaign success</p>
                        </Link>
                        <Link to="/admin/campaign-analytics" className={styles.dashboardLink}>
                            <i className="fas fa-users"></i>
                            <h3>Campaign Analytics</h3>
                            <p>In-depth analysis of campaign performance, engagement, and ROI metrics</p>
                        </Link>
                        <Link to="/admin/product-analytics" className={styles.dashboardLink}>
                            <i className="fas fa-box-open"></i>
                            <h3>Product Analytics</h3>
                            <p>Track product sales, revenue, and performance across all campaigns</p>
                        </Link>
                    </div>
                </div>

                {/* Overall User Details Section */}
                <div className={styles.dashboardLinksContainer}>
                    <h2>Overall User Details</h2>
                    <div className={styles.dashboardLinks}>
                        <Link to="/admin/brand-list" className={styles.dashboardLink}>
                            <i className="fas fa-building"></i>
                            <h3>Brands</h3>
                            <p>View all verified brands on the platform</p>
                        </Link>
                        <Link to="/admin/influencer-list" className={styles.dashboardLink}>
                            <i className="fas fa-star"></i>
                            <h3>Influencers</h3>
                            <p>View all verified influencers on the platform</p>
                        </Link>
                        <Link to="/admin/customer-list" className={styles.dashboardLink}>
                            <i className="fas fa-user-friends"></i>
                            <h3>Customers</h3>
                            <p>View all customers joined on the platform</p>
                        </Link>
                    </div>
                </div>
            </div>
        </AdminNavbar>
    );
}