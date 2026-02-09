/**
 * Real Backend Error Testing Script
 * Tests error handling middleware by sending invalid data to actual backend server (port 3000)
 * Requires database connection and running server
 *
 * Run with: node test-real-backend-errors.js
 */

const http = require('http');
const https = require('https');

// Configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const response = {
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body
                    };

                    // Try to parse JSON response
                    try {
                        response.json = JSON.parse(body);
                    } catch (e) {
                        response.text = body;
                    }

                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(data);
        }

        req.end();
    });
}

// Test cases for real backend errors
const testCases = [
    {
        name: 'Invalid JSON in request body',
        method: 'POST',
        url: `${BASE_URL}/signup-form-brand`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        data: '{invalid json: missing quotes}',
        expectedStatus: 400,
        description: 'Should trigger JSON parsing error'
    },
    {
        name: 'Missing required fields - Brand signup',
        method: 'POST',
        url: `${BASE_URL}/signup-form-brand`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        data: JSON.stringify({}),
        expectedStatus: 500,
        description: 'Should trigger validation/database error'
    },
    {
        name: 'Invalid email format - Brand signup',
        method: 'POST',
        url: `${BASE_URL}/signup-form-brand`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        data: JSON.stringify({
            brandName: 'Test Brand',
            email: 'invalid-email-format',
            password: 'password123'
        }),
        expectedStatus: 500,
        description: 'Should trigger database validation error'
    },
    {
        name: 'Empty request body - Brand signup',
        method: 'POST',
        url: `${BASE_URL}/signup-form-brand`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        data: JSON.stringify({}),
        expectedStatus: 500,
        description: 'Should trigger validation error'
    },
    {
        name: 'Invalid subscription plan request',
        method: 'GET',
        url: `${BASE_URL}/subscription/select-plan?userId=invalid&userType=invalid`,
        headers: {
            'Accept': 'application/json'
        },
        expectedStatus: 500,
        description: 'Should trigger database error for invalid user lookup'
    },
    {
        name: 'Invalid subscription plan ID',
        method: 'POST',
        url: `${BASE_URL}/subscription/subscribe-after-signup`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        data: JSON.stringify({
            userId: '507f1f77bcf86cd799439011',
            userType: 'brand',
            planId: 'nonexistent-plan-id',
            billingCycle: 'monthly'
        }),
        expectedStatus: 400,
        description: 'Should return 400 for invalid plan ID (client error, not server error)'
    },
    {
        name: 'Malformed subscription data',
        method: 'POST',
        url: `${BASE_URL}/subscription/subscribe-after-signup`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        data: JSON.stringify({
            userId: null,
            userType: '',
            planId: '',
            billingCycle: 'invalid'
        }),
        expectedStatus: 400,
        description: 'Should return 400 for missing required parameters (client validation error)'
    },
    {
        name: 'Invalid API endpoint',
        method: 'GET',
        url: `${API_BASE}/nonexistent-endpoint`,
        headers: {
            'Accept': 'application/json'
        },
        expectedStatus: 404,
        description: 'Should trigger 404 error'
    },
    {
        name: 'Invalid brands API with bad query',
        method: 'GET',
        url: `${API_BASE}/brands?status=invalid-status`,
        headers: {
            'Accept': 'application/json'
        },
        expectedStatus: 500,
        description: 'Should trigger database query error'
    },
    {
        name: 'Invalid influencers API with bad query',
        method: 'GET',
        url: `${API_BASE}/influencers?status=invalid-status`,
        headers: {
            'Accept': 'application/json'
        },
        expectedStatus: 500,
        description: 'Should trigger database query error'
    },
    {
        name: 'Unauthenticated admin route access',
        method: 'GET',
        url: `${BASE_URL}/admin/dashboard`,
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        expectedStatus: 302,
        description: 'Should redirect to login (page request)'
    },
    {
        name: 'Unauthenticated admin API access',
        method: 'GET',
        url: `${BASE_URL}/admin/verify`,
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        expectedStatus: 401,
        description: 'Should return 401 JSON error'
    },
    {
        name: 'Invalid signin credentials',
        method: 'POST',
        url: `${BASE_URL}/auth/signin`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        data: JSON.stringify({
            email: 'nonexistent@example.com',
            password: 'wrongpassword'
        }),
        expectedStatus: 400,
        description: 'Should return invalid credentials error'
    },
    {
        name: 'Invalid signin data format',
        method: 'POST',
        url: `${BASE_URL}/auth/signin`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        data: JSON.stringify({
            email: '',
            password: ''
        }),
        expectedStatus: 400,
        description: 'Should return validation error'
    },
    {
        name: 'Invalid customer signup - missing fields',
        method: 'POST',
        url: `${BASE_URL}/auth/customer/signup`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        data: JSON.stringify({
            name: '',
            email: 'invalid-email',
            password: ''
        }),
        expectedStatus: 400,
        description: 'Should return validation error'
    },
    {
        name: 'Invalid customer signup - duplicate email',
        method: 'POST',
        url: `${BASE_URL}/auth/customer/signup`,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        data: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com', // Assuming this exists
            password: 'password123'
        }),
        expectedStatus: 400,
        description: 'Should return duplicate email error'
    }
];

