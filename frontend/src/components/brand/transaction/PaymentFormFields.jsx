import React from 'react';

const PaymentFormFields = ({
  formData,
  formErrors,
  transactionData,
  handleInputChange,
  styles
}) => {
  return (
    <>
      <div className={styles.formGroup}>
        <label htmlFor="amount">Amount (INR)</label>
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
          <option value="razorpay">Razorpay Checkout (Test Mode)</option>
        </select>
        {formErrors.paymentMethod && (
          <small className={styles.errorInline}>{formErrors.paymentMethod}</small>
        )}
      </div>
      {!transactionData?.canPay && (
        <div className="alert alert-warning mt-2">
          Razorpay is not configured on the server. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
        </div>
      )}
    </>
  );
};

export default PaymentFormFields;
