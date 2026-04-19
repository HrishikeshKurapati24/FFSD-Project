const crypto = require('crypto');
const Razorpay = require('razorpay');

const asPaise = (amount) => Math.round(Number(amount) * 100);

const getRazorpayConfig = () => {
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const mode = (process.env.PAYMENT_PROVIDER_MODE || 'razorpay_test').trim();

    return {
        keyId,
        keySecret,
        webhookSecret,
        mode,
        enabled: Boolean(keyId && keySecret)
    };
};

const getClient = () => {
    const config = getRazorpayConfig();
    if (!config.enabled) {
        throw new Error('Razorpay keys are not configured');
    }

    return new Razorpay({
        key_id: config.keyId,
        key_secret: config.keySecret
    });
};

const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
    const client = getClient();
    const payload = {
        amount: asPaise(amount),
        currency,
        receipt,
        notes
    };

    const order = await client.orders.create(payload);
    return order;
};

const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
    const { keySecret } = getRazorpayConfig();
    if (!keySecret) return false;

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body)
        .digest('hex');

    try {
        return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature || ''));
    } catch (error) {
        return false;
    }
};

const verifyWebhookSignature = ({ rawBody, signature }) => {
    const { webhookSecret } = getRazorpayConfig();
    if (!webhookSecret || !rawBody || !signature) return false;

    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

    try {
        return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
    } catch (error) {
        return false;
    }
};

const fetchPayment = async (paymentId) => {
    const client = getClient();
    return client.payments.fetch(paymentId);
};

module.exports = {
    getRazorpayConfig,
    createOrder,
    verifyPaymentSignature,
    verifyWebhookSignature,
    fetchPayment,
    asPaise
};
