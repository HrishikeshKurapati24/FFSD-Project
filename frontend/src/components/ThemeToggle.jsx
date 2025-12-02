import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../store/slices/themeSlice';

const ThemeToggle = ({ className, style }) => {
  const dispatch = useDispatch();
  const mode = useSelector((s) => s.theme.mode);

  return (
    <button
      type="button"
      onClick={() => dispatch(toggleTheme())}
      className={className}
      style={style}
      aria-label="Toggle theme"
      title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
    >
      {mode === 'dark' ? '🌞 Light' : '🌙 Dark'}
    </button>
  );
};

export default ThemeToggle;