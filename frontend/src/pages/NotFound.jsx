import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/NotFound.module.css';

const NotFound = () => {
    return (
        <div className={styles.notFoundContainer}>
            <h1 className={styles.errorCode}>404</h1>
            <h2 className={styles.errorMessage}>Page Not Found</h2>
            <p className={styles.errorDescription}>
                Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link to="/" className={styles.homeButton}>
                <i className="fas fa-home"></i> Go Back Home
            </Link>
        </div>
    );
};

export default NotFound;
