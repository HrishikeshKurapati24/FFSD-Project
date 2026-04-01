import React from 'react';

const PaymentSetupSection = ({
  paymentForm,
  setPaymentForm,
  paymentData,
  onSubmit,
  isSaving,
  errorMessage,
  successMessage
}) => {
  const handleChange = (field, value) => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h5 className="card-title mb-3">Payment Profile</h5>
        <p className="text-muted mb-3">
          Save optional billing/account details for faster Razorpay checkout prefill.
        </p>

        <div className="mb-2">
          <span className={`badge ${paymentData?.profileComplete ? 'bg-success' : 'bg-secondary'}`}>
            {paymentData?.profileComplete ? 'Profile Saved' : 'Optional'}
          </span>
          {paymentData?.paymentMethodSummary?.cardLast4 && (
            <span className="ms-2 text-muted">
              {paymentData.paymentMethodSummary.cardBrand || 'card'} ending in {paymentData.paymentMethodSummary.cardLast4}
            </span>
          )}
        </div>

        {errorMessage && <div className="alert alert-danger py-2">{errorMessage}</div>}
        {successMessage && <div className="alert alert-success py-2">{successMessage}</div>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label">Legal Business Name</label>
              <input
                className="form-control"
                value={paymentForm.legalBusinessName}
                onChange={(e) => handleChange('legalBusinessName', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Account Type</label>
              <select
                className="form-control"
                value={paymentForm.accountType}
                onChange={(e) => handleChange('accountType', e.target.value)}
              >
                <option value="company">Company</option>
                <option value="individual">Individual</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Tax ID (Last 4)</label>
              <input
                className="form-control"
                maxLength={4}
                value={paymentForm.taxIdLast4}
                onChange={(e) => handleChange('taxIdLast4', e.target.value)}
              />
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <label className="form-label">Billing Name</label>
              <input
                className="form-control"
                value={paymentForm.billingName}
                onChange={(e) => handleChange('billingName', e.target.value)}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Billing Email</label>
              <input
                className="form-control"
                type="email"
                value={paymentForm.billingEmail}
                onChange={(e) => handleChange('billingEmail', e.target.value)}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Billing Phone</label>
              <input
                className="form-control"
                value={paymentForm.billingPhone}
                onChange={(e) => handleChange('billingPhone', e.target.value)}
              />
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-5">
              <label className="form-label">Address Line 1</label>
              <input
                className="form-control"
                value={paymentForm.line1}
                onChange={(e) => handleChange('line1', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">City</label>
              <input
                className="form-control"
                value={paymentForm.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">State</label>
              <input
                className="form-control"
                value={paymentForm.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Postal Code</label>
              <input
                className="form-control"
                value={paymentForm.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
              />
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-5">
              <label className="form-label">Card Number (Mock)</label>
              <input
                className="form-control"
                inputMode="numeric"
                value={paymentForm.cardNumber}
                onChange={(e) => handleChange('cardNumber', e.target.value)}
                placeholder="4111 1111 1111 1111"
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Exp Month</label>
              <input
                className="form-control"
                inputMode="numeric"
                value={paymentForm.expiryMonth}
                onChange={(e) => handleChange('expiryMonth', e.target.value)}
                placeholder="12"
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Exp Year</label>
              <input
                className="form-control"
                inputMode="numeric"
                value={paymentForm.expiryYear}
                onChange={(e) => handleChange('expiryYear', e.target.value)}
                placeholder="2028"
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">CVV</label>
              <input
                className="form-control"
                inputMode="numeric"
                value={paymentForm.cvv}
                onChange={(e) => handleChange('cvv', e.target.value)}
                placeholder="123"
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving Payment Info...' : 'Save Billing Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentSetupSection;