// Run all tests
async function runTests() {
    console.log('🧪 Real Backend Error Testing');
    console.log('==============================');
    console.log(`Testing server at: ${BASE_URL}`);
    console.log('Make sure your backend server is running on port 3000!');
    console.log('');

    let passed = 0;
    let failed = 0;

    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];

        try {
            console.log(`${i + 1}. ${testCase.name}`);
            console.log(`   ${testCase.description}`);

            // Prepare request options
            const url = new URL(testCase.url);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: testCase.method,
                headers: testCase.headers || {}
            };

            // Make the request
            const response = await makeRequest(options, testCase.data);

            // Check if status matches expected
            const statusMatch = response.statusCode === testCase.expectedStatus;

            if (statusMatch) {
                console.log(`   ✅ PASS - Status: ${response.statusCode} (expected: ${testCase.expectedStatus})`);
                passed++;

                // Additional checks for JSON responses
                if (response.headers['content-type']?.includes('application/json') && response.json) {
                    console.log(`   📄 JSON Response: ${JSON.stringify(response.json, null, 2)}`);
                } else if (response.text) {
                    console.log(`   📄 Text Response: ${response.text.substring(0, 200)}...`);
                }
            } else {
                console.log(`   ❌ FAIL - Status: ${response.statusCode} (expected: ${testCase.expectedStatus})`);
                failed++;
            }

            console.log('');

        } catch (error) {
            console.log(`   ❌ ERROR - ${error.message}`);
            failed++;
            console.log('');
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('==============================');
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    console.log('==============================');

    if (failed > 0) {
        console.log('❌ Some tests failed. Check the error responses above.');
        console.log('💡 Make sure your backend server is running and database is connected.');
    } else {
        console.log('✅ All tests passed! Error handling middleware is working correctly.');
    }

    process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running first
async function checkServerHealth() {
    try {
        console.log('🔍 Checking if backend server is running...');
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/',
            method: 'GET'
        });

        if (response.statusCode === 200) {
            console.log('✅ Backend server is running');
            return true;
        } else {
            console.log('❌ Backend server returned unexpected status:', response.statusCode);
            return false;
        }
    } catch (error) {
        console.log('❌ Cannot connect to backend server. Make sure it\'s running on port 3000');
        console.log('💡 Start your server with: npm start');
        return false;
    }
}

// Main execution
async function main() {
    const serverRunning = await checkServerHealth();

    if (!serverRunning) {
        console.log('');
        console.log('To start your backend server:');
        console.log('1. Open a new terminal');
        console.log('2. cd FFSD-Project');
        console.log('3. npm start');
        console.log('4. Wait for "Server is running on port 3000" message');
        console.log('5. Run this test script again');
        process.exit(1);
    }

    console.log('');
    await runTests();
}

main().catch(console.error);
