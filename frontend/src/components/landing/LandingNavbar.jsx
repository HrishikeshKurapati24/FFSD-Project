import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../../styles/landing/landing_page.module.css';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Sign Up', path: '/role-selection' },
  { label: 'Sign In', path: '/signin' }
];

const LandingNavbar = () => {
  const location = useLocation();
  const activePath = location.pathname;

  return (
    <header className={styles.header}>
      <div className={styles['header-container']}>
        <Link to="/" className={styles.logo} aria-label="CollabSync home">
          CollabSync
        </Link>
        <nav aria-label="Landing navigation">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={activePath === link.path ? styles.active : undefined}
                  aria-current={activePath === link.path ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default LandingNavbar;

