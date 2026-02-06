import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/admin/payment_verification.module.css';
import adminStyles from '../../styles/admin/admin_dashboard.module.css';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { API_BASE_URL } from '../../services/api';

export default function PaymentVerification() {
    const [user, setUser] = useState({ name: 'Admin' });
    const [payments, setPayments] = useState([]);
    const [filteredPayments, setFilteredPayments] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [categories, setCategories] = useState([]);

    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        paymentMethod: 'all',
        collabType: 'all',
        influencerCategory: 'all',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchUserData();
        fetchPayments();
        fetchNotifications();
        fetchCategories();
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

                    setNotifications(updatedNotifications);
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
        filterPayments();
    }, [filters, payments]);

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

    const fetchPayments = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/payment_verification`, {
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
                if (data.success && data.payments) {
                    setPayments(data.payments);
                } else if (Array.isArray(data)) {
                    setPayments(data);
                }
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/payment_verification/categories`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.categories) {
                    setCategories(data.categories);
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const filterPayments = () => {
        let filtered = [...payments];

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(payment => {
                const text = Object.values(payment).join(' ').toLowerCase();
                return text.includes(searchLower);
            });
        }

        if (filters.status !== 'all') {
            filtered = filtered.filter(payment =>
                (payment.status || '').toLowerCase() === filters.status.toLowerCase()
            );
        }

        if (filters.paymentMethod !== 'all') {
            filtered = filtered.filter(payment =>
                (payment.paymentMethod || payment.payment_method || '').toLowerCase() === filters.paymentMethod.toLowerCase()
            );
        }

        if (filters.collabType !== 'all') {
            filtered = filtered.filter(payment =>
                (payment.collabType || payment.collab_type || '').toLowerCase() === filters.collabType.toLowerCase()
            );
        }

        if (filters.influencerCategory !== 'all') {
            filtered = filtered.filter(payment => {
                const paymentCategory = (payment.influencerCategory || payment.influencer_category || '');
                // Handle both single string and array (though in table it's likely a string mapped from backend)
                if (Array.isArray(paymentCategory)) {
                    return paymentCategory.some(cat => cat.toLowerCase() === filters.influencerCategory.toLowerCase());
                }
                return paymentCategory.toLowerCase() === filters.influencerCategory.toLowerCase();
            });
        }

        if (filters.startDate) {
            filtered = filtered.filter(payment => {
                const paymentDate = payment.date || payment.payment_date || '';
                return paymentDate >= filters.startDate;
            });
        }

        if (filters.endDate) {
            filtered = filtered.filter(payment => {
                const paymentDate = payment.date || payment.payment_date || '';
                return paymentDate <= filters.endDate;
            });
        }

        setFilteredPayments(filtered);
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            status: 'all',
            paymentMethod: 'all',
            collabType: 'all',
            influencerCategory: 'all',
            startDate: '',
            endDate: ''
        });
    };

    const viewPayment = async (transactionId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/payment_verification/${transactionId}`, {
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
            const payment = await response.json();

            if (response.ok) {
                setSelectedPayment(payment);
                setShowModal(true);
            } else {
                alert('Error loading payment details: ' + (payment.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error fetching payment details:', error);
            alert('Error loading payment details');
        }
    };

    const approvePayment = async (transactionId) => {
        if (window.confirm('Are you sure you want to approve this payment?')) {
            await updatePaymentStatus(transactionId, 'approved');
        }
    };

    const rejectPayment = async (transactionId) => {
        const reason = window.prompt('Please provide a reason for rejection:');
        if (reason && window.confirm('Are you sure you want to reject this payment?')) {
            await updatePaymentStatus(transactionId, 'rejected', reason);
        }
    };

    const updatePaymentStatus = async (transactionId, status, reason = null) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/payment_verification/update`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    id: transactionId,
                    status: status,
                    reason: reason
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(`Payment #${transactionId} ${status} successfully!`);
                setShowModal(false);
                fetchPayments();
            } else {
                alert('Error: ' + (result.message || `Failed to ${status} payment`));
            }
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Error updating payment. Please try again.');
        }
    };

    return (
        <AdminNavbar
            user={user}
            notifications={notifications}
            onMarkAllAsRead={markAllAsRead}
        >
            <main className={adminStyles.mainContent}>
                <section className={styles.paymentVerification}>
                    <h1>Payment Verification</h1>

                    {/* Filters */}
                    <div className={styles.filters}>
                        <input
                            type="text"
                            id="search-payments"
                            placeholder="Search transactions..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                        <select
                            id="status-filter"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="failed">Failed</option>
                        </select>
                        <select
                            id="payment-method-filter"
                            value={filters.paymentMethod}
                            onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                        >
                            <option value="all">All Payment Methods</option>
                            <option value="credit-card">Credit Card</option>
                            <option value="paypal">PayPal</option>
                            <option value="bank-transfer">Bank Transfer</option>
                        </select>
                        <select
                            id="collab-type-filter"
                            value={filters.collabType}
                            onChange={(e) => handleFilterChange('collabType', e.target.value)}
                        >
                            <option value="all">All Collaboration Types</option>
                            <option value="paid">Paid</option>
                            <option value="sponsored">Sponsored</option>
                            <option value="giveaway">Giveaway</option>
                        </select>
                        <select
                            id="influencer-category-filter"
                            value={filters.influencerCategory}
                            onChange={(e) => handleFilterChange('influencerCategory', e.target.value)}
                        >
                            <option value="all">All Influencer Categories</option>
                            {categories.map(category => (
                                <option key={category} value={category.toLowerCase()}>
                                    {category}
                                </option>
                            ))}
                        </select>
                        <input
                            type="date"
                            id="start-date-filter"
                            placeholder="Start Date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        />
                        <input
                            type="date"
                            id="end-date-filter"
                            placeholder="End Date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        />
                        <button id="reset-filters" onClick={resetFilters}>
                            <i className="fas fa-sync"></i> Reset Filters
                        </button>
                    </div>

                    {/* Payment table */}
                    <div className={styles.paymentTable}>
                        {filteredPayments.length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Transaction ID</th>
                                        <th>Date</th>
                                        <th>Brand</th>
                                        <th>Influencer</th>
                                        <th>Category</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.map((payment) => (
                                        <tr key={payment.transactionId || payment.id || payment._id}>
                                            <td>{payment.transactionId || payment.id || 'N/A'}</td>
                                            <td>{payment.date || payment.payment_date || 'N/A'}</td>
                                            <td>{payment.brand || 'Unknown Brand'}</td>
                                            <td>{payment.influencer || 'Unknown Influencer'}</td>
                                            <td>
                                                {(Array.isArray(payment.influencerCategory)
                                                    ? payment.influencerCategory.join(', ')
                                                    : (payment.influencerCategory || 'N/A'))}
                                            </td>
                                            <td>${payment.amount ? payment.amount.toLocaleString() : '0'}</td>
                                            <td>
                                                <span className={`${styles.status} ${styles[payment.status || 'pending']}`}>
                                                    {payment.status || 'pending'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className={`${styles.btnAction} ${styles.btnView}`}
                                                    onClick={() => viewPayment(payment.transactionId || payment.id)}
                                                >
                                                    <i className="fas fa-eye"></i> View
                                                </button>
                                                {payment.status === 'pending' && (
                                                    <>
                                                        <button
                                                            className={`${styles.btnAction} ${styles.btnApprove}`}
                                                            onClick={() => approvePayment(payment.transactionId || payment.id)}
                                                        >
                                                            <i className="fas fa-check"></i> Approve
                                                        </button>
                                                        <button
                                                            className={`${styles.btnAction} ${styles.btnReject}`}
                                                            onClick={() => rejectPayment(payment.transactionId || payment.id)}
                                                        >
                                                            <i className="fas fa-times"></i> Reject
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className={styles.noDataMessage}>
                                <p>No payments found</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Payment Details Modal */}
                {showModal && selectedPayment && (
                    <div className={styles.modal} onClick={(e) => e.target.className === styles.modal && setShowModal(false)}>
                        <div className={styles.modalContent}>
                            <span className={styles.close} onClick={() => setShowModal(false)}>&times;</span>
                            <h2 id="modal-payment-title">Payment Details</h2>
                            <div className={styles.modalDetails}>
                                <p><strong>Transaction ID:</strong> <span>{selectedPayment.transactionId || selectedPayment.id || 'N/A'}</span></p>
                                <p><strong>Brand:</strong> <span>{selectedPayment.brand || 'N/A'}</span></p>
                                <p><strong>Influencer:</strong> <span>{selectedPayment.influencer || 'N/A'}</span></p>
                                <p><strong>Category:</strong> <span>
                                    {Array.isArray(selectedPayment.influencerCategory)
                                        ? selectedPayment.influencerCategory.join(', ')
                                        : (selectedPayment.influencerCategory || 'N/A')}
                                </span></p>
                                <p><strong>Amount:</strong> <span>{selectedPayment.amount ? `$${selectedPayment.amount.toLocaleString()}` : 'N/A'}</span></p>
                                <p><strong>Payment Method:</strong> <span>{selectedPayment.paymentMethod || selectedPayment.payment_method || 'N/A'}</span></p>
                                <p><strong>Date:</strong> <span>{selectedPayment.date || selectedPayment.payment_date || 'N/A'}</span></p>
                                <p><strong>Status:</strong> <span>{selectedPayment.status || 'N/A'}</span></p>
                                <p><strong>Collaboration Type:</strong> <span>{selectedPayment.collabType || selectedPayment.collab_type || 'N/A'}</span></p>
                                <p><strong>Description:</strong> <span>{selectedPayment.description || 'No description available'}</span></p>
                            </div>
                            {selectedPayment.status === 'pending' && (
                                <div className={styles.modalActions}>
                                    <button
                                        className={`${styles.btnAction} ${styles.btnApprove}`}
                                        onClick={() => {
                                            approvePayment(selectedPayment.transactionId || selectedPayment.id);
                                        }}
                                    >
                                        <i className="fas fa-check"></i> Approve Payment
                                    </button>
                                    <button
                                        className={`${styles.btnAction} ${styles.btnReject}`}
                                        onClick={() => {
                                            rejectPayment(selectedPayment.transactionId || selectedPayment.id);
                                        }}
                                    >
                                        <i className="fas fa-times"></i> Reject Payment
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </AdminNavbar>
    );
}