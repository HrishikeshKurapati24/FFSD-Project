import React, { useState, useEffect } from 'react';
import styles from '../../styles/admin/CustomerList.module.css';
import adminStyles from '../../styles/admin/admin_dashboard.module.css';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { API_BASE_URL } from '../../services/api';

export default function CustomerList() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({ name: 'Admin' });
    const [notifications, setNotifications] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUserData();
        fetchAllCustomers();
        fetchNotifications();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/verify`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) setUser(data.user);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchAllCustomers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/all-customers`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCustomers(data.customers);
                }
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) setNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const filteredCustomers = customers.filter(cust =>
        (cust.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cust.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminNavbar user={user} notifications={notifications}>
            <div className={adminStyles.mainContent}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1>All Customers</h1>
                        <div className={styles.searchBar}>
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className={styles.loader}>Loading...</div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Email</th>
                                        <th>Joined Date</th>
                                        <th>Total Spent</th>
                                        <th>Total Purchases</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.length > 0 ? (
                                        filteredCustomers.map((cust) => (
                                            <tr key={cust._id}>
                                                <td>
                                                    <div className={styles.custInfo}>
                                                        <div className={styles.avatar}>
                                                            {(cust.name || 'C').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className={styles.custName}>{cust.name}</span>
                                                    </div>
                                                </td>
                                                <td>{cust.email}</td>
                                                <td>{cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : 'N/A'}</td>
                                                <td>${(cust.total_spent || 0).toLocaleString()}</td>
                                                <td>{cust.total_purchases || 0}</td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${styles[cust.status?.toLowerCase()] || styles.active}`}>
                                                        {cust.status || 'Active'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className={styles.noData}>No customers found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdminNavbar>
    );
}
