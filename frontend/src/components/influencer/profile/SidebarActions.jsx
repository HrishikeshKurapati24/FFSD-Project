import React from 'react';

const SidebarActions = ({ influencer, onDeleteAccount }) => (
  <>
    <div className="profile-card">
      <h3>Member Since</h3>
      <div className="member-since">
        <i className="fas fa-calendar-alt"></i>
        {new Date(influencer.createdAt).toLocaleDateString()}
      </div>
    </div>

    <div className="profile-card actions-card">
      <button className="btn-danger" onClick={onDeleteAccount}>
        <i className="fas fa-trash-alt"></i> Delete Account
      </button>
    </div>
  </>
);

export default SidebarActions;

