# CollabSync Unit Testing Guide

This document explains how the unit testing suite is structured and how to run, maintain, and write new tests for the CollabSync backend.

## 🚀 How to Run Tests

The testing suite uses **Jest** and runs against the **Remote MongoDB** configured in your environment.

### Run All Tests
```bash
npm test
```

### Run Specific Service Tests Separately
You can run each of the 8 suites individually to verify specific business logic:

```bash
# 1. Payment Integration
npx jest tests/services/paymentIntentService.test.js

# 2. Razorpay Gateway logic
npx jest tests/services/razorpayGatewayService.test.js

# 3. Subscription Management
npx jest tests/services/subscriptionService.test.js

# 4. Collaboration Requests (Accept/Decline)
npx jest tests/services/collaborationRequestService.test.js

# 5. Collaboration Management (Dashboard/Progress)
npx jest tests/services/collaborationManageService.test.js

# 6. Admin User Management
npx jest tests/services/adminUserService.test.js

# 7. Brand Profile & Payment Profile
npx jest tests/services/brandProfileService.test.js

# 8. Influencer Profile & Analytics
npx jest tests/services/influencerProfileService.test.js

# Phase 3: Aggregations & Edge Cases
# 9. Complex Collaboration Aggregations
npx jest tests/services/collaborationAggregation.test.js

# 10. Concurrency & Race Conditions
npx jest tests/services/concurrency.test.js

# 11. Service Resiliency & Fallbacks
npx jest tests/services/resiliency.test.js

# Phase 4: Simulation Engine & Cross-Service Data Sync
# 12. Analytics Simulation
npx jest tests/services/analyticsSimulation.test.js

# 13. Denormalization Integrity & Cleanup Sync
npx jest tests/services/dataSync.test.js
```


### Run with Verbose Output
```bash
npx jest tests/services/brandProfileService.test.js --verbose
```

## 🏗️ Infrastructure Overview

### 1. Environment & Database (`tests/setup/`)
- **`envSetup.js`**: Loads test-specific environment variables.
- **`testApp.js`**: Managed the lifecycle of the test database connection. It ensures the DB is connected before tests run and cleaned up afterwards.

### 2. Test Helpers (`tests/setup/testHelpers.js`)
We use **Factory Functions** to create valid test data. Never create raw MongoDB documents in your tests; always use these helpers to ensure all required Mongoose fields are present.
- `createTestBrand(overrides)`
- `createTestInfluencer(overrides)`
- `createTestCampaign(brandId, overrides)`

### 3. Mocks (`tests/mocks/`)
External services are mocked to keep tests fast and independent:
- **Razorpay**: Simulates payments without calling the real API.
- **Redis/Elasticsearch**: Bypassed or simulated to focus on business logic.

## 📝 Writing a New Test

Follow this pattern when adding tests for a new service:

```javascript
const { createTestBrand } = require('../setup/testHelpers');
const MyService = require('../../services/MyService');

describe('MyService', () => {
    let brandId;

    beforeEach(async () => {
        // 1. Clean the collections you'll use
        await BrandInfo.deleteMany({});
        
        // 2. Seed necessary data using helpers
        const brand = await createTestBrand({ brandName: 'Test' });
        brandId = brand._id;
    });

    it('should perform a specific action', async () => {
        const result = await MyService.doSomething(brandId);
        expect(result.success).toBe(true);
    });
});
```

## ⚠️ Important Rules
1. **DB Isolation**: Always `deleteMany({})` in `beforeEach` for the collections your test touches.
2. **Schema Compliance**: If you add a required field to a Mongoose model, you **MUST** update `tests/setup/testHelpers.js` default values.
3. **No Side Effects**: Tests should not depend on the results of other tests. Use `beforeEach` to reset state.

## 📊 Current Coverage
The suite currently covers:
- Payment Intent & Gateway Services
- Subscription Lifecycle (Plans, Expiry, Usage)
- Collaboration Requests and Management
- Brand & Influencer Profiles
- Admin Management Workflows
- High-Performance Aggregation Pipelines (Monthly Earnings, Performance Metrics)
- Concurrent Metrics Sync Consistency
- External Service Fallbacks (Elasticsearch, Redis, Razorpay)
- Background Analytics Simulation (Saturation mathematical model)
- Cross-Service Data Synchronization (Denormalized metric integrity & Elasticsearch hooks)




