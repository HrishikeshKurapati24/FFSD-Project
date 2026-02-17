import React, { useState, useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import AdminNavbar from '../../../components/admin/AdminNavbar';
import { API_BASE_URL } from '../../../services/api';
import styles from '../../../styles/admin/AdvancedAnalytics.module.css';
import adminStyles from '../../../styles/admin/admin_dashboard.module.css';
import OrderDetailsModal from '../../../components/shared/OrderDetailsModal';

export default function AdvancedAnalytics() {
    const [user, setUser] = useState({ name: 'Admin' });
    const [campaignRevenueData, setCampaignRevenueData] = useState([]);
    const [brands, setBrands] = useState([]);
    const [matchmakingResults, setMatchmakingResults] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState('');
    const [ecosystemData, setEcosystemData] = useState(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [orderAnalytics, setOrderAnalytics] = useState(null);
    const [allOrders, setAllOrders] = useState([]);
    const [orderSearch, setOrderSearch] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notifications, setNotifications] = useState([]);

    const networkRef = useRef(null);
    const networkContainerRef = useRef(null);
    const graphRef = networkContainerRef; // Alias for consistency

    // Fetch user data for auth
    useEffect(() => {
        fetchUserData();
        fetchNotifications();
    }, []);

    // Fetch all analytics data
    useEffect(() => {
        fetchCampaignRevenue();
        fetchBrands();
        fetchEcosystemData();
        fetchAllOrders();
    }, []);

    // Re-fetch order analytics when date range changes
    useEffect(() => {
        fetchOrderAnalytics();
    }, [dateRange]);

    // Initialize network graph when ecosystem data is loaded
    useEffect(() => {
        if (ecosystemData && networkContainerRef.current) {
            initializeNetworkGraph();
        }

        return () => {
            if (networkRef.current) {
                networkRef.current.destroy();
                networkRef.current = null;
            }
        };
    }, [ecosystemData]);

    const fetchUserData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/verify`, {
                credentials: 'include'
            });

            if (response.status === 401) {
                window.location.href = '/admin/login';
                return;
            }

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated && data.user) {
                    setUser(data.user);
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.notifications) {
                    setNotifications(data.notifications);
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchCampaignRevenue = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/analytics/campaign-revenue`, {
                credentials: 'include'
            });

            if (response.status === 401) {
                window.location.href = '/admin/login';
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setCampaignRevenueData(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching campaign revenue data:', error);
            setError('Failed to load campaign revenue data');
        }
    };

    const fetchBrands = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/verified-brands`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.brands) {
                    setBrands(data.brands);
                }
            }
        } catch (error) {
            console.error('Error fetching brands:', error);
        }
    };

    const fetchMatchmaking = async (brandId) => {
        if (!brandId) {
            setMatchmakingResults([]);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/analytics/matchmaking/${brandId}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setMatchmakingResults(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching matchmaking data:', error);
            setError('Failed to load matchmaking recommendations');
        }
    };

    const fetchOrderAnalytics = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (dateRange.start) queryParams.append('startDate', dateRange.start);
            if (dateRange.end) queryParams.append('endDate', dateRange.end);

            const response = await fetch(`${API_BASE_URL}/admin/orders/analytics?${queryParams.toString()}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setOrderAnalytics(data.analytics);
                }
            }
        } catch (error) {
            console.error('Error fetching order analytics:', error);
        }
    };

    const fetchAllOrders = async (searchTerm = '', status = 'all') => {
        setLoadingOrders(true);
        try {
            const queryParams = new URLSearchParams();
            if (searchTerm) queryParams.append('searchTerm', searchTerm);
            if (status && status !== 'all') queryParams.append('status', status);

            const response = await fetch(`${API_BASE_URL}/admin/orders/all?${queryParams.toString()}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setAllOrders(data.orders);
                }
            }
        } catch (error) {
            console.error('Error fetching all orders:', error);
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleOrderSearch = (val) => {
        setOrderSearch(val);
        // Debounce fetch
        const timeoutId = setTimeout(() => {
            fetchAllOrders(val, orderStatusFilter);
        }, 500);
        return () => clearTimeout(timeoutId);
    };

    const handleStatusFilter = (status) => {
        setOrderStatusFilter(status);
        fetchAllOrders(orderSearch, status);
    };

    const fetchEcosystemData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/analytics/ecosystem`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setEcosystemData(data.data);
            }
        } catch (error) {
            console.error('Error fetching ecosystem data:', error);
            setError('Failed to load ecosystem graph');
        } finally {
            setLoading(false);
        }
    };

    const handleBrandChange = (e) => {
        const brandId = e.target.value;
        setSelectedBrand(brandId);
        fetchMatchmaking(brandId);
    };

    const initializeNetworkGraph = () => {
        if (!networkContainerRef.current || !ecosystemData) return;

        if (networkRef.current) {
            networkRef.current.destroy();
        }

        const data = {
            nodes: ecosystemData.nodes || [],
            edges: ecosystemData.edges || ecosystemData.links || []
        };

        const options = {
            nodes: {
                shape: 'dot',
                size: 20,
                font: { size: 14, color: '#333' },
                borderWidth: 2,
                shadow: true
            },
            groups: {
                brand: { color: { background: '#4FC3F7', border: '#03A9F4' }, shape: 'dot' },
                influencer: { color: { background: '#BA68C8', border: '#9C27B0' }, shape: 'dot' }
            },
            edges: {
                width: 2,
                color: { color: '#848484', highlight: '#2B7CE9', inherit: false },
                smooth: { type: 'continuous' }
            },
            physics: {
                enabled: true,
                barnesHut: { gravitationalConstant: -2000, centralGravity: 0.3, springLength: 150, springConstant: 0.04 },
                stabilization: { iterations: 150 }
            },
            interaction: { hover: true, tooltipDelay: 100, zoomView: true, dragView: true }
        };

        networkRef.current = new Network(networkContainerRef.current, data, options);
    };

    return (
        <AdminNavbar user={user} notifications={notifications}>
            <div className={adminStyles.mainContent}>
                <div className={styles.header}>
                    <h1>🚀 Advanced Analytics</h1>
                    <p>Deep insights into campaign performance, matchmaking intelligence, and ecosystem visualization</p>
                </div>

                {/* Dashboard Stats Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h2>📈 Platform Performance</h2>
                            <p>Real-time overview of orders, revenue, and fulfillment efficiency</p>
                        </div>
                        <div className={styles.dateRangeContainer}>
                            <div className={styles.dateInputGroup}>
                                <span className={styles.dateLabel}>From</span>
                                <input
                                    type="date"
                                    className={styles.dateInput}
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                />
                            </div>
                            <div className={styles.dateInputGroup}>
                                <span className={styles.dateLabel}>To</span>
                                <input
                                    type="date"
                                    className={styles.dateInput}
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                />
                            </div>
                            <button
                                className={styles.resetButton}
                                onClick={() => setDateRange({ start: '', end: '' })}
                                title="Reset Range"
                            >
                                <i className="fas fa-undo"></i>
                            </button>
                        </div>
                    </div>

                    {orderAnalytics ? (
                        <>
                            <div className={styles.statsGrid}>
                                <div className={styles.metricCard}>
                                    <div className={styles.metricHeader}>
                                        <span className={styles.metricTitle}>Gross Revenue</span>
                                        <i className={`fas fa-dollar-sign ${styles.revenueIcon}`}></i>
                                    </div>
                                    <div className={styles.metricContent}>
                                        <div className={styles.metricValue}>${orderAnalytics.revenue.total.toLocaleString()}</div>
                                        <div className={styles.metricLabel}>
                                            <span className="text-success fw-bold">Today:</span> ${orderAnalytics.revenue.today.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.metricCard}>
                                    <div className={styles.metricHeader}>
                                        <span className={styles.metricTitle}>Total Orders</span>
                                        <i className={`fas fa-shopping-cart ${styles.orderIcon}`}></i>
                                    </div>
                                    <div className={styles.metricContent}>
                                        <div className={styles.metricValue}>{orderAnalytics.orders.total.toLocaleString()}</div>
                                        <div className={styles.metricLabel}>
                                            <span className="text-primary fw-bold">This Month:</span> {orderAnalytics.orders.thisMonth.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.metricCard}>
                                    <div className={styles.metricHeader}>
                                        <span className={styles.metricTitle}>Fulfillment Rate</span>
                                        <i className={`fas fa-truck-loading ${styles.fulfillmentIcon}`}></i>
                                    </div>
                                    <div className={styles.metricContent}>
                                        <div className={styles.metricValue}>{orderAnalytics.fulfillmentRate.toFixed(1)}%</div>
                                        <div className={styles.scoreBar} style={{ width: '100%', marginTop: '0.5rem' }}>
                                            <div
                                                className={styles.scoreProgress}
                                                style={{ width: `${orderAnalytics.fulfillmentRate}%`, backgroundColor: '#e65100' }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.analyticsRow}>
                                <div className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <h3>🏆 Top Brands by Order Volume</h3>
                                    </div>
                                    <div className={styles.tableContainer}>
                                        <table className={styles.roiTable}>
                                            <thead>
                                                <tr>
                                                    <th>Rank</th>
                                                    <th>Brand Name</th>
                                                    <th>Orders</th>
                                                    <th>Revenue</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderAnalytics.ordersPerBrand.map((brand, index) => (
                                                    <tr key={brand.brandId}>
                                                        <td className={styles.rank}>
                                                            <span className={styles.rankBadge}>#{index + 1}</span>
                                                        </td>
                                                        <td>{brand.brandName}</td>
                                                        <td className="fw-bold">{brand.orderCount}</td>
                                                        <td className={styles.revenue}>${brand.totalRevenue.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <h3>🔔 Order Status Breakdown</h3>
                                    </div>
                                    <div className={styles.statusPillGrid}>
                                        <div className={styles.statusPill}>
                                            <span>Paid</span>
                                            <span className={`${styles.statusBadge} ${styles.badgePaid}`}>{orderAnalytics.statusBreakdown.paid}</span>
                                        </div>
                                        <div className={styles.statusPill}>
                                            <span>Shipped</span>
                                            <span className={`${styles.statusBadge} ${styles.badgeShipped}`}>{orderAnalytics.statusBreakdown.shipped}</span>
                                        </div>
                                        <div className={styles.statusPill}>
                                            <span>Delivered</span>
                                            <span className={`${styles.statusBadge} ${styles.badgeDelivered}`}>{orderAnalytics.statusBreakdown.delivered}</span>
                                        </div>
                                        <div className={styles.statusPill}>
                                            <span>Cancelled</span>
                                            <span className={`${styles.statusBadge} ${styles.badgeCancelled}`}>{orderAnalytics.statusBreakdown.cancelled}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.loadingState}>
                            <i className="fas fa-spinner fa-spin"></i>
                            <p>Loading platform metrics...</p>
                        </div>
                    )}
                </div>

                {/* Campaign Revenue Leaderboard Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>🏆 Campaign Revenue Leaderboard</h2>
                        <p>Top performing marketing campaigns ranked by gross revenue</p>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.tableContainer}>
                            <table className={styles.roiTable}>
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Campaign Title</th>
                                        <th>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaignRevenueData.length > 0 ? (
                                        campaignRevenueData.map((campaign, index) => (
                                            <tr key={index}>
                                                <td className={styles.rank}>
                                                    <span className={styles.rankBadge}>#{index + 1}</span>
                                                </td>
                                                <td className={styles.influencerInfo}>
                                                    <div className={styles.influencerName}>{campaign.title}</div>
                                                </td>
                                                <td className={styles.revenue}>${campaign.revenue.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="text-center py-4 text-muted">No campaign revenue data available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Full Order History Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2>📦 Platform Order History</h2>
                            <p>Complete record of all customer purchases across all brands</p>
                        </div>
                        <div className="d-flex gap-3">
                            <div className="input-group input-group-sm" style={{ width: '250px' }}>
                                <span className="input-group-text bg-white border-end-0">
                                    <i className="fas fa-search text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0"
                                    placeholder="Search ID, Name, Tracking..."
                                    value={orderSearch}
                                    onChange={(e) => handleOrderSearch(e.target.value)}
                                />
                            </div>
                            <select
                                className="form-select form-select-sm"
                                style={{ width: '150px' }}
                                value={orderStatusFilter}
                                onChange={(e) => handleStatusFilter(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="paid">Paid</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Destination</th>
                                        <th>Products</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingOrders ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <i className="fas fa-spinner fa-spin fa-2x mb-3 text-primary"></i>
                                                <p className="text-muted">Fetching platform orders...</p>
                                            </td>
                                        </tr>
                                    ) : allOrders.length > 0 ? (
                                        allOrders.map(order => (
                                            <tr
                                                key={order._id}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setShowOrderModal(true);
                                                }}
                                            >
                                                <td>
                                                    <span className="text-monospace small">#{order._id.substring(order._id.length - 8)}</span>
                                                    <div className="text-muted small">{order.tracking_number || 'No tracking'}</div>
                                                </td>
                                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="fw-bold">{order.customer_id?.name || order.guest_info?.name || 'Guest'}</div>
                                                    <div className="text-muted small">{order.customer_id?.email || order.guest_info?.email}</div>
                                                    <div className="text-muted small">
                                                        <i className="fas fa-phone-alt me-1" style={{ fontSize: '0.75em' }}></i>
                                                        {order.customer_id?.phone || order.guest_info?.phone || 'N/A'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="fw-bold text-dark">
                                                        {order.shipping_address?.city ? `${order.shipping_address.city}, ${order.shipping_address.country || ''}` : 'Digital/Service'}
                                                    </div>
                                                    <div className="text-muted small">{order.shipping_address?.address_line1 || ''}</div>
                                                </td>
                                                <td>
                                                    {order.items.reduce((acc, item) => acc + (item.quantity || 0), 0)} items
                                                    <div className="text-muted small" style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {order.items.map(i => i.product_id?.name).join(', ')}
                                                    </div>
                                                </td>
                                                <td className="fw-bold text-dark">${order.total_amount.toLocaleString()}</td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${styles['badge' + order.status.charAt(0).toUpperCase() + order.status.slice(1)]}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-5">
                                                <div className="text-muted">No platform orders found.</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Matchmaking Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>🤝 AI Brand-Influencer Matchmaking</h2>
                        <p>Intelligent compatibility scoring for optimal collaborations</p>
                    </div>

                    <div className={styles.matchmakingTool}>
                        <label>Select Brand for Recommendations:</label>
                        <div className={styles.selectWrapper}>
                            <select
                                className={styles.brandSelect}
                                value={selectedBrand}
                                onChange={handleBrandChange}
                            >
                                <option value="">-- Choose a Verified Brand --</option>
                                {brands.map(brand => (
                                    <option key={brand._id} value={brand._id} style={{ color: 'black' }}>{brand.brandName}</option>
                                ))}
                            </select>
                        </div>
                    </div>


                    {matchmakingResults.length > 0 && (
                        <div className={styles.matchmakingResults}>
                            <h3>Top Compatible Influencers</h3>
                            <div className={styles.recommendationGrid}>
                                {matchmakingResults.map((match, idx) => (
                                    <div
                                        key={idx}
                                        className={`${styles.matchCard} ${match.score >= 80 ? styles.perfectMatchCard : ''}`}
                                    >
                                        <div className={styles.matchHeader}>
                                            <div className={styles.influencerAvatar}>
                                                <img
                                                    src={match.influencer?.profilePicUrl || '/images/default-profile.jpg'}
                                                    alt={match.influencer?.fullName || match.influencer?.username}
                                                />
                                            </div>
                                            <div className={styles.matchInfo}>
                                                <h4>{match.influencer?.fullName || match.influencer?.username}</h4>
                                                <div className={styles.matchScore}>
                                                    <span className={styles.scoreLabel}>Match Score:</span>
                                                    <div className={styles.matchProgress}>
                                                        <div
                                                            className={styles.matchProgressBar}
                                                            style={{
                                                                width: `${match.score}%`,
                                                                backgroundColor: match.score > 85 ? '#4CAF50' : '#FF9800'
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className={styles.scoreValue}>{match.score}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.matchCriteria}>
                                            {match.matchReasons?.map((reason, rIdx) => (
                                                <span
                                                    key={rIdx}
                                                    className={`${styles.criteriaBadge} ${match.score >= 80 ? styles.categoryBadge : ''}`}
                                                >
                                                    {reason}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Ecosystem Graph Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>🕸️ Collab Ecosystem</h2>
                        <p>Interactive visualization of brands, influencers, and product distribution networks</p>
                    </div>
                    <div className={styles.whiteCard}>
                        {ecosystemData ? (
                            <div
                                ref={networkContainerRef}
                                className={styles.graphContainer}
                                style={{ height: '600px', borderRadius: '12px' }}
                            />
                        ) : (
                            <div className={styles.loadingState}>
                                <i className="fas fa-spinner fa-spin"></i>
                                <p>Mapping ecosystem nodes...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Details Modal Integration */}
                {selectedOrder && (
                    <OrderDetailsModal
                        show={showOrderModal}
                        onClose={() => setShowOrderModal(false)}
                        order={selectedOrder}
                        userRole="admin"
                    />
                )}
            </div>
        </AdminNavbar>
    );
}
