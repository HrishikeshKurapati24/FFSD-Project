import React from 'react';

const DeleteAccountModal = ({
  isOpen,
  deleteConfirm,
  setDeleteConfirm,
  onClose,
  onDelete
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal" style={{ display: 'block' }} onClick={(e) => e.target.className === 'modal' && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-modal" onClick={onClose}>&times;</span>
        <h2>Delete Your Account</h2>
        <div className="margin-bottom-20">
          <p>Are you sure you want to delete your influencer account? This action cannot be undone.</p>
          <p>All your campaigns, collaborations, and data will be permanently removed.</p>
        </div>
        <div className="form-group">
          <label htmlFor="confirmDelete">Type "DELETE" to confirm:</label>
          <input
            type="text"
            className="form-control"
            id="confirmDelete"
            placeholder="DELETE"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="btn-danger"
            onClick={onDelete}
            disabled={deleteConfirm !== 'DELETE'}
          >
            Delete Account Permanently
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;


