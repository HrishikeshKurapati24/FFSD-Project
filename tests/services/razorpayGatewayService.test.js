const crypto = require('crypto');
const razorpayGatewayService = require('../../services/payment/razorpayGatewayService');
const razorpayMock = require('../mocks/razorpay');

describe('RazorpayGatewayService', () => {
    describe('asPaise', () => {
        it('should convert rupees to paise correctly', () => {
            expect(razorpayGatewayService.asPaise(100)).toBe(10000);
            expect(razorpayGatewayService.asPaise(99.99)).toBe(9999);
            expect(razorpayGatewayService.asPaise('50.5')).toBe(5050);
            expect(razorpayGatewayService.asPaise(0)).toBe(0);
        });
    });

    describe('getRazorpayConfig', () => {
        it('should return config from environment variables', () => {
            const config = razorpayGatewayService.getRazorpayConfig();
            expect(config).toHaveProperty('keyId');
            expect(config).toHaveProperty('keySecret');
            expect(config).toHaveProperty('enabled');
        });
    });

    describe('createOrder', () => {
        it('should create a razorpay order successfully', async () => {
            const orderData = {
                amount: 500,
                currency: 'INR',
                receipt: 'receipt_123',
                notes: { test: 'true' }
            };

            const order = await razorpayGatewayService.createOrder(orderData);

            expect(razorpayMock.orders.create).toHaveBeenCalledWith({
                amount: 50000,
                currency: 'INR',
                receipt: 'receipt_123',
                notes: { test: 'true' }
            });
            expect(order.id).toBeDefined();
            expect(order.amount).toBe(50000);
        });
    });

    describe('verifyPaymentSignature', () => {
        const orderId = 'order_123';
        const paymentId = 'pay_123';
        const secret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';
        
        const validSignature = crypto
            .createHmac('sha256', secret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        it('should return true for a valid signature', () => {
            const isValid = razorpayGatewayService.verifyPaymentSignature({
                orderId,
                paymentId,
                signature: validSignature
            });
            expect(isValid).toBe(true);
        });

        it('should return false for an invalid signature', () => {
            const isValid = razorpayGatewayService.verifyPaymentSignature({
                orderId,
                paymentId,
                signature: 'invalid_sig'
            });
            expect(isValid).toBe(false);
        });

        it('should return false if signature is missing', () => {
            const isValid = razorpayGatewayService.verifyPaymentSignature({
                orderId,
                paymentId
            });
            expect(isValid).toBe(false);
        });
    });

    describe('verifyWebhookSignature', () => {
        const rawBody = JSON.stringify({ event: 'payment.captured' });
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret';
        
        const validSignature = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');

        it('should return true for a valid webhook signature', () => {
            const isValid = razorpayGatewayService.verifyWebhookSignature({
                rawBody,
                signature: validSignature
            });
            expect(isValid).toBe(true);
        });

        it('should return false for an invalid webhook signature', () => {
            const isValid = razorpayGatewayService.verifyWebhookSignature({
                rawBody,
                signature: 'invalid_sig'
            });
            expect(isValid).toBe(false);
        });

        it('should return false if inputs are missing', () => {
            expect(razorpayGatewayService.verifyWebhookSignature({ rawBody })).toBe(false);
            expect(razorpayGatewayService.verifyWebhookSignature({ signature: 'sig' })).toBe(false);
        });
    });

    describe('fetchPayment', () => {
        it('should fetch payment details from razorpay', async () => {
            const paymentId = 'pay_123';
            const payment = await razorpayGatewayService.fetchPayment(paymentId);

            expect(razorpayMock.payments.fetch).toHaveBeenCalledWith(paymentId);
            expect(payment.id).toBe(paymentId);
        });
    });
});
