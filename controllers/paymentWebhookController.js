const {
    verifyWebhookSignature
} = require('../services/payment/razorpayGatewayService');
const {
    findIntentByOrderId,
    touchWebhookState,
    markIntentBusinessApplied
} = require('../services/payment/paymentIntentService');
const SubscriptionService = require('../services/subscription/subscriptionService');
const brandCampaignService = require('../services/brand/brandCampaignService');
const CustomerShoppingService = require('../services/customer/customerShoppingService');

const applyBusinessForIntent = async (intent) => {
    switch (intent.type) {
        case 'subscription':
            await SubscriptionService.applySubscriptionFromPaymentIntent(intent);
            return;
        case 'campaign':
            await brandCampaignService.applyCampaignTransactionFromIntent(intent);
            return;
        case 'order':
            await CustomerShoppingService.finalizeCheckoutFromIntent(intent);
            return;
        default:
            throw new Error(`Unsupported payment intent type: ${intent.type}`);
    }
};

const handleRazorpayWebhook = async (req, res) => {
    try {
        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
        const signature = req.headers['x-razorpay-signature'];

        const isValid = verifyWebhookSignature({ rawBody, signature });
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
        }

        const event = JSON.parse(rawBody.toString('utf8'));
        const eventType = event?.event;
        const eventId = event?.id;

        const paymentEntity = event?.payload?.payment?.entity || {};
        const orderEntity = event?.payload?.order?.entity || {};
        const orderId = paymentEntity.order_id || orderEntity.id;
        const paymentId = paymentEntity.id;
        const paymentStatus = paymentEntity.status;

        if (!orderId) {
            return res.status(200).json({ success: true, ignored: true, reason: 'No order id in webhook payload' });
        }

        const intent = await findIntentByOrderId(orderId);
        if (!intent) {
            return res.status(200).json({ success: true, ignored: true, reason: 'No payment intent mapped for order' });
        }

        const updatedIntent = await touchWebhookState({
            paymentIntentId: intent._id,
            eventId,
            paymentId,
            paymentStatus
        });

        const normalizedStatus = String(paymentStatus || '').toLowerCase();
        const paidStatus = ['captured', 'authorized'].includes(normalizedStatus) || eventType === 'order.paid';

        if (paidStatus && !updatedIntent.businessApplied) {
            await applyBusinessForIntent(updatedIntent);
            await markIntentBusinessApplied(updatedIntent._id);
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Razorpay webhook processing failed:', error);
        return res.status(500).json({ success: false, message: 'Webhook processing failed' });
    }
};

module.exports = {
    handleRazorpayWebhook
};
