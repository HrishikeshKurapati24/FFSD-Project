import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/product_analytics.module.css';
import adminStyles from '../../styles/admin/admin_dashboard.module.css';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { API_BASE_URL } from '../../services/api';

const ProductAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState({ name: 'Admin' });

    useEffect(() => {
        fetchUserData();
        fetchProductAnalytics();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/verify`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await response.json();
            if (data.authenticated && data.user) {
                setUser({ name: data.user.username || 'Admin' });
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchProductAnalytics = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/product-analytics`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to fetch product analytics');

            const data = await response.json();
            if (data.success) {
                setAnalytics(data.analytics);
            } else {
                setError(data.message || 'Failed to load analytics');
            }
        } catch (err) {
            console.error('Error fetching product analytics:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <AdminNavbar user={user}>
            <div className={styles.loadingContainer}>
                <i className="fas fa-circle-notch fa-spin fa-3x"></i>
                <p>Loading analytics data...</p>
            </div>
        </AdminNavbar>
    );

    if (error) return (
        <AdminNavbar user={user}>
            <div className={styles.errorContainer}>
                <i className="fas fa-exclamation-circle fa-3x"></i>
                <p>{error}</p>
                <button onClick={fetchProductAnalytics} className="btn btn-primary">Retry</button>
            </div>
        </AdminNavbar>
    );

    return (
        <AdminNavbar user={user}>
            <main className={adminStyles.mainContent}>
                <button type="button" onClick={() => window.history.back()} className={styles.backButton}>
                    ← Go Back
                </button>
                <div className={styles.pageHeader}>
                    <h1>Product Analytics</h1>
                    <p className={styles.welcomeText}>Track sales performance across all products</p>
                </div>

                {analytics && (
                    <>
                        {/* Summary Cards */}
                        <div className={styles.metricsOverview}>
                            <div className={styles.metricCard}>
                                <div className={styles.statIcon} style={{ background: '#e0f2fe', color: '#0284c7' }}>
                                    <i className="fas fa-box-open"></i>
                                </div>
                                <div className={styles.statInfo}>
                                    <h3>Total Sold</h3>
                                    <p className={styles.metricValue}>{analytics.totalProductsSold?.toLocaleString() || 0}</p>
                                    <span className={styles.statLabel}>Units across all campaigns</span>
                                </div>
                            </div>

                            <div className={styles.metricCard}>
                                <div className={styles.statIcon} style={{ background: '#dcfce7', color: '#16a34a' }}>
                                    <i className="fas fa-dollar-sign"></i>
                                </div>
                                <div className={styles.statInfo}>
                                    <h3>Total Revenue</h3>
                                    <p className={styles.metricValue}>${analytics.totalRevenueEarned?.toLocaleString() || 0}</p>
                                    <span className={styles.statLabel}>Generated from sales</span>
                                </div>
                            </div>

                            <div className={styles.metricCard}>
                                <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
                                    <i className="fas fa-chart-line"></i>
                                </div>
                                <div className={styles.statInfo}>
                                    <h3>Avg. Revenue</h3>
                                    <p className={styles.metricValue}>
                                        ${analytics.products?.length > 0
                                            ? Math.round(analytics.totalRevenueEarned / analytics.products.length).toLocaleString()
                                            : 0}
                                    </p>
                                    <span className={styles.statLabel}>Per product</span>
                                </div>
                            </div>
                        </div>

                        {/* Top Products Table */}
                        <div className={styles.productsTableContainer}>
                            <div className={styles.tableHeader}>
                                <h3>Product Performance</h3>
                            </div>
                            <div className={styles.tableContainer}>
                                <table className={styles.productsTable}>
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Category</th>
                                            <th>Brand</th>
                                            <th>Price</th>
                                            <th>Units Sold</th>
                                            <th>Revenue</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.products && analytics.products.length > 0 ? (
                                            analytics.products
                                                .filter(product => product.category !== 'Uncategorized')
                                                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                                                .map(product => (
                                                    <tr key={product.id}>
                                                        <td>
                                                            <div className={styles.productInfo}>
                                                                <img
                                                                    src={product.image}
                                                                    alt={product.name}
                                                                    className={styles.productImage}
                                                                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/default-product.png' }}
                                                                />
                                                                <span className={styles.productName}>{product.name}</span>
                                                            </div>
                                                        </td>
                                                        <td>{product.category || 'N/A'}</td>
                                                        <td>{product.brand || 'N/A'}</td>
                                                        <td>${product.price?.toLocaleString() || 0}</td>
                                                        <td>{product.totalSold?.toLocaleString() || 0}</td>
                                                        <td className={styles.revenueCell}>${product.totalRevenue?.toLocaleString() || 0}</td>
                                                        <td>
                                                            <span className={`${styles.statusBadge} ${product.status === 'active' ? styles.statusActive : (product.status === 'out_of_stock' ? styles.statusOutOfStock : styles.statusInactive)}`}>
                                                                {product.status?.replace(/_/g, ' ') || 'unknown'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center p-5 text-muted">No product data available.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </AdminNavbar>
    );
};

export default ProductAnalytics;
