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
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ totalDocs: 0, totalPages: 1 });

    useEffect(() => {
        fetchUserData();
        fetchNotifications();
    }, []);

    useEffect(() => {
        fetchAllCustomers();
    }, [searchTerm, page]);

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
            setLoading(true);
            const params = new URLSearchParams({
                search: searchTerm,
                page: page,
                limit: 20
            });

            const response = await fetch(`${API_BASE_URL}/admin/all-customers?${params}`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCustomers(data.customers);
                    if (data.meta) setMeta(data.meta);
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

    // Removed local filter as we use server-side search
    const filteredCustomers = customers;

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

                    {/* Pagination Controls */}
                    {meta.totalPages > 1 && (
                        <div className={styles.pagination} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '15px' }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', cursor: page === 1 ? 'not-allowed' : 'pointer', background: 'white' }}
                            >
                                Previous
                            </button>
                            <span style={{ fontWeight: '500' }}>
                                Page {page} of {meta.totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                disabled={page === meta.totalPages}
                                style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', cursor: page === meta.totalPages ? 'not-allowed' : 'pointer', background: 'white' }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AdminNavbar>
    );
}
