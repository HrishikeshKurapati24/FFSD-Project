const { asyncErrorWrapper, asyncErrorWrapperWithContext } = require('../../middleware/asyncErrorWrapper');
const errorHandler = require('../../middleware/errorHandler');

describe('Error Handling Middleware', () => {
    describe('asyncErrorWrapper', () => {
        it('should call next with the error when an async function rejects', async () => {
            const error = new Error('Async Failure');
            const fn = async () => { throw error; };
            const next = jest.fn();
            const req = {};
            const res = {};

            const wrapped = asyncErrorWrapper(fn);
            wrapped(req, res, next);

            // Need to wait for promise resolution
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(next).toHaveBeenCalledWith(error);
        });

        it('should call next with the error when a sync function throws', async () => {
            const error = new Error('Sync Failure');
            const fn = () => { throw error; };
            const next = jest.fn();
            const req = {};
            const res = {};

            const wrapped = asyncErrorWrapper(fn);
            wrapped(req, res, next);

            await new Promise(resolve => setTimeout(resolve, 0));
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('errorHandler', () => {
        let req, res, next;

        beforeEach(() => {
            req = {
                method: 'GET',
                originalUrl: '/test',
                get: jest.fn().mockReturnValue('test-agent'),
                ip: '127.0.0.1',
                session: {}
            };
            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            };
            next = jest.fn();
        });

        it('should return 500 and success: false for a generic error', () => {
            const err = new Error('Something went wrong');
            
            errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    message: 'Something went wrong'
                })
            }));
        });

        it('should categorize ValidationError correctly', () => {
            const err = new Error('Validation failed');
            err.name = 'ValidationError';

            errorHandler(err, req, res, next);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.objectContaining({
                    code: 'VALIDATION'
                })
            }));
        });

        it('should use error.statusCode if provided', () => {
            const err = new Error('Not Found');
            err.statusCode = 404;

            errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should mask detailed errors in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            
            const err = new Error('Secret DB Error');
            err.stack = 'Secret stack trace';
            
            errorHandler(err, req, res, next);

            const response = res.json.mock.calls[0][0];
            expect(response.error.details).toBeUndefined();
            
            process.env.NODE_ENV = originalEnv;
        });

        it('should include user info in logs if available', () => {
            req.user = { id: 'user123', userType: 'brand', email: 'test@brand.com' };
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            
            const err = new Error('Critical');
            err.statusCode = 500;
            
            errorHandler(err, req, res, next);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('user123')
            );
            consoleSpy.mockRestore();
        });
    });
});
