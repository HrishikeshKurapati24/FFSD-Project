import React, { useEffect } from 'react';
import styles from './NotificationCenter.module.css';

const NotificationItem = ({ notification, onClose }) => {
  const { type, message, duration = 3000 } = notification;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <div className={styles.content}>
        <span className={styles.icon}>
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'info' && 'ℹ'}
          {type === 'warning' && '⚠'}
        </span>
        <span className={styles.message}>{message}</span>
      </div>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close notification">×</button>
    </div>
  );
};

export default NotificationItem;
