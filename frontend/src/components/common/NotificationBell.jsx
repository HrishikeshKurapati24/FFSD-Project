import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeNotification, clearAllNotifications } from '../../store/slices/notificationSlice';
import styles from '../../styles/common/notification.module.css';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notifications.notifications);
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (id) => {
    // Mark as read or navigate to relevant page
    dispatch(removeNotification(id));
  };

  const handleClearAll = () => {
    dispatch(clearAllNotifications());
  };

  return (
    <div className={styles.notificationContainer} ref={dropdownRef}>
      <button 
        className={`${styles.notificationButton} ${unreadCount > 0 ? styles.hasUnread : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className={styles.notificationBadge}>{unreadCount}</span>
        )}
      </button>
      
      {isOpen && (
        <div className={styles.notificationDropdown}>
          <div className={styles.notificationHeader}>
            <h4>Notifications</h4>
            <button 
              onClick={handleClearAll}
              className={styles.clearButton}
              disabled={notifications.length === 0}
            >
              Clear All
            </button>
          </div>
          
          <div className={styles.notificationList}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>No new notifications</div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`${styles.notificationItem} ${styles[notification.type]}`}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className={styles.notificationIcon}>
                    {notification.type === 'success' && <i className="fas fa-check-circle"></i>}
                    {notification.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
                    {notification.type === 'info' && <i className="fas fa-info-circle"></i>}
                    {notification.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                  </div>
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationMessage}>{notification.message}</div>
                    <div className={styles.notificationTime}>
                      {new Date(notification.timestamp || Date.now()).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
