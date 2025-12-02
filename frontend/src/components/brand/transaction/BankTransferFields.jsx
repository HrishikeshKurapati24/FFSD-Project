import React from 'react';

const BankTransferFields = ({ formData, formErrors, handleInputChange }) => {
  return (
    <div id="bankTransferFields">
      <div className="form-group">
        <label htmlFor="accountNumber">Account Number</label>
        <input
          type="text"
          id="accountNumber"
          name="accountNumber"
          value={formData.accountNumber}
          onChange={handleInputChange}
          placeholder="1234567890"
          className={formErrors.accountNumber ? 'error-input' : ''}
        />
        {formErrors.accountNumber && (
          <small className="error-inline">{formErrors.accountNumber}</small>
        )}
      </div>
      <div className="form-group">
        <label htmlFor="routingNumber">Routing Number</label>
        <input
          type="text"
          id="routingNumber"
          name="routingNumber"
          value={formData.routingNumber}
          onChange={handleInputChange}
          placeholder="021000021"
          className={formErrors.routingNumber ? 'error-input' : ''}
        />
        {formErrors.routingNumber && (
          <small className="error-inline">{formErrors.routingNumber}</small>
        )}
      </div>
      <div className="form-group">
        <label htmlFor="bankName">Bank Name</label>
        <input
          type="text"
          id="bankName"
          name="bankName"
          value={formData.bankName}
          onChange={handleInputChange}
          placeholder="Example Bank"
          className={formErrors.bankName ? 'error-input' : ''}
        />
        {formErrors.bankName && <small className="error-inline">{formErrors.bankName}</small>}
      </div>
    </div>
  );
};

export default BankTransferFields;
