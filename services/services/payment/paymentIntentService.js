const crypto = require('crypto');
const { PaymentIntent } = require('../../models/PaymentIntentMongo');
const gateway = require('./razorpayGatewayService');

const buildReceipt = (type) => {
    const suffix = crypto.randomBytes(6).toString('hex');
    const safeType = (type || 'payment').substring(0, 10);
    return `${safeType}_${Date.now()}_${suffix}`;
};

const createPaymentIntent = async ({
    type,
    payerId,
    payerType,
    amount,
    currency = 'INR',
    context = {},
    metadata = {}
}) => {
    const receipt = buildReceipt(type);

    const intent = await PaymentIntent.create({
        type,
        payerId: payerId || undefined,
        payerType: payerType || 'System',
        amount,
        currency,
        receipt,
        context,
        metadata,
        status: 'pending'
    });

    return intent;
};

const createRazorpayOrderForIntent = async (intentId) => {
    const intent = await PaymentIntent.findById(intentId);
    if (!intent) throw new Error('Payment intent not found');
    if (intent.status !== 'pending' && intent.status !== 'order_created') {
        throw new Error(`Cannot create order for payment intent with status: ${intent.status}`);
    }

    if (intent.razorpay?.orderId) {
        return {
            intent,
            order: {
                id: intent.razorpay.orderId,
                amount: Math.round(Number(intent.amount) * 100),
                currency: intent.currency,
                receipt: intent.receipt,
                status: 'created'
            }
        };
    }

    const order = await gateway.createOrder({
        amount: intent.amount,
        currency: intent.currency,
        receipt: intent.receipt,
        notes: {
            paymentIntentId: intent._id.toString(),
            type: intent.type
        }
    });

    intent.status = 'order_created';
    intent.razorpay = {
        ...(intent.razorpay || {}),
        orderId: order.id,
        notes: order.notes || {}
    };
    await intent.save();

    return { intent, order };
};

const verifyClientPaymentAndCaptureIntent = async ({
    paymentIntentId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
}) => {
    const intent = await PaymentIntent.findById(paymentIntentId);
    if (!intent) throw new Error('Payment intent not found');

    if (intent.businessApplied) {
        return { intent, alreadyApplied: true, verified: true };
    }

    const expectedOrderId = intent.razorpay?.orderId;
    if (!expectedOrderId || expectedOrderId !== razorpayOrderId) {
        throw new Error('Invalid Razorpay order ID for payment intent');
    }

    const isSignatureValid = gateway.verifyPaymentSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature
    });

    if (!isSignatureValid) {
        intent.status = 'failed';
        intent.failureReason = 'Signature verification failed';
        await intent.save();
        throw new Error('Payment signature verification failed');
    }

    let paymentStatus = 'captured';
    try {
        const payment = await gateway.fetchPayment(razorpayPaymentId);
        paymentStatus = payment.status;
    } catch (error) {
        console.error('Error fetching payment status:', error);
    }

    intent.razorpay = {
        ...(intent.razorpay || {}),
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
        signatureVerified: true,
        paymentStatus
    };
    intent.status = paymentStatus === 'captured' ? 'captured' : 'authorized';
    await intent.save();

    return {
        intent,
        verified: true,
        paymentStatus
    };
};

const markIntentBusinessApplied = async (paymentIntentId) => {
    const updated = await PaymentIntent.findByIdAndUpdate(
        paymentIntentId,
        {
            $set: {
                businessApplied: true,
                businessAppliedAt: new Date(),
                status: 'captured'
            }
        },
        { new: true }
    );
    return updated;
};

const markIntentFailed = async (paymentIntentId, reason) => {
    const updated = await PaymentIntent.findByIdAndUpdate(
        paymentIntentId,
        {
            $set: {
                status: 'failed',
                failureReason: reason || 'Payment failed'
            }
        },
        { new: true }
    );
    return updated;
};

const findIntentByOrderId = async (razorpayOrderId) => {
    return PaymentIntent.findOne({ 'razorpay.orderId': razorpayOrderId });
};

const touchWebhookState = async ({ paymentIntentId, eventId, paymentId, paymentStatus }) => {
    return PaymentIntent.findByIdAndUpdate(
        paymentIntentId,
        {
            $set: {
                'razorpay.lastWebhookEventId': eventId || null,
                'razorpay.webhookVerified': true,
                ...(paymentId ? { 'razorpay.paymentId': paymentId } : {}),
                ...(paymentStatus ? { 'razorpay.paymentStatus': paymentStatus } : {}),
                ...(paymentStatus === 'captured' ? { status: 'captured' } : {})
            }
        },
        { new: true }
    );
};

module.exports = {
    createPaymentIntent,
    createRazorpayOrderForIntent,
    verifyClientPaymentAndCaptureIntent,
    markIntentBusinessApplied,
    markIntentFailed,
    findIntentByOrderId,
    touchWebhookState,
    getRazorpayConfig: gateway.getRazorpayConfig
};
