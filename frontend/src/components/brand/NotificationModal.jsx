import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../services/api';
import styles from '../../styles/brand/notificationModal.module.css';

const NotificationModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications on mount or when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        const unread = (data.notifications || []).filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: notificationIds })
      });

      if (response.ok) {
        // Update UI
        setNotifications(prev =>
          prev.map(n => notificationIds.includes(n._id) ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead([notification._id]);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'brand_invite':
        return '📬';
      case 'request_accepted':
        return '✅';
      case 'request_rejected':
        return '❌';
      case 'application_received':
        return '📝';
      case 'campaign_started':
        return '🚀';
      case 'campaign_ended':
        return '🏁';
      case 'metrics_updated':
        return '📊';
      case 'payment_completed':
        return '💳';
      case 'invite_sent':
        return '📮';
      default:
        return '🔔';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifTime.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3>Notifications {unreadCount > 0 && `(${unreadCount})`}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Content */}
        <div className={styles.modalBody}>
          {loading && <div className={styles.loadingSpinner}>Loading...</div>}

          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
              <button onClick={fetchNotifications}>Retry</button>
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className={styles.emptyState}>
              <p>No notifications yet</p>
            </div>
          )}

          {!loading && !error && notifications.length > 0 && (
            <ul className={styles.notificationList}>
              {notifications.map(notif => (
                <li
                  key={notif._id}
                  className={`${styles.notificationItem} ${!notif.read ? styles.unread : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <span className={styles.icon}>{getNotificationIcon(notif.type)}</span>
                  <div className={styles.notifContent}>
                    <p className={styles.title}>{notif.title || 'Notification'}</p>
                    <p className={styles.body}>{notif.body || ''}</p>
                    <span className={styles.timestamp}>{formatTime(notif.createdAt)}</span>
                  </div>
                  {!notif.read && <span className={styles.badge}></span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
