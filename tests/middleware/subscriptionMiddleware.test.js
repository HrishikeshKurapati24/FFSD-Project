const { checkSubscriptionLimit, updateSubscriptionUsage } = require('../../middleware/subscriptionMiddleware');
const SubscriptionService = require('../../services/subscription/subscriptionService');

jest.mock('../../services/subscription/subscriptionService');

describe('Subscription Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            session: {
                user: { id: 'user123', role: 'brand' }
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('checkSubscriptionLimit', () => {
        it('should return 401 if user session is missing', async () => {
            req.session.user = null;
            const middleware = checkSubscriptionLimit('create_campaign');
            
            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false
            }));
        });

        it('should call next() if subscription check passes', async () => {
            SubscriptionService.checkSubscriptionLimit.mockResolvedValue({ allowed: true });
            const middleware = checkSubscriptionLimit('create_campaign');

            await middleware(req, res, next);

            expect(SubscriptionService.checkSubscriptionLimit).toHaveBeenCalledWith('user123', 'brand', 'create_campaign');
            expect(next).toHaveBeenCalled();
        });

        it('should return 400 if subscription limit is reached', async () => {
            SubscriptionService.checkSubscriptionLimit.mockResolvedValue({ 
                allowed: false, 
                reason: 'Max campaigns reached' 
            });
            const middleware = checkSubscriptionLimit('create_campaign');

            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: expect.stringContaining('Max campaigns reached')
            }));
        });

        it('should call next() as fallback if SubscriptionService throws', async () => {
            SubscriptionService.checkSubscriptionLimit.mockRejectedValue(new Error('Service Down'));
            const middleware = checkSubscriptionLimit('create_campaign');

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('updateSubscriptionUsage', () => {
        it('should call SubscriptionService.updateUsage and then call next()', async () => {
            const middleware = updateSubscriptionUsage('campaignsUsed', 1);

            await middleware(req, res, next);

            expect(SubscriptionService.updateUsage).toHaveBeenCalledWith('user123', 'brand', { campaignsUsed: 1 });
            expect(next).toHaveBeenCalled();
        });

        it('should call next() even if updateUsage fails', async () => {
            SubscriptionService.updateUsage.mockRejectedValue(new Error('Update failed'));
            const middleware = updateSubscriptionUsage('campaignsUsed', 1);

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });
});
