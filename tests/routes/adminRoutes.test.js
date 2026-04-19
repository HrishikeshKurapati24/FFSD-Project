const request = require('supertest');
const app = require('../../testApp');
const { getAuthenticatedAgent } = require('../setup/authContext');

describe('Admin Routes Integration', () => {
    let adminAgent;

    beforeAll(async () => {
        const ctx = await getAuthenticatedAgent('admin');
        adminAgent = ctx.agent;
    });

    describe('Access Control', () => {
        it('should return 401 for unauthenticated requests to /admin/dashboard', async () => {
            const res = await request(app)
                .get('/admin/dashboard')
                .set('Accept', 'application/json');

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('success', false);
        });

        it('should return 403 for a brand trying to access admin routes', async () => {
            const brandCtx = await getAuthenticatedAgent('brand');
            const res = await brandCtx.agent
                .get('/admin/dashboard')
                .set('Accept', 'application/json');

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('success', false);
        });
    });

    describe('GET /admin/dashboard', () => {
        it('should return 200 with dashboard data for authenticated admin', async () => {
            const res = await adminAgent
                .get('/admin/dashboard')
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('stats');
        });
    });

    describe('GET /admin/notifications', () => {
        it('should return 200 with notification list', async () => {
            const res = await adminAgent
                .get('/admin/notifications')
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('notifications');
        });
    });

    describe('GET /admin/brand-analytics', () => {
        it('should return 200 with analytics data', async () => {
            const res = await adminAgent
                .get('/admin/brand-analytics')
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });
    });

    describe('GET /admin/customer-management', () => {
        it('should return 200 with customer management data', async () => {
            const res = await adminAgent
                .get('/admin/customer-management')
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });
    });
});
