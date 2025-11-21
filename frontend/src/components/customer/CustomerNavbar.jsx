import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../../styles/customer/all_campaigns.module.css';

const CustomerNavbar = ({
  searchValue = '',
  onSearchChange,
  rightAction
}) => {
  const location = useLocation();
  const activePath = location.pathname;

  return (
    <nav className={`navbar navbar-light bg-light ${styles.navbar}`}>
      <div className={`container-fluid px-4 ${styles.navInner}`}>
        <div className={styles.navLeft}>
          <Link
            to="/"
            className="navbar-brand fw-bold"
            aria-label="CollabSync home"
          >
            <i className="fas fa-shopping-bag me-2" aria-hidden="true" />
            CollabSync
          </Link>
        </div>

        <div className={styles.navCenter}>
          <ul className="nav">
            <li className="nav-item">
              <Link
                className={`nav-link ${activePath === '/customer' ? 'active' : ''}`}
                to="/customer"
                aria-current={activePath === '/customer' ? 'page' : undefined}
              >
                All Campaigns
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${activePath === '/customer/rankings' ? 'active' : ''}`}
                to="/customer/rankings"
                aria-current={activePath === '/customer/rankings' ? 'page' : undefined}
              >
                Rankings
              </Link>
            </li>
          </ul>
        </div>

        <div className={styles.navRight}>
          {onSearchChange && (
            <div className={`input-group ${styles.searchGroup}`}>
              <input
                type="text"
                id="campaign-search"
                className="form-control"
                placeholder="Search campaigns..."
                value={searchValue}
                onChange={onSearchChange}
                aria-label="Search campaigns"
              />
              <button
                type="button"
                className={`btn btn-outline-secondary ${styles['btn-outline-secondary']}`}
                aria-label="Search icon"
              >
                <i className="fas fa-search" aria-hidden="true" />
              </button>
            </div>
          )}
          {rightAction || (
            <Link
              className={`btn btn-primary ${styles['btn-primary']}`}
              to="/customer/cart"
              aria-label="Go to cart"
            >
              <i className="fas fa-shopping-cart me-2" aria-hidden="true" />
              Cart
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default CustomerNavbar;

