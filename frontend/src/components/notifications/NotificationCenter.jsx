import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeNotification } from '../../store/slices/notificationSlice';
import NotificationItem from './NotificationItem';
import styles from './NotificationCenter.module.css';

const NotificationCenter = () => {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notifications.notifications);

  return (
    <div className={styles.notificationContainer} role="status" aria-live="polite">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => dispatch(removeNotification(notification.id))}
        />)
      )}
    </div>
  );
};

export default NotificationCenter;
