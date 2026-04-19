/**
 * Unified Test Suite Runner
 * This file aggregates all major integration and unit tests.
 * Run this file using: npm test tests/full-suite.test.js
 */

// Global mocks for the entire suite to prevent require-order issues
jest.mock('../services/payment/razorpayGatewayService', () => ({
    createOrder: jest.fn(),
    verifyPaymentSignature: jest.fn(),
    verifyWebhookSignature: jest.fn(),
    fetchPayment: jest.fn(),
    asPaise: (amount) => Math.round(Number(amount) * 100),
    getRazorpayConfig: jest.fn().mockReturnValue({ enabled: true, keyId: 'test', keySecret: 'test' })
}));

describe('Full Application Test Suite', () => {
    // ── Authentication & Authorization ──────────────────────────────
    require('./routes/authRoutes.test');
    
    // ── Brand Domain ───────────────────────────────────────────────
    require('./routes/brandRoutes.test');
    require('./services/brandProfileService.test');
    
    // ── Influencer Domain ──────────────────────────────────────────
    require('./routes/influencerRoutes.test');
    require('./services/influencerProfileService.test');
    
    // ── Admin Domain ───────────────────────────────────────────────
    require('./routes/adminRoutes.test');
    require('./services/adminUserService.test');
    
    // ── Subscription System ────────────────────────────────────────
    require('./services/subscriptionService.test');
    
    // ── Collaboration & Payments ───────────────────────────────────
    require('./services/collaborationManageService.test');
    require('./services/paymentIntentService.test');
    
    // ── Middleware ────────────────────────────────────────────────
    require('./middleware/errorHandler.test');
    require('./middleware/subscriptionMiddleware.test');
});
