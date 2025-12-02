import React from 'react';

const ViewToggle = ({ viewMode, onToggle }) => (
  <div className="toggle-container">
    <button
      className="toggle-button"
      onClick={onToggle}
      aria-pressed={viewMode === 'list'}
      aria-controls="brandList"
      aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
    >
      {viewMode === 'grid' ? 'List view' : 'Grid view'}
    </button>
    <span className="visually-hidden" aria-live="polite">
      {viewMode === 'grid' ? 'List view' : 'Grid view'} activated
    </span>
  </div>
);

export default ViewToggle;


