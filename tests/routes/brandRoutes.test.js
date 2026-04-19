const request = require('supertest');
const app = require('../../testApp');
const { getAuthenticatedAgent } = require('../setup/authContext');
const { createTestBrand, createTestInfluencer, createTestCampaign } = require('../setup/testHelpers');
const mongoose = require('mongoose');

describe('Brand Routes Integration', () => {
    let brandAgent, brand;

    beforeAll(async () => {
        const ctx = await getAuthenticatedAgent('brand');
        brandAgent = ctx.agent;
        brand = ctx.user;
    });

    // ── Authentication Guard ─────────────────────────────────────────
    describe('Access Control', () => {
        it('should return 401 for unauthenticated requests to /brand/home', async () => {
            const res = await request(app)
                .get('/brand/home')
                .set('Accept', 'application/json');

            // Could be 401 (JSON) or 302 (redirect to signin) in HTML path
            expect([401, 302]).toContain(res.status);
        });

        it('should return 403 for an influencer trying to access brand routes', async () => {
            const inflCtx = await getAuthenticatedAgent('influencer');
            const res = await inflCtx.agent
                .get('/brand/home')
                .set('Accept', 'application/json');

            expect([401, 403, 302]).toContain(res.status);
        });
    });

    // ── Profile ──────────────────────────────────────────────────────
    describe('GET /brand/profile', () => {
        it('should return 200 with brand profile for an authenticated brand', async () => {
            const res = await brandAgent
                .get('/brand/profile')
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);
        });
    });

    // ── Campaigns ────────────────────────────────────────────────────
    describe('Campaign Management', () => {
        it('GET /brand/campaigns/draft-list should return 200 with draft campaign list', async () => {
            const res = await brandAgent
                .get('/brand/campaigns/draft-list')
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('drafts');
        });

        it('GET /brand/campaigns/history should return 200 with campaign history', async () => {
            const res = await brandAgent
                .get('/brand/campaigns/history')
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('campaigns');
        });
    });

    // ── Home Dashboard ────────────────────────────────────────────────
    describe('GET /brand/home', () => {
        it('should return 200 with dashboard data for authenticated brand', async () => {
            const res = await brandAgent
                .get('/brand/home')
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);
        });
    });

    // ── Signout ───────────────────────────────────────────────────────
    describe('POST /brand/signout', () => {
        it('should clear session and return success', async () => {
            const signoutAgent = request.agent(app);
            const tempBrand = await createTestBrand({ password: 'password123' });
            await signoutAgent.post('/auth/signin').send({ email: tempBrand.email, password: 'password123' });

            const res = await signoutAgent
                .post('/brand/signout')
                .set('Accept', 'application/json');

            expect([200, 302]).toContain(res.status);
        });
    });
});
