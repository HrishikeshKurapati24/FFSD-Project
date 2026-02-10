import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from '../../styles/customer/all_campaigns.module.css';
import { logout } from '../../utils/auth';
import { useCustomer } from '../../contexts/CustomerContext';

const CustomerNavbar = ({
  searchValue = '',
  onSearchChange,
  rightAction,
  customerName = ''
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = location.pathname;
  const [showDropdown, setShowDropdown] = useState(false);
  const { logout: clearCustomerContext } = useCustomer();

  const handleLogout = async () => {
    try {
      // Clear CustomerContext state first
      clearCustomerContext();

      // Call backend logout to clear session and cookies
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear context and redirect
      clearCustomerContext();
      window.location.href = '/signin';
    }
  };

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
            <li className="nav-item">
              <Link
                className={`nav-link ${activePath === '/customer/orders' ? 'active' : ''}`}
                to="/customer/orders"
                aria-current={activePath === '/customer/orders' ? 'page' : undefined}
              >
                My Orders
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
            <>
              <Link
                className={`btn btn-primary ${styles['btn-primary']}`}
                to="/customer/cart"
                aria-label="Go to cart"
              >
                <i className="fas fa-shopping-cart me-2" aria-hidden="true" />
                Cart
              </Link>

              {customerName && (
                <div className="dropdown ms-3" style={{ position: 'relative' }}>
                  <button
                    className="btn btn-outline-secondary dropdown-toggle"
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    aria-expanded={showDropdown}
                    aria-label="Customer menu"
                  >
                    <i className="fas fa-user me-2" aria-hidden="true" />
                    {customerName}
                  </button>
                  {showDropdown && (
                    <div
                      className="dropdown-menu show"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        minWidth: '200px',
                        zIndex: 1000,
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    >
                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={handleLogout}
                        style={{
                          background: 'none',
                          border: 'none',
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          display: 'block'
                        }}
                      >
                        <i className="fas fa-sign-out-alt me-2" aria-hidden="true" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default CustomerNavbar;
