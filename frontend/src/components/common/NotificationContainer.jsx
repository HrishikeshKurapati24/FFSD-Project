import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeNotification } from '../../store/slices/notificationSlice';
import styles from '../../styles/common/notificationContainer.module.css';

const NotificationContainer = () => {
  const notifications = useSelector((state) => state.notifications.notifications);
  const dispatch = useDispatch();

  useEffect(() => {
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        dispatch(removeNotification(notification.id));
      }, notification.duration);

      return () => clearTimeout(timer);
    });
  }, [notifications, dispatch]);

  if (notifications.length === 0) return null;

  return (
    <div className={styles.notificationContainer}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${styles.notification} ${styles[notification.type]}`}
          onClick={() => dispatch(removeNotification(notification.id))}
        >
          <div className={styles.notificationContent}>
            <span className={styles.notificationMessage}>{notification.message}</span>
            <button
              className={styles.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                dispatch(removeNotification(notification.id));
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
