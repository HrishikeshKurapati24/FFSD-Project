import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';
import styles from '../../styles/admin/customer_management.module.css';
import adminStyles from '../../styles/admin/admin_dashboard.module.css';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { API_BASE_URL } from '../../services/api';

export default function CustomerManagement() {
    const [user, setUser] = useState({ name: 'Admin' });
    const [analytics, setAnalytics] = useState({
        totalCustomers: 0,
        activeCustomers: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        customerGrowth: { labels: [], data: [] },
        purchaseTrends: { labels: [], purchases: [], revenue: [] }
    });
    const [topCustomers, setTopCustomers] = useState([]);
    const [recentCustomers, setRecentCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({ status: 'active', notes: '' });
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState([]);

    const customerGrowthChartRef = useRef(null);
    const purchaseTrendsChartRef = useRef(null);
    const customerGrowthChartInstance = useRef(null);
    const purchaseTrendsChartInstance = useRef(null);

    useEffect(() => {
        fetchUserData();
        fetchCustomerData();
        fetchNotifications();
    }, []);

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

    const markAllAsRead = async () => {
        try {
            // Get current notification IDs
            const notificationIds = notifications
                .map(n => n.id || n._id)
                .filter(Boolean);

            // Store read state in localStorage
            if (notificationIds.length > 0) {
                const existingRead = JSON.parse(localStorage.getItem('readNotifications') || '[]');
                const updatedRead = [...new Set([...existingRead, ...notificationIds])];
                localStorage.setItem('readNotifications', JSON.stringify(updatedRead));
            }

            // Update local state immediately
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));

            // Call backend API
            await fetch(`${API_BASE_URL}/admin/notifications/mark-all-read`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    useEffect(() => {
        if (customerGrowthChartRef.current && analytics.customerGrowth.labels.length > 0) {
            if (customerGrowthChartInstance.current) {
                customerGrowthChartInstance.current.destroy();
            }
            customerGrowthChartInstance.current = new Chart(customerGrowthChartRef.current, {
                type: 'line',
                data: {
                    labels: analytics.customerGrowth.labels,
                    datasets: [{
                        label: 'New Customers',
                        data: analytics.customerGrowth.data,
                        borderColor: '#4285f4',
                        backgroundColor: 'rgba(66, 133, 244, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }, [analytics.customerGrowth]);

    useEffect(() => {
        if (purchaseTrendsChartRef.current && analytics.purchaseTrends.labels.length > 0) {
            if (purchaseTrendsChartInstance.current) {
                purchaseTrendsChartInstance.current.destroy();
            }
            purchaseTrendsChartInstance.current = new Chart(purchaseTrendsChartRef.current, {
                type: 'bar',
                data: {
                    labels: analytics.purchaseTrends.labels,
                    datasets: [{
                        label: 'Purchases',
                        data: analytics.purchaseTrends.purchases,
                        backgroundColor: '#34a853'
                    }, {
                        label: 'Revenue',
                        data: analytics.purchaseTrends.revenue,
                        backgroundColor: '#fbbc04',
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            position: 'left'
                        },
                        y1: {
                            type: 'linear',
                            position: 'right',
                            beginAtZero: true,
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    }
                }
            });
        }
    }, [analytics.purchaseTrends]);

    const fetchUserData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/verify`, {
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
                if (data.authenticated && data.user) {
                    setUser(data.user);
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchCustomerData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/customer-management`, {
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
                if (data.success) {
                    setAnalytics(data.analytics || analytics);
                    setTopCustomers(data.topCustomers || []);
                    setRecentCustomers(data.recentCustomers || []);
                }
            } else {
                // Fallback: try to get analytics separately
                const analyticsResponse = await fetch(`${API_BASE_URL}/admin/customer-analytics`, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
                if (analyticsResponse.ok) {
                    const analyticsData = await analyticsResponse.json();
                    setAnalytics(analyticsData.analytics || analytics);
                }
            }
        } catch (error) {
            console.error('Error fetching customer data:', error);
        }
    };

    const viewCustomerDetails = async (customerId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/customer-details/${customerId}`, {
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
            const result = await response.json();

            if (result.success) {
                setSelectedCustomer(result.customer);
                setShowCustomerModal(true);
            } else {
                alert('Failed to load customer details');
            }
        } catch (error) {
            console.error('Error fetching customer details:', error);
            alert('Failed to load customer details');
        }
    };

    const handleEditCustomer = (customerId) => {
        const customer = recentCustomers.find(c => c._id === customerId) ||
            topCustomers.find(c => c._id === customerId);
        if (customer) {
            setSelectedCustomer(customer);
            setEditFormData({
                status: customer.status || 'active',
                notes: customer.adminNotes || ''
            });
            setShowEditModal(true);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCustomer) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/customer-status/${selectedCustomer._id}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(editFormData)
            });

            if (response.status === 401) {
                window.location.href = '/admin/login';
                return;
            }

            const result = await response.json();

            if (result.success) {
                alert('Customer updated successfully');
                setShowEditModal(false);
                fetchCustomerData();
            } else {
                alert(result.message || 'Failed to update customer');
            }
        } catch (error) {
            console.error('Error updating customer:', error);
            alert('Failed to update customer');
        }
    };

    const handleDeleteCustomer = async (customerId) => {
        if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            try {
                const response = await fetch(`/admin/customer/${customerId}`, {
                    method: 'DELETE'
                });
                const result = await response.json();

                if (result.success) {
                    alert('Customer deleted successfully');
                    fetchCustomerData();
                } else {
                    alert(result.message || 'Failed to delete customer');
                }
            } catch (error) {
                console.error('Error deleting customer:', error);
                alert('Failed to delete customer');
            }
        }
    };

    const exportTopCustomers = () => {
        const data = [
            ['Name', 'Email', 'Total Spent', 'Orders', 'Last Purchase']
        ];

        topCustomers.forEach(customer => {
            data.push([
                customer.name || 'Unknown Customer',
                customer.email || '',
                customer.total_spent?.toString() || '0',
                customer.total_purchases?.toString() || '0',
                customer.last_purchase_date ? new Date(customer.last_purchase_date).toLocaleDateString() : 'Never'
            ]);
        });

        const csv = data.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'top_customers.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const filteredCustomers = recentCustomers.filter(customer => {
        const matchesFilter = statusFilter === 'all' ||
            (customer.status || 'active').toLowerCase().includes(statusFilter.toLowerCase());
        const matchesSearch = searchQuery === '' ||
            Object.values(customer).some(val =>
                val?.toString().toLowerCase().includes(searchQuery.toLowerCase())
            );
        return matchesFilter && matchesSearch;
    });

    return (
        <AdminNavbar
            user={user}
            notifications={notifications}
            onMarkAllAsRead={markAllAsRead}
        >
            <main className={adminStyles.mainContent}>
                <div className={styles.customerManagement}>
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <h1><i className="fas fa-shopping-cart"></i> Customer Management</h1>
                        <p>Monitor and manage customer activities, purchases, and analytics</p>
                    </div>

                    {/* Analytics Cards */}
                    <div className={styles['analytics-grid']}>
                        <div className={styles.analyticsCard}>
                            <div className={styles['card-icon']}>
                                <i className="fas fa-users"></i>
                            </div>
                            <div className={styles.cardContent}>
                                <h3>{analytics.totalCustomers.toLocaleString()}</h3>
                                <p>Total Customers</p>
                            </div>
                        </div>

                        <div className={styles.analyticsCard}>
                            <div className={styles['card-icon']}>
                                <i className="fas fa-user-check"></i>
                            </div>
                            <div className={styles.cardContent}>
                                <h3>{analytics.activeCustomers.toLocaleString()}</h3>
                                <p>Active Customers</p>
                                <span className={styles.trend}>Last 30 days</span>
                            </div>
                        </div>

                        <div className={styles.analyticsCard}>
                            <div className={styles['card-icon']}>
                                <i className="fas fa-dollar-sign"></i>
                            </div>
                            <div className={styles.cardContent}>
                                <h3>${analytics.totalRevenue.toLocaleString()}</h3>
                                <p>Total Revenue</p>
                            </div>
                        </div>

                        <div className={styles.analyticsCard}>
                            <div className={styles['card-icon']}>
                                <i className="fas fa-shopping-bag"></i>
                            </div>
                            <div className={styles.cardContent}>
                                <h3>${analytics.avgOrderValue.toFixed(2)}</h3>
                                <p>Avg Order Value</p>
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className={styles['charts-section']}>
                        <div className={styles.chartContainer}>
                            <h3>Customer Growth</h3>
                            <canvas ref={customerGrowthChartRef}></canvas>
                        </div>
                        <div className={styles.chartContainer}>
                            <h3>Purchase Trends</h3>
                            <canvas ref={purchaseTrendsChartRef}></canvas>
                        </div>
                    </div>

                    {/* Customer Tables Section */}
                    <div className={styles.tablesSection}>
                        {/* Top Customers */}
                        <div className={styles.tableContainer}>
                            <div className={styles['table-header']}>
                                <h3><i className="fas fa-crown"></i> Top Customers</h3>
                                <button className={styles.exportBtn} onClick={exportTopCustomers}>
                                    <i className="fas fa-download"></i> Export
                                </button>
                            </div>
                            <div className={styles.tableWrapper}>
                                <table className={styles['customers-table']}>
                                    <thead>
                                        <tr>
                                            <th>Customer</th>
                                            <th>Email</th>
                                            <th>Total Spent</th>
                                            <th>Orders</th>
                                            <th>Last Purchase</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topCustomers.map(customer => (
                                            <tr key={customer._id}>
                                                <td>
                                                    <div className={styles['customer-info']}>
                                                        <div className={styles['customer-avatar']}>
                                                            {(customer.name || 'C').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{customer.name || 'Unknown Customer'}</span>
                                                    </div>
                                                </td>
                                                <td>{customer.email}</td>
                                                <td className={styles.amount}>${(customer.total_spent || 0).toLocaleString()}</td>
                                                <td>{customer.total_purchases || 0}</td>
                                                <td>{customer.last_purchase_date ? new Date(customer.last_purchase_date).toLocaleDateString() : 'Never'}</td>
                                                <td>
                                                    <button className={`${styles.actionBtn} ${styles.viewBtn}`} onClick={() => viewCustomerDetails(customer._id)}>
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => handleEditCustomer(customer._id)}>
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Customers */}
                        <div className={styles.tableContainer}>
                            <div className={styles['table-header']}>
                                <h3><i className="fas fa-clock"></i> Recent Customers</h3>
                                <div className={styles['table-filters']}>
                                    <select
                                        id="statusFilter"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <input
                                        type="text"
                                        id="searchCustomers"
                                        placeholder="Search customers..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.tableWrapper}>
                                <table className={styles['customers-table']}>
                                    <thead>
                                        <tr>
                                            <th>Customer</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Location</th>
                                            <th>Joined</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCustomers.map(customer => (
                                            <tr key={customer._id} data-customer-id={customer._id}>
                                                <td>
                                                    <div className={styles['customer-info']}>
                                                        <div className={styles['customer-avatar']}>
                                                            {(customer.name || 'C').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{customer.name || 'Unknown Customer'}</span>
                                                    </div>
                                                </td>
                                                <td>{customer.email}</td>
                                                <td>{customer.phone || 'N/A'}</td>
                                                <td>{customer.location || 'N/A'}</td>
                                                <td>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}</td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${styles[customer.status || 'active']}`}>
                                                        {(customer.status || 'active').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className={`${styles.actionBtn} ${styles.viewBtn}`} onClick={() => viewCustomerDetails(customer._id)}>
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => handleEditCustomer(customer._id)}>
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteCustomer(customer._id)}>
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Details Modal */}
                {showCustomerModal && selectedCustomer && (
                    <div className={styles.modal} onClick={(e) => e.target.className === styles.modal && setShowCustomerModal(false)}>
                        <div className={styles.modalContent}>
                            <div className={styles.modalHeader}>
                                <h3><i className="fas fa-user"></i> Customer Details</h3>
                                <span className={styles.close} onClick={() => setShowCustomerModal(false)}>&times;</span>
                            </div>
                            <div className={styles.modalBody}>
                                <div className={styles.customerDetails}>
                                    <div className={styles.detailSection}>
                                        <h4>Basic Information</h4>
                                        <p><strong>Name:</strong> {selectedCustomer.name || 'N/A'}</p>
                                        <p><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</p>
                                        <p><strong>Phone:</strong> {selectedCustomer.phone || 'N/A'}</p>
                                        <p><strong>Location:</strong> {selectedCustomer.location || 'N/A'}</p>
                                    </div>
                                    <div className={styles.detailSection}>
                                        <h4>Purchase History</h4>
                                        <p><strong>Total Spent:</strong> ${(selectedCustomer.total_spent || 0).toLocaleString()}</p>
                                        <p><strong>Total Orders:</strong> {selectedCustomer.total_purchases || 0}</p>
                                        <p><strong>Last Purchase:</strong> {selectedCustomer.last_purchase_date ? new Date(selectedCustomer.last_purchase_date).toLocaleDateString() : 'Never'}</p>
                                    </div>
                                    {selectedCustomer.purchaseHistory && selectedCustomer.purchaseHistory.length > 0 && (
                                        <div className={styles.detailSection}>
                                            <h4>Recent Purchases</h4>
                                            <div className={styles.purchaseList}>
                                                {selectedCustomer.purchaseHistory.map((purchase, idx) => (
                                                    <div key={idx} className={styles.purchaseItem}>
                                                        <span>{purchase.product_id?.name || 'Unknown Product'}</span>
                                                        <span>${purchase.product_id?.campaign_price || 0}</span>
                                                        <span>{new Date(purchase.purchase_date).toLocaleDateString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Customer Modal */}
                {showEditModal && selectedCustomer && (
                    <div className={styles.modal} onClick={(e) => e.target.className === styles.modal && setShowEditModal(false)}>
                        <div className={styles.modalContent}>
                            <div className={styles.modalHeader}>
                                <h3><i className="fas fa-edit"></i> Edit Customer</h3>
                                <span className={styles.close} onClick={() => setShowEditModal(false)}>&times;</span>
                            </div>
                            <div className={styles.modalBody}>
                                <form id="editCustomerForm" onSubmit={handleEditSubmit}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="customerStatus">Status:</label>
                                        <select
                                            id="customerStatus"
                                            name="status"
                                            value={editFormData.status}
                                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="adminNotes">Admin Notes:</label>
                                        <textarea
                                            id="adminNotes"
                                            name="notes"
                                            rows="4"
                                            placeholder="Add notes about this customer..."
                                            value={editFormData.notes}
                                            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                        ></textarea>
                                    </div>
                                    <div className={styles.formActions}>
                                        <button type="button" className={styles.btnSecondary} onClick={() => setShowEditModal(false)}>Cancel</button>
                                        <button type="submit" className={styles.btnPrimary}>Update Customer</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </main>

        </AdminNavbar>
    );
}