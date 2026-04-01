import React, { useEffect, useState } from 'react';
import CustomerNavbar from '../../components/customer/CustomerNavbar';
import { API_BASE_URL } from '../../services/api';

const CustomerPaymentForm = ({ form, setForm, paymentData, onSubmit, saving, error, success }) => {
  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="card mt-3">
      <div className="card-body">
        <h4 className="mb-2">Customer Payment Profile</h4>
        <p className="text-muted">
          Save optional billing/contact details to prefill Razorpay checkout faster.
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

        {error ? <div className="alert alert-danger py-2">{error}</div> : null}
        {success ? <div className="alert alert-success py-2">{success}</div> : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label">Full Name</label>
              <input className="form-control" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
            </div>
            <div className="col-md-3">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Location</label>
              <input className="form-control" value={form.location} onChange={(e) => setField('location', e.target.value)} />
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <label className="form-label">Billing Name</label>
              <input className="form-control" value={form.billingName} onChange={(e) => setField('billingName', e.target.value)} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Billing Email</label>
              <input className="form-control" type="email" value={form.billingEmail} onChange={(e) => setField('billingEmail', e.target.value)} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Billing Phone</label>
              <input className="form-control" value={form.billingPhone} onChange={(e) => setField('billingPhone', e.target.value)} />
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-5">
              <label className="form-label">Address Line 1</label>
              <input className="form-control" value={form.line1} onChange={(e) => setField('line1', e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label">City</label>
              <input className="form-control" value={form.city} onChange={(e) => setField('city', e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label">State</label>
              <input className="form-control" value={form.state} onChange={(e) => setField('state', e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label">Postal Code</label>
              <input className="form-control" value={form.postalCode} onChange={(e) => setField('postalCode', e.target.value)} />
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label">Default Shipping Address</label>
              <input
                className="form-control"
                value={form.defaultShippingAddress}
                onChange={(e) => setField('defaultShippingAddress', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Preferred Currency</label>
              <input
                className="form-control"
                value={form.preferredCurrency}
                onChange={(e) => setField('preferredCurrency', e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Account Holder Name</label>
              <input
                className="form-control"
                value={form.accountHolderName}
                onChange={(e) => setField('accountHolderName', e.target.value)}
              />
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-5">
              <label className="form-label">Card Number (Mock)</label>
              <input
                className="form-control"
                inputMode="numeric"
                value={form.cardNumber}
                onChange={(e) => setField('cardNumber', e.target.value)}
                placeholder="4111 1111 1111 1111"
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Exp Month</label>
              <input
                className="form-control"
                inputMode="numeric"
                value={form.expiryMonth}
                onChange={(e) => setField('expiryMonth', e.target.value)}
                placeholder="12"
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Exp Year</label>
              <input
                className="form-control"
                inputMode="numeric"
                value={form.expiryYear}
                onChange={(e) => setField('expiryYear', e.target.value)}
                placeholder="2028"
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">CVV</label>
              <input
                className="form-control"
                inputMode="numeric"
                value={form.cvv}
                onChange={(e) => setField('cvv', e.target.value)}
                placeholder="123"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving Payment Info...' : 'Save Billing Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

const CustomerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    location: '',
    billingName: '',
    billingEmail: '',
    billingPhone: '',
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    accountHolderName: '',
    defaultShippingAddress: '',
    preferredCurrency: 'USD',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/customer/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load profile');
      }

      setPaymentData(data.payment);
      setCustomerName(data.customer?.name || data.customer?.displayName || '');
      setForm({
        name: data.customer?.name || '',
        phone: data.customer?.phone || '',
        location: data.customer?.location || '',
        billingName: data.payment?.paymentProfile?.billingName || data.customer?.name || '',
        billingEmail: data.payment?.paymentProfile?.billingEmail || data.customer?.email || '',
        billingPhone: data.payment?.paymentProfile?.billingPhone || data.customer?.phone || '',
        line1: data.payment?.paymentProfile?.billingAddress?.line1 || '',
        city: data.payment?.paymentProfile?.billingAddress?.city || '',
        state: data.payment?.paymentProfile?.billingAddress?.state || '',
        postalCode: data.payment?.paymentProfile?.billingAddress?.postalCode || '',
        country: data.payment?.paymentProfile?.billingAddress?.country || 'US',
        accountHolderName: data.payment?.customerAccountDetails?.accountHolderName || data.customer?.name || '',
        defaultShippingAddress: data.payment?.customerAccountDetails?.defaultShippingAddress || '',
        preferredCurrency: data.payment?.customerAccountDetails?.preferredCurrency || 'USD',
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: ''
      });
    } catch (err) {
      setError(err.message || 'Unable to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSavePayment = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const setupOrderResponse = await fetch(`${API_BASE_URL}/customer/profile/payment/setup-order`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({})
      });

      const setupOrderData = await setupOrderResponse.json();
      if (!setupOrderResponse.ok || !setupOrderData?.setupOrderId) {
        throw new Error(setupOrderData?.message || 'Unable to initialize payment setup');
      }

      const saveResponse = await fetch(`${API_BASE_URL}/customer/profile/payment/save-method`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          setupOrderId: setupOrderData.setupOrderId,
          billingDetails: {
            name: form.billingName,
            email: form.billingEmail,
            phone: form.billingPhone,
            address: {
              line1: form.line1,
              city: form.city,
              state: form.state,
              postalCode: form.postalCode,
              country: form.country || 'US'
            }
          },
          cardDetails: {
            cardNumber: form.cardNumber,
            expMonth: form.expiryMonth,
            expYear: form.expiryYear,
            cvv: form.cvv
          },
          customerAccountDetails: {
            accountHolderName: form.accountHolderName,
            defaultShippingAddress: form.defaultShippingAddress,
            preferredCurrency: form.preferredCurrency
          },
          profileUpdates: {
            name: form.name,
            phone: form.phone,
            location: form.location
          }
        })
      });

      const saveData = await saveResponse.json();
      if (!saveResponse.ok || !saveData.success) {
        throw new Error(saveData?.message || 'Unable to save payment profile');
      }

      setPaymentData(saveData.payment);
      setSuccess('Payment profile saved successfully');
      await loadProfile();
    } catch (err) {
      setError(err.message || 'Unable to save payment profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <CustomerNavbar customerName={customerName} />
      <div className="container py-4">
        <h2>Customer Profile</h2>
        <p className="text-muted mb-4">
          Manage your details and optional billing profile for Razorpay checkout.
        </p>

        {loading ? (
          <div className="text-center py-5">Loading profile...</div>
        ) : (
          <CustomerPaymentForm
            form={form}
            setForm={setForm}
            paymentData={paymentData}
            onSubmit={handleSavePayment}
            saving={saving}
            error={error}
            success={success}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;
