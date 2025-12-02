import React, { useEffect, useState, useRef } from 'react';
import styles from '../../styles/influencer/notifications.module.css';
import { API_BASE_URL } from '../../services/api';

const NotificationBell = ({ showNotification = true, onNotificationClick }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // load unread count on mount
    loadNotifications().catch(err => console.error(err));
    // close on outside click
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/notifications`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications || []);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id })
      });
      // update locally
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      const ids = notifications.filter(n => !n.read).map(n => n._id);
      if (!ids.length) return;
      await fetch(`${API_BASE_URL}/api/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error(err); }
  };

  const handleNotificationClick = () => {
    setOpen(o => !o);
    if (!open) loadNotifications();
    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!showNotification) {
    return null;
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className="notification-bell"
        style={{ width: '40px', height: '40px', backgroundColor: "transparent", position: 'relative' }}
        onClick={handleNotificationClick}
        aria-label="Open notifications"
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
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
            fontWeight: 'bold'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={styles.modal} role="dialog" aria-label="Notifications">
          <div className={styles.header}>
            <strong>Notifications</strong>
            <div className={styles.headerActions}>
              <button className={styles.markAll} onClick={markAllRead}>Mark all read</button>
            </div>
          </div>
          <div className={styles.list}>
            {loading && <div className={styles.empty}>Loading…</div>}
            {!loading && notifications.length === 0 && <div className={styles.empty}>No notifications</div>}
            {!loading && notifications.map(n => (
              <div key={n._id} className={`${styles.item} ${n.read ? '' : styles.unread}`}>
                <div className={styles.title}>{n.title || n.type}</div>
                <div className={styles.body}>{n.body}</div>
                <div className={styles.row}>
                  <div className={styles.time}>{new Date(n.createdAt || n.created_at || n.created).toLocaleString()}</div>
                  <div>
                    {!n.read && <button className={styles.markBtn} onClick={() => markRead(n._id)}>Mark read</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
