import React from 'react';

const SuccessMessage = ({ message, visible, onClose }) => {
  if (!message || !visible) return null;

  return (
    <div className="alert alert-success alert-dismissible fade show alert-positioned" role="alert">
      {message}
      <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
    </div>
  );
};

export default SuccessMessage;
