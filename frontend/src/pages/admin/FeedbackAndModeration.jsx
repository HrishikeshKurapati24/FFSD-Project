import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/admin/feedback_and_moderation.module.css';
import adminStyles from '../../styles/admin/admin_dashboard.module.css';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { API_BASE_URL } from '../../services/api';

export default function FeedbackAndModeration() {
    const [user, setUser] = useState({ name: 'Admin' });
    const [feedbacks, setFeedbacks] = useState([]);
    const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        type: 'all',
        userRole: 'all',
        date: ''
    });

    useEffect(() => {
        fetchUserData();
        fetchFeedbacks();
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
        filterFeedbacks();
    }, [filters, feedbacks]);

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

    const fetchFeedbacks = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/feedback_and_moderation`, {
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
                if (data.success && data.feedbacks) {
                    setFeedbacks(data.feedbacks);
                } else if (Array.isArray(data)) {
                    setFeedbacks(data);
                }
            }
        } catch (error) {
            console.error('Error fetching feedbacks:', error);
        }
    };

    const filterFeedbacks = () => {
        let filtered = [...feedbacks];

        // Search text
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(feedback => {
                const subjectMatch = (feedback.subject || feedback.title || '').toLowerCase().includes(searchLower);
                const userMatch = (feedback.userName || feedback.user || '').toLowerCase().includes(searchLower);
                const messageMatch = (feedback.message || feedback.content || '').toLowerCase().includes(searchLower);
                return subjectMatch || userMatch || messageMatch;
            });
        }

        // Status filter
        if (filters.status !== 'all') {
            filtered = filtered.filter(feedback =>
                (feedback.status || 'pending').toLowerCase() === filters.status.toLowerCase()
            );
        }

        // Category filter (type: complaint, suggestion, etc.)
        if (filters.type !== 'all') {
            filtered = filtered.filter(feedback =>
                (feedback.type || 'general').toLowerCase() === filters.type.toLowerCase()
            );
        }

        // User role filter (influencer, brand, customer)
        if (filters.userRole !== 'all') {
            filtered = filtered.filter(feedback =>
                (feedback.userType || '').toLowerCase() === filters.userRole.toLowerCase()
            );
        }

        // Date filter
        if (filters.date) {
            filtered = filtered.filter(feedback => {
                const feedbackDate = feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : feedback.date || '';
                return feedbackDate.includes(filters.date);
            });
        }

        setFilteredFeedbacks(filtered);
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
            type: 'all',
            userRole: 'all',
            date: ''
        });
    };

    const viewFeedback = async (feedbackId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/feedback_and_moderation/${feedbackId}`, {
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
            const feedback = await response.json();

            if (response.ok) {
                setSelectedFeedback(feedback);
                setShowModal(true);
            } else {
                alert('Error loading feedback details: ' + (feedback.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error fetching feedback details:', error);
            alert('Error loading feedback details');
        }
    };

    const resolveFeedback = async (feedbackId) => {
        if (window.confirm('Are you sure you want to mark this feedback as resolved?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/feedback_and_moderation/update/${feedbackId}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ status: 'resolved' })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert('Feedback marked as resolved!');
                    setShowModal(false);
                    fetchFeedbacks();
                } else {
                    alert('Error: ' + (result.message || 'Failed to resolve feedback'));
                }
            } catch (error) {
                console.error('Error resolving feedback:', error);
                alert('Error resolving feedback. Please try again.');
            }
        }
    };

    const deleteFeedback = async (feedbackId) => {
        if (window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/feedback_and_moderation/${feedbackId}`, {
                    method: 'DELETE',
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

                if (response.ok && result.success) {
                    alert('Feedback deleted successfully!');
                    fetchFeedbacks();
                } else {
                    alert('Error: ' + (result.message || 'Failed to delete feedback'));
                }
            } catch (error) {
                console.error('Error deleting feedback:', error);
                alert('Error deleting feedback. Please try again.');
            }
        }
    };

    const stats = {
        total: feedbacks.length,
        pending: feedbacks.filter(f => (f.status || 'pending').toLowerCase() === 'pending').length,
        resolved: feedbacks.filter(f => (f.status || 'pending').toLowerCase() === 'resolved').length
    };

    return (
        <AdminNavbar
            user={user}
            notifications={notifications}
            onMarkAllAsRead={markAllAsRead}
        >
            <main className={adminStyles.mainContent}>
                <section className={styles.feedbackModeration}>
                    <div className={styles.headerSection}>
                        <h1>Feedback & Moderation</h1>
                        <p className={styles.subtitle}>Review and manage user feedback across the platform</p>
                    </div>

                    {/* Stats Cards */}
                    <div className={styles.statsCards}>
                        <div className={`${styles.statCard} ${styles.totalCard}`}>
                            <div className={styles.statIcon}>
                                <i className="fas fa-inbox"></i>
                            </div>
                            <div className={styles.statInfo}>
                                <h3>Total Feedback</h3>
                                <p className={styles.statNumber}>{stats.total}</p>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.pendingCard}`}>
                            <div className={styles.statIcon}>
                                <i className="fas fa-clock"></i>
                            </div>
                            <div className={styles.statInfo}>
                                <h3>Pending</h3>
                                <p className={styles.statNumber}>{stats.pending}</p>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.resolvedCard}`}>
                            <div className={styles.statIcon}>
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <div className={styles.statInfo}>
                                <h3>Resolved</h3>
                                <p className={styles.statNumber}>{stats.resolved}</p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className={styles.filters}>
                        <div className={styles.searchGroup}>
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                id="search-feedback"
                                placeholder="Search subject or user..."
                                title="Search through feedback text"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>

                        <select
                            id="user-role-filter"
                            title="Filter by user who sent the feedback"
                            value={filters.userRole}
                            onChange={(e) => handleFilterChange('userRole', e.target.value)}
                        >
                            <option value="all">All Users</option>
                            <option value="influencer">Influencers</option>
                            <option value="brand">Brands</option>
                            <option value="customer">Customers</option>
                        </select>

                        <select
                            id="status-filter"
                            title="Filter by moderation status"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                        </select>

                        <select
                            id="type-filter"
                            title="Filter by feedback category"
                            value={filters.type}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            <option value="complaint">Complaint</option>
                            <option value="suggestion">Suggestion</option>
                            <option value="bug_report">Bug Report</option>
                            <option value="general">General</option>
                        </select>

                        <input
                            type="date"
                            id="date-filter"
                            title="Filter by creation date"
                            value={filters.date}
                            onChange={(e) => handleFilterChange('date', e.target.value)}
                        />

                        <button id="reset-filters" onClick={resetFilters} title="Clear all filters">
                            <i className="fas fa-sync"></i> Reset
                        </button>
                    </div>

                    {/* Feedback table */}
                    <div className={styles.tableContainer}>
                        {filteredFeedbacks.length > 0 ? (
                            <table className={styles.feedbackTable}>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>User</th>
                                        <th>Type</th>
                                        <th>Subject</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFeedbacks.map((feedback) => (
                                        <tr key={feedback.id || feedback._id}>
                                            <td>#{feedback.id || feedback._id}</td>
                                            <td>{feedback.userName || feedback.user || 'Anonymous'}</td>
                                            <td>{feedback.type || 'General'}</td>
                                            <td>{feedback.subject || feedback.title || 'No Subject'}</td>
                                            <td>
                                                {feedback.createdAt
                                                    ? new Date(feedback.createdAt).toLocaleDateString()
                                                    : feedback.date || 'N/A'}
                                            </td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles[`status${(feedback.status || 'pending').charAt(0).toUpperCase() + (feedback.status || 'pending').slice(1)}`]}`}>
                                                    {(feedback.status || 'pending').charAt(0).toUpperCase() + (feedback.status || 'pending').slice(1)}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className={`${styles.btnAction} ${styles.btnView}`}
                                                    onClick={() => viewFeedback(feedback.id || feedback._id)}
                                                >
                                                    <i className="fas fa-eye"></i> View
                                                </button>
                                                {feedback.status !== 'resolved' && (
                                                    <button
                                                        className={`${styles.btnAction} ${styles.btnResolve}`}
                                                        onClick={() => resolveFeedback(feedback.id || feedback._id)}
                                                    >
                                                        <i className="fas fa-check"></i> Resolve
                                                    </button>
                                                )}
                                                <button
                                                    className={`${styles.btnAction} ${styles.btnDelete}`}
                                                    onClick={() => deleteFeedback(feedback.id || feedback._id)}
                                                >
                                                    <i className="fas fa-trash"></i> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className={styles.noDataMessage}>
                                <i className="fas fa-inbox"></i>
                                <p>No feedback found</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Feedback Details Modal */}
                {showModal && selectedFeedback && (
                    <div className={styles.modal} onClick={(e) => e.target.className === styles.modal && setShowModal(false)}>
                        <div className={styles.modalContent}>
                            <span className={styles.close} onClick={() => setShowModal(false)}>&times;</span>
                            <h2 id="modal-feedback-title">Feedback Details</h2>
                            <div className={styles.modalDetails}>
                                <p><strong>User:</strong> <span>{selectedFeedback.userName || selectedFeedback.user || 'Anonymous'}</span></p>
                                <p><strong>Type:</strong> <span>{selectedFeedback.type || 'General'}</span></p>
                                <p><strong>Subject:</strong> <span>{selectedFeedback.subject || selectedFeedback.title || 'No Subject'}</span></p>
                                <p><strong>Date:</strong> <span>{selectedFeedback.createdAt ? new Date(selectedFeedback.createdAt).toLocaleDateString() : selectedFeedback.date || 'N/A'}</span></p>
                                <p><strong>Status:</strong> <span>{selectedFeedback.status || 'pending'}</span></p>
                                <p><strong>Message:</strong></p>
                                <div className={styles.modalMessage}>
                                    {selectedFeedback.message || selectedFeedback.content || 'No message content'}
                                </div>
                            </div>
                            {selectedFeedback.status !== 'resolved' && (
                                <div className={styles.modalActions}>
                                    <button
                                        className={`${styles.btnAction} ${styles.btnResolve}`}
                                        onClick={() => resolveFeedback(selectedFeedback.id || selectedFeedback._id)}
                                    >
                                        <i className="fas fa-check"></i> Mark as Resolved
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