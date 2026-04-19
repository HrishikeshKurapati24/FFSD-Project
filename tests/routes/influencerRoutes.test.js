const request = require('supertest');
const app = require('../../testApp');
const { getAuthenticatedAgent } = require('../setup/authContext');
const { createTestInfluencer, createTestBrand } = require('../setup/testHelpers');

describe('Influencer Routes Integration', () => {
    let influencerAgent, influencer;

    beforeAll(async () => {
        const ctx = await getAuthenticatedAgent('influencer');
        influencerAgent = ctx.agent;
        influencer = ctx.user;
    });

    describe('Access Control', () => {
        it('should return 401 for unauthenticated requests to /influencer/home', async () => {
            const res = await request(app)
                .get('/influencer/home')
                .set('Accept', 'application/json');

            expect([401, 302]).toContain(res.status);
        });

        it('should return 403 for a brand trying to access influencer routes', async () => {
            const brandCtx = await getAuthenticatedAgent('brand');
            const res = await brandCtx.agent
                .get('/influencer/home')
                .set('Accept', 'application/json');

            expect([401, 403, 302]).toContain(res.status);
        });
    });

    describe('GET /influencer/home', () => {
        it('should return 200 with dashboard data for authenticated influencer', async () => {
            const res = await influencerAgent
                .get('/influencer/home')
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });
    });

    describe('GET /influencer/profile', () => {
        it('should return 200 with influencer profile', async () => {
            const res = await influencerAgent
                .get('/influencer/profile')
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('influencer');
            expect(res.body.influencer.email).toBe(influencer.email);
        });
    });

    describe('GET /influencer/explore', () => {
        it('should return 200 with brand discovery data', async () => {
            const res = await influencerAgent
                .get('/influencer/explore')
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('brands');
        });
    });

    describe('GET /influencer/collab', () => {
        it('should return 200 with available collaborations', async () => {
            const res = await influencerAgent
                .get('/influencer/collab')
                .set('Accept', 'application/json');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('collabs');
        });
    });
});
