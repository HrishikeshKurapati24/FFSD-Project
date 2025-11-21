import React from 'react';

const TransactionAlerts = ({ successMessage, error, onDismissSuccess, onDismissError, styles }) => {
  return (
    <>
      {successMessage && (
        <div className={`${styles.alert} ${styles.alertSuccess}`} id="successAlert">
          <i className="fas fa-check-circle"></i>
          {successMessage}
          <button type="button" className={styles.closeAlert} onClick={onDismissSuccess}>
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className={`${styles.alert} ${styles.alertDanger}`}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
          <button type="button" className={styles.closeAlert} onClick={onDismissError}>
            &times;
          </button>
        </div>
      )}
    </>
  );
};

export default TransactionAlerts;
