const { routeCache } = require('../../middleware/routeCache');
const cache = require('../../services/cache/redisCacheService');

jest.mock('../../services/cache/redisCacheService');

describe('Route Cache Middleware', () => {
    let req, res, next, mockRedis;

    beforeEach(() => {
        mockRedis = {
            get: jest.fn(),
            set: jest.fn()
        };
        cache.getClient.mockReturnValue(mockRedis);
        cache.getJSON.mockReset();
        cache.setJSON.mockReset();

        req = {
            method: 'GET',
            baseUrl: '/api',
            path: '/test',
            query: {},
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn()
        };
        next = jest.fn();
    });

    it('should call next() if method is not GET', async () => {
        req.method = 'POST';
        const middleware = routeCache();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(cache.getJSON).not.toHaveBeenCalled();
    });

    it('should call next() if redis client is not available', async () => {
        cache.getClient.mockReturnValue(null);
        const middleware = routeCache();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should call next() if bypass query param is present', async () => {
        req.query.cache = 'false';
        const middleware = routeCache();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should return cached data if present', async () => {
        const cachedData = { statusCode: 200, payload: { data: 'hit' } };
        cache.getJSON.mockResolvedValue(cachedData);
        const middleware = routeCache();

        await middleware(req, res, next);

        expect(res.setHeader).toHaveBeenCalledWith('x-cache', 'HIT');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: 'hit' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next and intercept res.json on miss', async () => {
        cache.getJSON.mockResolvedValue(null);
        const middleware = routeCache({ namespace: 'test', ttlSeconds: 60 });

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        
        // Simulate response completion
        res.statusCode = 200;
        const payload = { data: 'miss' };
        await res.json(payload);

        expect(cache.setJSON).toHaveBeenCalledWith(
            expect.stringContaining('test:anon:/api/test'),
            expect.objectContaining({ payload }),
            60
        );
        expect(res.setHeader).toHaveBeenCalledWith('x-cache', 'MISS');
    });
});
