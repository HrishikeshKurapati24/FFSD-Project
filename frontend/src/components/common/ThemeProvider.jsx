import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

const ThemeProvider = ({ children }) => {
  const theme = useSelector((state) => state.theme.mode);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      // Dark theme CSS variables
      root.style.setProperty('--primary-color', '#5a9bff');
      root.style.setProperty('--secondary-color', '#7cb518');
      root.style.setProperty('--accent-color', '#ff6b6b');
      root.style.setProperty('--light-gray', '#2d3748');
      root.style.setProperty('--dark-gray', '#e2e8f0');
      root.style.setProperty('--bg-light', '#1a202c');
      root.style.setProperty('--border', '#4a5568');
      root.style.setProperty('--white', '#2d3748');
      root.style.setProperty('--muted', '#a0aec0');
      root.style.setProperty('--text-primary', '#e2e8f0');
      root.style.setProperty('--text-secondary', '#cbd5e0');
      root.style.setProperty('--shadow', '0 2px 10px rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--danger', '#fc8181');
      root.style.setProperty('--success', '#68d391');
      root.style.setProperty('--warning', '#fbbf24');
      root.style.setProperty('--info', '#63b3ed');
    } else {
      // Light theme CSS variables (default)
      root.style.setProperty('--primary-color', '#4285f4');
      root.style.setProperty('--secondary-color', '#34a853');
      root.style.setProperty('--accent-color', '#ea4335');
      root.style.setProperty('--light-gray', '#f8f9fa');
      root.style.setProperty('--dark-gray', '#333');
      root.style.setProperty('--bg-light', '#f5f7fb');
      root.style.setProperty('--border', '#e6e9f0');
      root.style.setProperty('--white', '#ffffff');
      root.style.setProperty('--muted', '#6c757d');
      root.style.setProperty('--text-primary', '#333');
      root.style.setProperty('--text-secondary', '#666');
      root.style.setProperty('--shadow', '0 2px 10px rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--danger', '#dc3545');
      root.style.setProperty('--success', '#28a745');
      root.style.setProperty('--warning', '#ffc107');
      root.style.setProperty('--info', '#17a2b8');
    }
  }, [theme]);

  return children;
};

export default ThemeProvider;
