import React from 'react';

const DeleteAccountModal = ({
  isOpen,
  onClose,
  deleteConfirmation,
  setDeleteConfirmation,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content delete-modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-modal" onClick={onClose}>
          &times;
        </span>
        <h2>Delete Your Account</h2>
        <div style={{ marginBottom: '20px' }}>
          <p>Are you sure you want to delete your brand account? This action cannot be undone.</p>
          <p>All your campaigns, collaborations, and data will be permanently removed.</p>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="confirmDelete">Type "DELETE" to confirm:</label>
            <input
              type="text"
              className="form-control"
              id="confirmDelete"
              placeholder="DELETE"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-danger"
              disabled={deleteConfirmation !== 'DELETE'}
            >
              Delete Account Permanently
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
