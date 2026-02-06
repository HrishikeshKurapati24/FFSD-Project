import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/admin/collaboration_monitoring.module.css';
import adminStyles from '../../styles/admin/admin_dashboard.module.css';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { API_BASE_URL } from '../../services/api';

export default function CollaborationMonitoring() {
    const [user, setUser] = useState({ name: 'Admin' });
    const [collaborations, setCollaborations] = useState([]);
    const [filteredCollaborations, setFilteredCollaborations] = useState([]);
    const [selectedCollab, setSelectedCollab] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchUserData();
        fetchCollaborations();
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
        filterCollaborations();
    }, [filters, collaborations]);

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

    const fetchCollaborations = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/collaboration_monitoring`, {
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
                if (data.success && data.collaborations) {
                    setCollaborations(data.collaborations);
                } else if (Array.isArray(data)) {
                    setCollaborations(data);
                }
            }
        } catch (error) {
            console.error('Error fetching collaborations:', error);
        }
    };

    const filterCollaborations = () => {
        let filtered = [];

        collaborations.forEach(collab => {
            if (collab.influencers && collab.influencers.length > 0) {
                collab.influencers.forEach(inf => {
                    filtered.push({ ...collab, influencer: inf });
                });
            } else {
                filtered.push(collab);
            }
        });

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(item => {
                const brand = (item.brand || '').toLowerCase();
                const influencer = (item.influencer?.influencer || item.influencer || '').toLowerCase();
                return brand.includes(searchLower) || influencer.includes(searchLower);
            });
        }

        if (filters.status !== 'all') {
            filtered = filtered.filter(item => {
                const itemStatus = (item.status || 'request').toLowerCase();
                const filterStatus = filters.status.toLowerCase();

                if (filterStatus === 'pending') return itemStatus === 'request';
                if (filterStatus === 'in-progress') return itemStatus === 'active';
                if (filterStatus === 'completed') return itemStatus === 'completed';

                return itemStatus === filterStatus;
            });
        }

        if (filters.startDate) {
            filtered = filtered.filter(item => {
                if (!item.startDate) return false;
                const itemDate = new Date(item.startDate);
                const filterDate = new Date(filters.startDate);
                return itemDate >= filterDate;
            });
        }

        if (filters.endDate) {
            filtered = filtered.filter(item => {
                if (!item.endDate) return false;
                const itemDate = new Date(item.endDate);
                const filterDate = new Date(filters.endDate);
                return itemDate <= filterDate;
            });
        }

        setFilteredCollaborations(filtered);
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
            startDate: '',
            endDate: ''
        });
    };

    const openCollabModal = async (collabId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/collaboration_monitoring/${collabId}`, {
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
            const collab = await response.json();

            if (response.ok) {
                setSelectedCollab(collab);
                setShowModal(true);
            } else {
                alert('Error loading collaboration details');
            }
        } catch (error) {
            console.error('Error fetching collaboration details:', error);
            alert('Error loading collaboration details');
        }
    };

    const closeCollabModal = () => {
        setShowModal(false);
        setSelectedCollab(null);
    };

    const approveCollab = async (collabId) => {
        if (window.confirm('Are you sure you want to approve this collaboration?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/collaboration_monitoring/${collabId}/approve`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert('Collaboration approved successfully!');
                    closeCollabModal();
                    fetchCollaborations();
                } else {
                    alert('Error: ' + (result.message || 'Failed to approve collaboration'));
                }
            } catch (error) {
                console.error('Error approving collaboration:', error);
                alert('Error approving collaboration. Please try again.');
            }
        }
    };

    const rejectCollab = async (collabId) => {
        const reason = window.prompt('Please provide a reason for rejection (optional):');

        if (window.confirm('Are you sure you want to reject this collaboration?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/collaboration_monitoring/${collabId}/reject`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ reason: reason || 'No reason provided' })
                });

                if (response.status === 401) {
                    window.location.href = '/admin/login';
                    return;
                }

                const result = await response.json();

                if (response.ok && result.success) {
                    alert('Collaboration rejected successfully!');
                    closeCollabModal();
                    fetchCollaborations();
                } else {
                    alert('Error: ' + (result.message || 'Failed to reject collaboration'));
                }
            } catch (error) {
                console.error('Error rejecting collaboration:', error);
                alert('Error rejecting collaboration. Please try again.');
            }
        }
    };

    return (
        <AdminNavbar
            user={user}
            notifications={notifications}
            onMarkAllAsRead={markAllAsRead}
        >
            <main className={adminStyles.mainContent}>
                <section className={styles.collaborationMonitoring}>
                    <h1>Collaboration Monitoring</h1>

                    {/* Filters */}
                    <div className={styles.filters}>
                        <input
                            type="text"
                            id="search-collabs"
                            placeholder="Search collaborations..."
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
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
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

                    {/* Collaboration Cards */}
                    <div className={styles.collabGrid}>
                        {filteredCollaborations.length > 0 ? (
                            filteredCollaborations.map((item, index) => {
                                const inf = item.influencer || {};
                                const collab = item;
                                return (
                                    <div
                                        key={`${collab.id || collab._id}-${index}`}
                                        className={styles.collabCard}
                                        onClick={() => openCollabModal(collab.id || collab._id)}
                                    >
                                        <div className={styles.collabHeader}>
                                            <h3 className={styles.collabTitle}>
                                                {collab.brand || 'Unknown Brand'}
                                                {inf.influencer && ` & ${inf.influencer}`}
                                            </h3>
                                            <span className={`${styles.statusBadge} ${styles[`status${(collab.status || 'request').charAt(0).toUpperCase() + (collab.status || 'request').slice(1).replace('-', '')}`]}`}>
                                                {(collab.status === 'request' ? 'Pending' : collab.status || 'Pending').toUpperCase()}
                                            </span>
                                        </div>
                                        {inf.influencer ? (
                                            <div className={styles.collabMetrics}>
                                                <p><strong>Engagement Rate:</strong> {inf.engagementRate != null ? `${inf.engagementRate}%` : 'N/A'}</p>
                                                <p><strong>Reach:</strong> {inf.reach != null ? inf.reach.toLocaleString() : 'N/A'}</p>
                                                <p><strong>Start Date:</strong> {collab.startDate ? new Date(collab.startDate).toLocaleDateString() : 'N/A'}</p>
                                                <p><strong>End Date:</strong> {collab.endDate ? new Date(collab.endDate).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                        ) : (
                                            <p className={styles.noDataText}>No influencer data available</p>
                                        )}
                                        <div className={styles.collabActions}>
                                            <button
                                                className={`${styles.btnAction} ${styles.btnView}`}
                                                onClick={(e) => { e.stopPropagation(); openCollabModal(collab.id || collab._id); }}
                                            >
                                                <i className="fas fa-eye"></i> View
                                            </button>
                                            {collab.status === 'pending' && (
                                                <button
                                                    className={`${styles.btnAction} ${styles.btnApprove}`}
                                                    onClick={(e) => { e.stopPropagation(); approveCollab(collab.id || collab._id); }}
                                                >
                                                    <i className="fas fa-check"></i> Approve
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={styles.noDataMessage}>
                                <p>No collaborations found</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Collaboration Details Modal */}
                {showModal && selectedCollab && (
                    <div className={styles.modal} onClick={(e) => e.target.className === styles.modal && closeCollabModal()}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <span className={styles.close} onClick={closeCollabModal}>&times;</span>
                            <h2 id="modal-collab-id">Collaboration Details #{selectedCollab.id || selectedCollab._id || 'N/A'}</h2>
                            <div className={styles.modalDetails}>
                                <div className={styles.detailsGrid}>
                                    <div>
                                        <p><strong>Collaboration ID:</strong> <span>{selectedCollab.id || selectedCollab._id || 'N/A'}</span></p>
                                        <p><strong>Brand:</strong> <span>{selectedCollab.brand || 'N/A'}</span></p>
                                        <p><strong>Influencer:</strong> <span>{selectedCollab.influencer || 'N/A'}</span></p>
                                        <p><strong>Status:</strong> <span className={`${styles.statusBadge} ${styles[`status${(selectedCollab.status || 'request').charAt(0).toUpperCase() + (selectedCollab.status || 'request').slice(1).replace('-', '')}`]}`}>
                                            {selectedCollab.status === 'request' ? 'Pending' : selectedCollab.status || 'Pending'}
                                        </span></p>
                                    </div>
                                    <div>
                                        <p><strong>Start Date:</strong> <span>{selectedCollab.startDate ? new Date(selectedCollab.startDate).toLocaleDateString() : 'N/A'}</span></p>
                                        <p><strong>End Date:</strong> <span>{selectedCollab.endDate ? new Date(selectedCollab.endDate).toLocaleDateString() : 'N/A'}</span></p>
                                        <p><strong>Engagement Rate:</strong> <span>{selectedCollab.engagementRate ? `${selectedCollab.engagementRate}%` : 'N/A'}</span></p>
                                        <p><strong>Reach:</strong> <span>{selectedCollab.reach ? selectedCollab.reach.toLocaleString() : 'N/A'}</span></p>
                                    </div>
                                </div>

                                <div className={styles.collaborationDescription}>
                                    <p><strong>Description:</strong></p>
                                    <div id="modal-description" className={styles.modalDescription}>
                                        {selectedCollab.description || 'No description available'}
                                    </div>
                                </div>

                                <div className={styles.collaborationMetrics}>
                                    <h4>Performance Metrics</h4>
                                    <div className={styles.metricsGrid}>
                                        <div className={styles.metricItem}>
                                            <div className={styles.metricLabel}>Impressions</div>
                                            <div className={styles.metricValue} id="modal-impressions">
                                                {selectedCollab.impressions ? selectedCollab.impressions.toLocaleString() : '-'}
                                            </div>
                                        </div>
                                        <div className={styles.metricItem}>
                                            <div className={styles.metricLabel}>Clicks</div>
                                            <div className={styles.metricValue} id="modal-clicks">
                                                {selectedCollab.clicks ? selectedCollab.clicks.toLocaleString() : '-'}
                                            </div>
                                        </div>
                                        <div className={styles.metricItem}>
                                            <div className={styles.metricLabel}>Conversions</div>
                                            <div className={styles.metricValue} id="modal-conversions">
                                                {selectedCollab.conversions ? selectedCollab.conversions.toLocaleString() : '-'}
                                            </div>
                                        </div>
                                        <div className={styles.metricItem}>
                                            <div className={styles.metricLabel}>ROI</div>
                                            <div className={styles.metricValue} id="modal-roi">
                                                {selectedCollab.roi ? `${selectedCollab.roi}%` : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.collaborationPosts}>
                                    <h4>Posts/Content</h4>
                                    <div id="modal-posts" className={styles.modalPosts}>
                                        {selectedCollab.posts && selectedCollab.posts.length > 0 ? (
                                            selectedCollab.posts.map((post, idx) => (
                                                <div key={idx} className={styles.postItem}>
                                                    <div className={styles.postTitle}>{post.title || 'Untitled Post'}</div>
                                                    <div className={styles.postMeta}>
                                                        <i className="fas fa-calendar"></i> {post.date || 'No date'} |
                                                        <i className="fas fa-heart"></i> {post.engagement || 0} engagements
                                                    </div>
                                                    {post.description && (
                                                        <div className={styles.postDescription}>{post.description}</div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className={styles.noPostsMessage}>
                                                <i className="fas fa-info-circle"></i> No posts available for this collaboration
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                {selectedCollab.status === 'pending' && (
                                    <>
                                        <button
                                            className={`${styles.btnAction} ${styles.btnApprove}`}
                                            id="modal-approve-btn"
                                            onClick={() => approveCollab(selectedCollab.id || selectedCollab._id)}
                                        >
                                            <i className="fas fa-check"></i> Approve Collaboration
                                        </button>
                                        <button
                                            className={`${styles.btnAction} ${styles.btnReject}`}
                                            id="modal-reject-btn"
                                            onClick={() => rejectCollab(selectedCollab.id || selectedCollab._id)}
                                        >
                                            <i className="fas fa-times"></i> Reject Collaboration
                                        </button>
                                    </>
                                )}
                                <button
                                    className={`${styles.btnAction} ${styles.btnSecondary}`}
                                    onClick={closeCollabModal}
                                >
                                    <i className="fas fa-times"></i> Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </AdminNavbar>
    );
}