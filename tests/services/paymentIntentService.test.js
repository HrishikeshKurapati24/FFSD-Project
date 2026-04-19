const mongoose = require('mongoose');
const { PaymentIntent } = require('../../models/PaymentIntentMongo');

// Mock razorpayGatewayService BEFORE requiring paymentIntentService
jest.mock('../../services/payment/razorpayGatewayService');
const razorpayGatewayService = require('../../services/payment/razorpayGatewayService');
const paymentIntentService = require('../../services/payment/paymentIntentService');

describe('PaymentIntentService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('createPaymentIntent', () => {
        it('should create a pending payment intent in the database', async () => {
            const data = {
                type: 'subscription',
                payerId: new mongoose.Types.ObjectId(),
                payerType: 'BrandInfo',
                amount: 29.99,
                currency: 'USD',
                context: { planId: 'plan_123' }
            };

            const intent = await paymentIntentService.createPaymentIntent(data);

            expect(intent._id).toBeDefined();
            expect(intent.status).toBe('pending');
            expect(intent.amount).toBe(29.99);
            expect(intent.receipt).toMatch(/^subscripti_/);
            expect(intent.context.planId).toBe('plan_123');

            // Verify in DB
            const savedIntent = await PaymentIntent.findById(intent._id);
            expect(savedIntent.status).toBe('pending');
        });
    });

    describe('createRazorpayOrderForIntent', () => {
        let testIntent;

        beforeEach(async () => {
            testIntent = await PaymentIntent.create({
                type: 'subscription',
                amount: 100,
                currency: 'INR',
                receipt: 'receipt_smoke_' + Date.now(),
                status: 'pending'
            });

            razorpayGatewayService.createOrder.mockResolvedValue({
                id: 'order_mock_123',
                notes: { paymentIntentId: testIntent._id.toString() }
            });
        });

        it('should create a Razorpay order and update intent status', async () => {
            const result = await paymentIntentService.createRazorpayOrderForIntent(testIntent._id);

            expect(razorpayGatewayService.createOrder).toHaveBeenCalled();
            expect(result.order.id).toBe('order_mock_123');
            expect(result.intent.status).toBe('order_created');
            expect(result.intent.razorpay.orderId).toBe('order_mock_123');
        });

        it('should return existing order if already created', async () => {
            testIntent.razorpay = { orderId: 'existing_order_99' };
            testIntent.status = 'order_created';
            await testIntent.save();

            const result = await paymentIntentService.createRazorpayOrderForIntent(testIntent._id);

            expect(razorpayGatewayService.createOrder).not.toHaveBeenCalled();
            expect(result.order.id).toBe('existing_order_99');
        });

        it('should throw error if status is not eligible', async () => {
            testIntent.status = 'captured';
            await testIntent.save();

            await expect(paymentIntentService.createRazorpayOrderForIntent(testIntent._id))
                .rejects.toThrow('Cannot create order');
        });
    });

    describe('verifyClientPaymentAndCaptureIntent', () => {
        let testIntent;
        const razorpayOrderId = 'order_abc_123';
        const razorpayPaymentId = 'pay_xyz_789';
        const razorpaySignature = 'mock_sig_456';

        beforeEach(async () => {
            testIntent = await PaymentIntent.create({
                type: 'subscription',
                amount: 100,
                status: 'order_created',
                receipt: 'rec_' + Date.now(),
                razorpay: { orderId: razorpayOrderId }
            });

            razorpayGatewayService.verifyPaymentSignature.mockReturnValue(true);
            razorpayGatewayService.fetchPayment.mockResolvedValue({ status: 'captured' });
        });

        it('should verify signature and mark intent as captured', async () => {
            const result = await paymentIntentService.verifyClientPaymentAndCaptureIntent({
                paymentIntentId: testIntent._id,
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature
            });

            expect(result.verified).toBe(true);
            expect(result.paymentStatus).toBe('captured');
            
            const updated = await PaymentIntent.findById(testIntent._id);
            expect(updated.status).toBe('captured');
            expect(updated.razorpay.signatureVerified).toBe(true);
            expect(updated.razorpay.paymentId).toBe(razorpayPaymentId);
        });

        it('should throw and mark failed if signature is invalid', async () => {
            razorpayGatewayService.verifyPaymentSignature.mockReturnValue(false);

            await expect(paymentIntentService.verifyClientPaymentAndCaptureIntent({
                paymentIntentId: testIntent._id,
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature: 'bad_sig'
            })).rejects.toThrow('Payment signature verification failed');

            const updated = await PaymentIntent.findById(testIntent._id);
            expect(updated.status).toBe('failed');
            expect(updated.failureReason).toBe('Signature verification failed');
        });

        it('should return early if business already applied', async () => {
            testIntent.businessApplied = true;
            await testIntent.save();

            const result = await paymentIntentService.verifyClientPaymentAndCaptureIntent({
                paymentIntentId: testIntent._id,
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature
            });

            expect(result.alreadyApplied).toBe(true);
            expect(razorpayGatewayService.verifyPaymentSignature).not.toHaveBeenCalled();
        });
    });

    describe('Utility Functions', () => {
        it('markIntentBusinessApplied should update flags', async () => {
            const intent = await PaymentIntent.create({ type: 'subscription', amount: 50, status: 'pending', receipt: 'r1_' + Date.now() });
            const result = await paymentIntentService.markIntentBusinessApplied(intent._id);

            expect(result.businessApplied).toBe(true);
            expect(result.businessAppliedAt).toBeDefined();
            expect(result.status).toBe('captured');
        });

        it('markIntentFailed should update status', async () => {
            const intent = await PaymentIntent.create({ type: 'subscription', amount: 50, status: 'pending', receipt: 'r2_' + Date.now() });
            const result = await paymentIntentService.markIntentFailed(intent._id, 'User cancelled');

            expect(result.status).toBe('failed');
            expect(result.failureReason).toBe('User cancelled');
        });

        it('findIntentByOrderId should find correct document', async () => {
            const orderId = 'find_me_123';
            await PaymentIntent.create({ type: 'subscription', amount: 1, razorpay: { orderId }, receipt: 'r3_' + Date.now() });
            
            const found = await paymentIntentService.findIntentByOrderId(orderId);
            expect(found).toBeDefined();
            expect(found.razorpay.orderId).toBe(orderId);
        });

        it('touchWebhookState should update fields', async () => {
            const intent = await PaymentIntent.create({ type: 'subscription', amount: 1, receipt: 'r4_' + Date.now() });
            const result = await paymentIntentService.touchWebhookState({
                paymentIntentId: intent._id,
                eventId: 'evt_1',
                paymentId: 'pay_1',
                paymentStatus: 'captured'
            });

            expect(result.razorpay.lastWebhookEventId).toBe('evt_1');
            expect(result.razorpay.paymentId).toBe('pay_1');
            expect(result.status).toBe('captured');
        });
    });
});
