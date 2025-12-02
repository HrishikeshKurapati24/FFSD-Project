import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../../styles/brand/dashboard.module.css';

const PRIMARY_LINKS = [
  { label: 'Home', path: '/brand/home' },
  { label: 'Explore Influencers', path: '/brand/explore' },
  { label: 'My Brand Profile', path: '/brand/profile' }
];

const MENU_LINKS = [
  { label: 'Collab Requests', path: '/brand/recievedRequests' },
  { label: 'Create Campaign', path: '/brand/create_campaign' }
];

const BrandNavigation = ({ onSignOut, onNotificationClick, showNotification = true }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  const activePath = useMemo(() => location.pathname, [location.pathname]);

  const handleToggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        toggleRef.current &&
        !toggleRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleToggleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggleMenu();
      }
      if (event.key === 'Escape') {
        handleCloseMenu();
      }
    },
    [handleCloseMenu, handleToggleMenu]
  );

  const handleMenuKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        handleCloseMenu();
        toggleRef.current?.focus();
      }
    },
    [handleCloseMenu]
  );

  const handleSignOutClick = useCallback(
    (event) => {
      event.preventDefault();
      handleCloseMenu();
      onSignOut?.(event);
    },
    [handleCloseMenu, onSignOut]
  );

  return (
    <header className={styles.brandDashboardHeader}>
      <div className="header-container">
        <div className="logo" aria-label="CollabSync">CollabSync</div>
        <nav aria-label="Primary brand navigation">
          <ul>
            {PRIMARY_LINKS.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={activePath === link.path ? 'active' : undefined}
                  aria-current={activePath === link.path ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {showNotification && (
          <button
            type="button"
            className="notification-bell"
            style={{ width: '40px', height: '40px', backgroundcolor: "transparent"}}
            onClick={() => onNotificationClick?.()}
            aria-label="Open notifications"
            title="Notifications"
          >
            🔔
          </button>
        )}
        <div className="menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className="toggle-btn"
            ref={toggleRef}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-controls="brand-menu"
            onClick={handleToggleMenu}
            onKeyDown={handleToggleKeyDown}
          >
            ☰
          </button>
          <div
            id="brand-menu"
            className={`menu ${menuOpen ? 'open' : ''}`}
            role="menu"
            tabIndex={menuOpen ? 0 : -1}
            onKeyDown={handleMenuKeyDown}
          >
            {MENU_LINKS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                role="menuitem"
                tabIndex={menuOpen ? 0 : -1}
                onClick={handleCloseMenu}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              className="menu-signout"
              role="menuitem"
              tabIndex={menuOpen ? 0 : -1}
              onClick={handleSignOutClick}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default BrandNavigation;

