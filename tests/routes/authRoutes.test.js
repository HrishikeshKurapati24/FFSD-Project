const request = require('supertest');
const app = require('../../testApp');
const { createTestBrand, createTestCustomer } = require('../setup/testHelpers');
const mongoose = require('mongoose');

describe('Auth Routes Integration', () => {
    describe('POST /auth/customer/signup', () => {
        it('should register a new customer successfully', async () => {
            const signupData = {
                name: 'New Customer',
                email: `new_user_${Date.now()}@example.com`,
                password: 'password123'
            };

            const res = await request(app)
                .post('/auth/customer/signup')
                .send(signupData);

            expect(res.status).toBe(201);
            expect(res.body.message).toContain('Signup successful');
            expect(res.body.customer).toBeDefined();
            expect(res.body.customer.email).toBe(signupData.email.toLowerCase());
        });

        it('should fail if email already exists', async () => {
            const customer = await createTestCustomer();
            const signupData = {
                name: 'Duplicate User',
                email: customer.email,
                password: 'password123'
            };

            const res = await request(app)
                .post('/auth/customer/signup')
                .send(signupData);

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Email already registered');
        });
    });

    describe('POST /auth/signin', () => {
        let brand;
        const password = 'password123';

        beforeEach(async () => {
            brand = await createTestBrand({ password });
        });

        it('should sign in successfully and return user data with cookies', async () => {
            const res = await request(app)
                .post('/auth/signin')
                .send({ email: brand.email, password });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Sign-in successful');
            expect(res.body.user).toBeDefined();
            expect(res.body.user.email).toBe(brand.email);
            expect(res.body.user.userType).toBe('brand');
            expect(res.headers['set-cookie']).toBeDefined();
        });

        it('should return 400 for incorrect password', async () => {
            const res = await request(app)
                .post('/auth/signin')
                .send({ email: brand.email, password: 'wrong_password' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid email or password');
        });

        it('should return 400 for non-existent user', async () => {
            const res = await request(app)
                .post('/auth/signin')
                .send({ email: 'nonexistent@example.com', password: 'password123' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Invalid email or password');
        });
    });

    describe('GET /auth/verify', () => {
        it('should return 401 if no session exists', async () => {
            const res = await request(app).get('/auth/verify');
            expect(res.status).toBe(401);
            expect(res.body.authenticated).toBe(false);
        });

        it('should return 200 and user info if session exists', async () => {
            const agent = request.agent(app);
            const brand = await createTestBrand({ password: 'password123' });

            // Sign in first to establish session
            await agent
                .post('/auth/signin')
                .send({ email: brand.email, password: 'password123' });

            const res = await agent.get('/auth/verify');
            expect(res.status).toBe(200);
            expect(res.body.authenticated).toBe(true);
            expect(res.body.user.email).toBe(brand.email);
        });
    });

    describe('POST /auth/logout', () => {
        it('should clear session and return success', async () => {
            const agent = request.agent(app);
            const brand = await createTestBrand({ password: 'password123' });

            await agent
                .post('/auth/signin')
                .send({ email: brand.email, password: 'password123' });

            const res = await agent.post('/auth/logout');
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Logged out successfully');

            // Verify session is gone
            const verifyRes = await agent.get('/auth/verify');
            expect(verifyRes.status).toBe(401);
        });
    });
});
