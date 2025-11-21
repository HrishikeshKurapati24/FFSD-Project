import React from 'react';
import styles from '../../styles/landing/landing_page.module.css';

const SOCIAL_LINKS = [
  { href: 'https://www.instagram.com/yourprofile', icon: '/Lp_index/SocialMedia_logo_i.png', label: 'Instagram' },
  { href: 'https://www.youtube.com/channel/yourchannel', icon: '/Lp_index/SocialMedia_logo_y2.png', label: 'YouTube' },
  { href: 'https://www.linkedin.com/in/yourprofile', icon: '/Lp_index/SocialMedia_logo_l.png', label: 'LinkedIn' },
  { href: 'https://www.facebook.com/yourprofile', icon: '/Lp_index/SocialMedia_logo_f3.jpg', label: 'Facebook' },
  { href: 'https://twitter.com/yourprofile', icon: '/Lp_index/SocialMedia_logo_t.png', label: 'Twitter' }
];

const LandingFooter = () => (
  <footer className={styles.footer}>
    <div className={styles['footer-content']}>
      <div className={styles['footer-logo']}>CollabSync</div>
      <p>&copy; {new Date().getFullYear()} CollabSync. All rights reserved.</p>
      <div className={styles['social-media']}>
        {SOCIAL_LINKS.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
            <img src={link.icon} alt={link.label} />
          </a>
        ))}
      </div>
    </div>
  </footer>
);

export default LandingFooter;

