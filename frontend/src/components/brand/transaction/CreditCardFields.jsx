import React from 'react';

const CreditCardFields = ({
  formData,
  formErrors,
  transactionData,
  handleInputChange,
  handleCardNumberChange,
  handleExpiryDateChange,
  styles
}) => {
  return (
    <div id="creditCardFields">
      <div className={styles.formGroup}>
        <label htmlFor="cardNumber">Card Number</label>
        <input
          type="text"
          id="cardNumber"
          name="cardNumber"
          value={formData.cardNumber}
          onChange={handleCardNumberChange}
          placeholder="1234 5678 9012 3456"
          maxLength="19"
          className={formErrors.cardNumber ? styles.errorInput : ''}
        />
        {formErrors.cardNumber && <small className={styles.errorInline}>{formErrors.cardNumber}</small>}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="expiryDate">Expiry Date</label>
        <input
          type="text"
          id="expiryDate"
          name="expiryDate"
          value={formData.expiryDate}
          onChange={handleExpiryDateChange}
          placeholder="MM/YY"
          maxLength="5"
          className={formErrors.expiryDate ? styles.errorInput : ''}
        />
        {formErrors.expiryDate && <small className={styles.errorInline}>{formErrors.expiryDate}</small>}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="cvv">CVV</label>
        <input
          type="text"
          id="cvv"
          name="cvv"
          value={formData.cvv}
          onChange={handleInputChange}
          placeholder="123"
          maxLength="4"
          className={formErrors.cvv ? styles.errorInput : ''}
        />
        {formErrors.cvv && <small className={styles.errorInline}>{formErrors.cvv}</small>}
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="cardHolder">Cardholder Name</label>
        <input
          type="text"
          id="cardHolder"
          name="cardHolder"
          value={formData.cardHolder}
          onChange={handleInputChange}
          placeholder={transactionData.influencerName}
          className={formErrors.cardHolder ? styles.errorInput : ''}
        />
        {formErrors.cardHolder && <small className={styles.errorInline}>{formErrors.cardHolder}</small>}
      </div>
    </div>
  );
};

export default CreditCardFields;
