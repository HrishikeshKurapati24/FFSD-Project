import React from 'react';
import CreditCardFields from './CreditCardFields';
import BankTransferFields from './BankTransferFields';

const PaymentFormFields = ({
  formData,
  formErrors,
  transactionData,
  handleInputChange,
  handleCardNumberChange,
  handleExpiryDateChange,
  styles
}) => {
  return (
    <>
      <div className={styles.formGroup}>
        <label htmlFor="amount">Amount (USD)</label>
        <input
          type="number"
          id="amount"
          name="amount"
          step="0.01"
          min="1"
          max={transactionData.paymentMax || 0}
          value={formData.amount}
          onChange={handleInputChange}
          placeholder={`Up to ${transactionData.paymentMax || '0'}`}
          className={formErrors.amount ? styles.errorInput : ''}
        />
        {formErrors.amount && <small className={styles.errorInline}>{formErrors.amount}</small>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="paymentMethod">Payment Method</label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleInputChange}
          className={formErrors.paymentMethod ? styles.errorInput : ''}
        >
          <option value="" disabled>
            Select payment method
          </option>
          <option value="creditCard">Credit Card</option>
          <option value="bankTransfer">Bank Transfer</option>
        </select>
        {formErrors.paymentMethod && (
          <small className={styles.errorInline}>{formErrors.paymentMethod}</small>
        )}
      </div>

      {formData.paymentMethod === 'creditCard' && (
        <CreditCardFields
          formData={formData}
          formErrors={formErrors}
          transactionData={transactionData}
          handleInputChange={handleInputChange}
          handleCardNumberChange={handleCardNumberChange}
          handleExpiryDateChange={handleExpiryDateChange}
          styles={styles}
        />
      )}

      {formData.paymentMethod === 'bankTransfer' && (
        <BankTransferFields
          formData={formData}
          formErrors={formErrors}
          handleInputChange={handleInputChange}
          styles={styles}
        />
      )}
    </>
  );
};

export default PaymentFormFields;
