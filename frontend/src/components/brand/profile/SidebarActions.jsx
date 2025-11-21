import React from 'react';

const SidebarActions = ({ onOpenDeleteModal }) => {
  return (
    <div className="profile-card actions-card">
      <button className="btn-danger" onClick={onOpenDeleteModal}>
        <i className="fas fa-trash-alt"></i> Delete Account
      </button>
    </div>
  );
};

export default SidebarActions;
