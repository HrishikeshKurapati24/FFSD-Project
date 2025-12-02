import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import adminStyles from '../../styles/admin/admin_dashboard.module.css';
import { API_BASE_URL } from '../../services/api';

const AdminNavbar = ({ user, notifications = [], onMarkAllAsRead, children }) => {
    const [sidebarActive, setSidebarActive] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const notificationsRef = useRef(null);
    const profileRef = useRef(null);

    const unreadNotifications = notifications.filter(n => !n.read).length;

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close notifications dropdown
            if (notificationsOpen && notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
            // Close profile dropdown
            if (profileDropdownOpen && profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [notificationsOpen, profileDropdownOpen]);

    const handleLogout = async (e) => {
        if (e) {
            e.preventDefault();
        }

        if (isLoggingOut) {
            return; // Prevent multiple logout attempts
        }

        try {
            setIsLoggingOut(true);
            setProfileDropdownOpen(false);

            // Call logout endpoint
            const response = await fetch(`${API_BASE_URL}/admin/logout`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            // Clear any local storage
            localStorage.removeItem('darkMode');

            // Handle response - backend may return JSON or redirect
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    if (data.success) {
                        // Navigate to login and reload to clear all state
                        window.location.href = '/admin/login';
                        return;
                    }
                }
            }

            // Fallback: redirect to login regardless of response
            window.location.href = '/admin/login';
        } catch (error) {
            console.error('Error during logout:', error);
            // Even on error, redirect to login page
            window.location.href = '/admin/login';
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleMarkAllAsRead = () => {
        if (onMarkAllAsRead) {
            onMarkAllAsRead();
        }
        setNotificationsOpen(false);
    };

    return (
        <div className={adminStyles.container}>
            <nav className={adminStyles.navbar}>
                <div className={adminStyles.navbarLeft}>
                    <button
                        className={adminStyles.menuBtn}
                        onClick={() => setSidebarActive(!sidebarActive)}
                        aria-label="Toggle sidebar"
                    >
                        ☰
                    </button>
                    <AdminSidebar
                        isOpen={sidebarActive}
                        onClose={() => setSidebarActive(false)}
                    />
                </div>

                <div className={adminStyles.heading}>
                    <h1>CollabSync</h1>
                </div>

                <div className={adminStyles.navbarRight}>
                    <div className={adminStyles.notifications} ref={notificationsRef}>
                        <div
                            className={adminStyles.notificationIcon}
                            onClick={(e) => {
                                e.stopPropagation();
                                setNotificationsOpen(!notificationsOpen);
                            }}
                            style={{ cursor: 'pointer' }}
                            aria-label="Notifications"
                        >
                            <i className="fas fa-bell"></i>
                            {unreadNotifications > 0 && (
                                <span className={adminStyles.notificationBadge} id="notification-count">
                                    {unreadNotifications}
                                </span>
                            )}
                        </div>
                        {notificationsOpen && (
                            <div className={adminStyles.notificationsDropdown} id="notifications-dropdown">
                                <div className={adminStyles.notificationsHeader}>
                                    <h3>Notifications</h3>
                                    <button className={adminStyles.markReadBtn} onClick={handleMarkAllAsRead}>
                                        Mark all as read
                                    </button>
                                </div>
                                <div className={adminStyles.notificationsList} id="notifications-list">
                                    {notifications && notifications.length > 0 ? (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification.id || notification._id || Math.random()}
                                                className={`${adminStyles.notificationItem} ${notification.read ? adminStyles.read : adminStyles.unread}`}
                                            >
                                                <div className={adminStyles.notificationIcon}>
                                                    <i className={`fas fa-${notification.type === 'collaboration' ? 'handshake' :
                                                        notification.type === 'payment' ? 'money-check' : 'user'
                                                        }`}></i>
                                                </div>
                                                <div className={adminStyles.notificationContent}>
                                                    <div className={adminStyles.notificationTitle}>
                                                        {notification.title}
                                                    </div>
                                                    <div className={adminStyles.notificationMessage}>
                                                        {notification.message}
                                                    </div>
                                                    <div className={adminStyles.notificationTime}>
                                                        {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : ''}
                                                    </div>
                                                </div>
                                                <div className={`${adminStyles.notificationPriority} ${adminStyles[notification.priority || 'normal']}`}>
                                                    <i className="fas fa-circle"></i>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={adminStyles.noNotifications}>No notifications available</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={adminStyles.profile} ref={profileRef}>
                        <div
                            className={adminStyles.profileIcon}
                            onClick={(e) => {
                                e.stopPropagation();
                                setProfileDropdownOpen(!profileDropdownOpen);
                            }}
                            style={{ cursor: 'pointer' }}
                            aria-label="Profile menu"
                        >
                            <img src="/images/default-avatar.jpg" alt="Profile" id="profile-image" />
                            <span id="user-name">{user?.name || user?.username || 'Admin'}</span>
                            <i className="fas fa-chevron-down"></i>
                        </div>
                        {profileDropdownOpen && (
                            <div className={adminStyles.profileDropdown} id="profile-dropdown">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '0.5rem 1rem',
                                        cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                                        color: '#333',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <i className="fas fa-sign-out-alt"></i>
                                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
            {children}
        </div>
    );
};

export default AdminNavbar;

