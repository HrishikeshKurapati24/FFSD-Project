import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from '../../styles/influencer/dashboard.module.css';
import NotificationBell from './NotificationBell';
import NotificationModal from '../brand/NotificationModal';

const NAV_LINKS = [
  { label: 'Home', path: '/influencer/home' },
  { label: 'Explore Brands', path: '/influencer/explore' },
  { label: 'My Profile', path: '/influencer/profile' },
  { label: 'Feedback', path: '/feedback' }
];

const MENU_LINKS = [
  { label: 'Campaigns', path: '/influencer/campaigns' }
];

const InfluencerNavigation = ({ onSignOut, showNotification = true }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  const activePath = useMemo(() => location.pathname, [location.pathname]);

  const handleOpenMenu = useCallback(() => {
    setMenuOpen(true);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleToggleMenu = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target)
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

  const handleMenuLinkKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        handleCloseMenu();
        toggleButtonRef.current?.focus();
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
    <header className={styles['dashboard-header']}>
      <div className="header-container">
        <div className="logo" aria-label="CollabSync">CollabSync</div>
        <nav aria-label="Primary influencer navigation">
          <ul>
            {NAV_LINKS.map((link) => (
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
          <NotificationBell
            showNotification={true}
            onNotificationClick={() => setNotificationModalOpen(true)}
          />
        )}
        <NotificationModal
          isOpen={notificationModalOpen}
          onClose={() => setNotificationModalOpen(false)}
        />
        <div
          ref={menuRef}
          className="menu-wrapper"
        >
          <button
            type="button"
            ref={toggleButtonRef}
            className="toggle-btn"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-controls="influencer-menu"
            onClick={handleToggleMenu}
            onKeyDown={handleToggleKeyDown}
          >
            ☰
          </button>
          <div
            id="influencer-menu"
            className={`menu ${menuOpen ? 'open' : ''}`}
            role="menu"
            tabIndex={menuOpen ? 0 : -1}
            onKeyDown={handleMenuLinkKeyDown}
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

export default InfluencerNavigation;

