const crypto = require('crypto');

const randomId = (prefix) => `${prefix}_${crypto.randomBytes(8).toString('hex')}`;

const getRazorpayConfig = () => ({
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret'
});

const ensureRazorpayCustomer = async ({ existingCustomerId }) => {
    if (existingCustomerId) {
        return { id: existingCustomerId };
    }
    return { id: randomId('cust_mock') };
};

const createMockSetupOrder = async ({ customerId, notes = {} }) => {
    return {
        id: randomId('order_setup_mock'),
        customer_id: customerId,
        amount: 100,
        currency: 'INR',
        status: 'created',
        notes
    };
};

const saveMockPaymentMethod = async ({ customerId, card = {}, notes = {} }) => {
    const number = String(card.cardNumber || '').replace(/\D/g, '');
    const last4 = number.slice(-4) || '1111';
    const network = card.network || (number.startsWith('4') ? 'visa' : 'mastercard');

    return {
        id: randomId('pm_mock'),
        customer_id: customerId,
        method: 'card',
        card: {
            network,
            last4
        },
        notes
    };
};

const createAndCaptureMockPayment = async ({
    amountPaise,
    customerId,
    paymentMethodId,
    currency = 'INR',
    description,
    notes = {},
    transferDestination
}) => {
    return {
        id: randomId('pay_mock'),
        order_id: randomId('order_txn_mock'),
        amount: amountPaise,
        currency,
        customer_id: customerId,
        payment_method_id: paymentMethodId,
        status: 'captured',
        description,
        notes: {
            ...notes,
            transferDestination: transferDestination || null
        },
        method: 'card',
        captured: true,
        created_at: new Date().toISOString()
    };
};

module.exports = {
    getRazorpayConfig,
    ensureRazorpayCustomer,
    createMockSetupOrder,
    saveMockPaymentMethod,
    createAndCaptureMockPayment
};
