import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../services/api';

const NotificationBell = ({ showNotification = true, onNotificationClick }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notifications`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error('Error loading notifications:', err);
      }
    };

    loadNotifications().catch(() => undefined);
  }, []);

  if (!showNotification) {
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <button
      type="button"
      className="notification-bell"
      style={{ width: '40px', height: '40px', backgroundColor: 'transparent', position: 'relative' }}
      onClick={onNotificationClick}
      aria-label="Open notifications"
      title="Notifications"
    >
      🔔
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            backgroundColor: 'red',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;

