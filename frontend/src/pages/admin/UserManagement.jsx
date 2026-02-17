import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/admin/user_management.module.css';
import adminStyles from '../../styles/admin/admin_dashboard.module.css';
import AdminNavbar from '../../components/admin/AdminNavbar';
import { API_BASE_URL } from '../../services/api';

export default function UserManagement() {
    const [user, setUser] = useState({ name: 'Admin' });
    const [activeTab, setActiveTab] = useState('verifyRegistrations');
    const [influencers, setInfluencers] = useState([]);
    const [brands, setBrands] = useState([]);
    const [flaggedContent, setFlaggedContent] = useState([]);
    const [suspiciousUsers, setSuspiciousUsers] = useState([]);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [selectedInfluencer, setSelectedInfluencer] = useState(null);
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [showInfluencerModal, setShowInfluencerModal] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // Filter states for flagged content
    const [flaggedFilters, setFlaggedFilters] = useState({
        search: '',
        contentType: 'all',
        severity: 'all'
    });

    // Filter states for suspicious activity
    const [suspiciousFilters, setSuspiciousFilters] = useState({
        search: '',
        activityType: 'all',
        riskLevel: 'all'
    });

    useEffect(() => {
        fetchUserData();
        fetchUserManagementData();
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

    const fetchUserManagementData = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/user_management`, {
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
                    if (data.influencers) setInfluencers(data.influencers);
                    if (data.brands) setBrands(data.brands);
                    if (data.flaggedContent) setFlaggedContent(data.flaggedContent);
                    if (data.suspiciousUsers) setSuspiciousUsers(data.suspiciousUsers);
                }
            }
        } catch (error) {
            console.error('Error fetching user management data:', error);
        }
    };

    const viewBrandProfile = async (brandId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/user_management/brand/${brandId}`, {
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

            const brand = await response.json();

            if (response.ok) {
                setSelectedBrand(brand);
                setShowBrandModal(true);
            } else {
                alert('Error loading brand profile: ' + (brand.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error fetching brand profile:', error);
            alert('Error loading brand profile');
        }
    };

    const viewInfluencerProfile = async (influencerId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/user_management/influencer/${influencerId}`, {
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

            const influencer = await response.json();

            if (response.ok) {
                setSelectedInfluencer(influencer);
                setShowInfluencerModal(true);
            } else {
                alert('Error loading influencer profile: ' + (influencer.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error fetching influencer profile:', error);
            alert('Error loading influencer profile');
        }
    };

    const approveUser = async (id, userType) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/user_management/approve/${id}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ userType })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(`${userType.charAt(0).toUpperCase() + userType.slice(1)} approved successfully!`);
                setShowBrandModal(false);
                setShowInfluencerModal(false);
                fetchUserManagementData();
            } else {
                alert(`Error: ${result.message || 'Failed to approve user'}`);
            }
        } catch (error) {
            console.error('Error approving user:', error);
            alert('Error approving user. Please try again.');
        }
    };

    const approveFlaggedContent = async (contentId) => {
        if (window.confirm('Are you sure you want to approve this content?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/user_management/flagged/${contentId}/approve`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert('Content approved successfully!');
                    fetchUserManagementData();
                } else {
                    alert('Error: ' + (result.message || 'Failed to approve content'));
                }
            } catch (error) {
                console.error('Error approving content:', error);
                alert('Error approving content. Please try again.');
            }
        }
    };

    const removeFlaggedContent = async (contentId) => {
        if (window.confirm('Are you sure you want to remove this content? This action cannot be undone.')) {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/user_management/flagged/${contentId}/remove`, {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert('Content removed successfully!');
                    fetchUserManagementData();
                } else {
                    alert('Error: ' + (result.message || 'Failed to remove content'));
                }
            } catch (error) {
                console.error('Error removing content:', error);
                alert('Error removing content. Please try again.');
            }
        }
    };

    const warnUser = async (userId) => {
        const warning = window.prompt('Please provide a warning message:');
        if (warning && window.confirm('Are you sure you want to send this warning?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/user_management/warn/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ warning })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert('Warning sent successfully!');
                } else {
                    alert('Error: ' + (result.message || 'Failed to send warning'));
                }
            } catch (error) {
                console.error('Error sending warning:', error);
                alert('Error sending warning. Please try again.');
            }
        }
    };

    const investigateUser = async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/user_management/investigate/${userId}`, {
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

            const investigation = await response.json();

            if (response.ok) {
                let details = `Investigation Report for User: ${investigation.userName || userId}\n\n`;
                details += `Account Created: ${investigation.accountCreated || 'N/A'}\n`;
                details += `Last Login: ${investigation.lastLogin || 'N/A'}\n`;
                details += `Total Posts: ${investigation.totalPosts || 0}\n`;
                details += `Total Reports: ${investigation.totalReports || 0}\n`;
                details += `Verification Status: ${investigation.verified ? 'Verified' : 'Unverified'}\n\n`;
                details += `Recent Activity:\n${investigation.recentActivity || 'No recent suspicious activity'}\n\n`;
                details += `Risk Assessment: ${investigation.riskLevel || 'Medium'}`;

                alert(details);
            } else {
                alert('Error loading investigation details');
            }
        } catch (error) {
            console.error('Error investigating user:', error);
            alert('Error loading investigation details');
        }
    };

    const suspendUser = async (userId) => {
        const reason = window.prompt('Please provide a reason for suspension:');
        if (reason && window.confirm('Are you sure you want to suspend this user?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/user_management/suspend/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ reason })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert('User suspended successfully!');
                    fetchUserManagementData();
                } else {
                    alert('Error: ' + (result.message || 'Failed to suspend user'));
                }
            } catch (error) {
                console.error('Error suspending user:', error);
                alert('Error suspending user. Please try again.');
            }
        }
    };

    const whitelistActivity = async (activityId) => {
        if (window.confirm('Are you sure you want to mark this activity as safe?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/user_management/whitelist/${activityId}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert('Activity marked as safe!');
                    fetchUserManagementData();
                } else {
                    alert('Error: ' + (result.message || 'Failed to whitelist activity'));
                }
            } catch (error) {
                console.error('Error whitelisting activity:', error);
                alert('Error whitelisting activity. Please try again.');
            }
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

    const handleLogout = () => {
        window.location.href = '/admin/logout';
    };

    const filteredFlaggedContent = flaggedContent.filter(content => {
        const matchesSearch = flaggedFilters.search === '' ||
            Object.values(content).some(val => val?.toString().toLowerCase().includes(flaggedFilters.search.toLowerCase()));
        const matchesType = flaggedFilters.contentType === 'all' ||
            (content.type || '').toLowerCase() === flaggedFilters.contentType.toLowerCase();
        const matchesSeverity = flaggedFilters.severity === 'all' ||
            (content.severity || 'medium').toLowerCase() === flaggedFilters.severity.toLowerCase();
        return matchesSearch && matchesType && matchesSeverity;
    });

    const filteredSuspiciousActivity = suspiciousUsers.filter(activity => {
        const matchesSearch = suspiciousFilters.search === '' ||
            Object.values(activity).some(val => val?.toString().toLowerCase().includes(suspiciousFilters.search.toLowerCase()));
        const matchesType = suspiciousFilters.activityType === 'all' ||
            (activity.type || '').toLowerCase().includes(suspiciousFilters.activityType.toLowerCase().replace('_', ' '));
        const matchesRisk = suspiciousFilters.riskLevel === 'all' ||
            (activity.riskLevel || 'medium').toLowerCase() === suspiciousFilters.riskLevel.toLowerCase();
        return matchesSearch && matchesType && matchesRisk;
    });

    return (
        <AdminNavbar user={user} notifications={notifications} onMarkAllAsRead={markAllAsRead}>
            {/* Main Content */}
            <div className={adminStyles.mainContent}>
                <div className={styles.container}>
                    <h1>User Management</h1>

                    {/* Tabs */}
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'verifyRegistrations' ? styles.active : ''}`}
                            onClick={() => setActiveTab('verifyRegistrations')}
                        >
                            Verify Registrations
                        </button>
                    </div>

                    {/* Verify Registrations Tab */}
                    {activeTab === 'verifyRegistrations' && (
                        <div className={styles.tabContent}>
                            <h2>Verify Registrations</h2>

                            {/* Influencer Registrations */}
                            <h3>Influencer Registrations</h3>
                            {influencers.length > 0 ? (
                                <div className={styles.tableContainer}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Influencer Name</th>
                                                <th>Email</th>
                                                <th>Category</th>
                                                <th>Social Media Handles</th>
                                                <th>Audience Size</th>
                                                <th>Verified</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {influencers.map((influencer) => (
                                                <tr key={influencer._id || influencer.id}>
                                                    <td>{influencer.name || influencer.displayName || 'N/A'}</td>
                                                    <td>{influencer.email || 'N/A'}</td>
                                                    <td>{influencer.category || influencer.businessCategory || 'N/A'}</td>
                                                    <td>{influencer.social_handles || influencer.socialHandles || 'N/A'}</td>
                                                    <td>{(influencer.audienceSize || 0).toLocaleString()}</td>
                                                    <td>
                                                        {influencer.verified ? (
                                                            <span className={styles.verifiedBadge}>Verified</span>
                                                        ) : (
                                                            <span className={styles.unverifiedBadge}>Unverified</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className={styles.btnViewProfile}
                                                            onClick={() => viewInfluencerProfile(influencer._id || influencer.id)}
                                                        >
                                                            View Profile
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>No pending influencer registrations</p>
                            )}

                            {/* Brand Registrations */}
                            <h3>Verify Brand Registrations</h3>
                            {brands.length > 0 ? (
                                <div className={styles.tableContainer}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Brand Name</th>
                                                <th>Email</th>
                                                <th>Website</th>
                                                <th>Industry</th>
                                                <th>Total Audience</th>
                                                <th>Verified</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {brands.map((brand) => (
                                                <tr key={brand._id || brand.id}>
                                                    <td>{brand.brandName || brand.name || 'N/A'}</td>
                                                    <td>{brand.email || 'N/A'}</td>
                                                    <td>{brand.website || 'N/A'}</td>
                                                    <td>{brand.industry || brand.businessCategory || brand.category || 'N/A'}</td>
                                                    <td>{(brand.totalAudience || 0).toLocaleString()}</td>
                                                    <td>
                                                        {brand.verified ? (
                                                            <span className={styles.verifiedBadge}>Verified</span>
                                                        ) : (
                                                            <span className={styles.unverifiedBadge}>Unverified</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className={styles.btnViewProfile}
                                                            onClick={() => viewBrandProfile(brand._id || brand.id)}
                                                        >
                                                            View Profile
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>No pending brand registrations</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Brand Profile Modal */}
            {showBrandModal && selectedBrand && (
                <div className={styles.modal} onClick={(e) => e.target.className === styles.modal && setShowBrandModal(false)}>
                    <div className={styles.modalContent}>
                        <span className={styles.closeModal} onClick={() => setShowBrandModal(false)}>&times;</span>
                        <h2 id="brandModalTitle">{selectedBrand.brandName || selectedBrand.name} - Profile</h2>
                        <div id="brandProfileContent">
                            <div className={styles.profileSection}>
                                <h3>Basic Information</h3>
                                <div className={styles.profileField}>
                                    <label>Brand Name:</label>
                                    <span>{selectedBrand.brandName || selectedBrand.name || 'N/A'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Email:</label>
                                    <span>{selectedBrand.email || 'N/A'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Phone:</label>
                                    <span>{selectedBrand.phone || 'N/A'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Industry:</label>
                                    <span>{selectedBrand.industry || 'N/A'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Website:</label>
                                    <span>{selectedBrand.website ? <a href={selectedBrand.website} target="_blank" rel="noopener noreferrer">{selectedBrand.website}</a> : 'N/A'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Total Audience:</label>
                                    <span>{(selectedBrand.totalAudience || 0).toLocaleString()}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Bio:</label>
                                    <span>{selectedBrand.bio || 'No bio provided'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Mission:</label>
                                    <span>{selectedBrand.mission || 'No mission statement'}</span>
                                </div>
                            </div>

                            <div className={styles.profileSection}>
                                <h3>Business Details</h3>
                                <div className={styles.profileField}>
                                    <label>Categories:</label>
                                    <span>{selectedBrand.categories && selectedBrand.categories.length > 0 ? selectedBrand.categories.join(', ') : 'None specified'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Languages:</label>
                                    <span>{selectedBrand.languages && selectedBrand.languages.length > 0 ? selectedBrand.languages.join(', ') : 'None specified'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Location:</label>
                                    <span>{selectedBrand.location || 'Not specified'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Member Since:</label>
                                    <span>{selectedBrand.createdAt ? new Date(selectedBrand.createdAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <button type="button" className={styles.btnSecondary} onClick={() => setShowBrandModal(false)}>Close</button>
                            {!selectedBrand.verified && (
                                <button type="button" className={styles.btnApprove} onClick={() => approveUser(selectedBrand._id || selectedBrand.id, 'brand')}>
                                    Approve Brand
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Influencer Profile Modal */}
            {showInfluencerModal && selectedInfluencer && (
                <div className={styles.modal} onClick={(e) => e.target.className === styles.modal && setShowInfluencerModal(false)}>
                    <div className={styles.modalContent}>
                        <span className={styles.closeModal} onClick={() => setShowInfluencerModal(false)}>&times;</span>
                        <h2 id="influencerModalTitle">{selectedInfluencer.displayName || selectedInfluencer.fullName || 'Influencer'} - Profile</h2>
                        <div id="influencerProfileContent">
                            <div className={styles.profileSection}>
                                <h3>Basic Information</h3>
                                <div className={styles.profileField}>
                                    <label>Full Name:</label>
                                    <span>{selectedInfluencer.fullName || 'N/A'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Display Name:</label>
                                    <span>{selectedInfluencer.displayName || 'N/A'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Email:</label>
                                    <span>{selectedInfluencer.email || 'N/A'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Phone:</label>
                                    <span>{selectedInfluencer.phone || 'N/A'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Niche:</label>
                                    <span>{selectedInfluencer.niche || 'N/A'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>About:</label>
                                    <span>{selectedInfluencer.about || 'No description provided'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Bio:</label>
                                    <span>{selectedInfluencer.bio || 'No bio provided'}</span>
                                </div>
                            </div>

                            <div className={styles.profileSection}>
                                <h3>Professional Details</h3>
                                <div className={styles.profileField}>
                                    <label>Categories:</label>
                                    <span>{selectedInfluencer.categories && selectedInfluencer.categories.length > 0 ? selectedInfluencer.categories.join(', ') : 'None specified'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Languages:</label>
                                    <span>{selectedInfluencer.languages && selectedInfluencer.languages.length > 0 ? selectedInfluencer.languages.join(', ') : 'None specified'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Location:</label>
                                    <span>{selectedInfluencer.location || 'Not specified'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Influence Regions:</label>
                                    <span>{selectedInfluencer.influenceRegions || 'Not specified'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Primary Market:</label>
                                    <span>{selectedInfluencer.primaryMarket || 'Not specified'}</span>
                                </div>
                                <div className={styles.profileField}>
                                    <label>Member Since:</label>
                                    <span>{selectedInfluencer.createdAt ? new Date(selectedInfluencer.createdAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <button type="button" className={styles.btnSecondary} onClick={() => setShowInfluencerModal(false)}>Close</button>
                            {!selectedInfluencer.verified && (
                                <button type="button" className={styles.btnApprove} onClick={() => approveUser(selectedInfluencer._id || selectedInfluencer.id, 'influencer')}>
                                    Approve Influencer
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminNavbar>
    );
}