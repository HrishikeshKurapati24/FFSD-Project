import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../store/slices/themeSlice';

const ThemeToggle = ({ className, style }) => {
  const dispatch = useDispatch();
  const mode = useSelector((s) => s.theme.mode);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Theme toggle clicked, current mode:', mode);
    dispatch(toggleTheme());
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      style={{
        ...style,
        color: mode === 'dark' ? '#fff' : '#333',
        border: style?.border || `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.3)' : '#dee2e6'}`,
        minWidth: 'auto',
        width: 'auto',
        padding: '6px 10px',
        fontSize: '13px',
      }}
      aria-label="Toggle theme"
      title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
    >
      {mode === 'dark' ? '🌞' : '🌙'}
    </button>
  );
};

export default ThemeToggle;