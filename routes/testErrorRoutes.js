/**
 * Error Testing Routes
 * Test all major error handling types
 * 
 * Access these routes to see how different errors are handled:
 * - http://localhost:6000/test-errors/validation
 * - http://localhost:6000/test-errors/authentication
 * - http://localhost:6000/test-errors/authorization
 * - http://localhost:6000/test-errors/not-found
 * - http://localhost:6000/test-errors/database
 * - http://localhost:6000/test-errors/network
 * - http://localhost:6000/test-errors/rate-limit
 * - http://localhost:6000/test-errors/generic
 */

const express = require('express');
const router = express.Router();
const {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    DatabaseError,
    NetworkError,
    RateLimitError,
    NotFoundError
} = require('../utils/errorHandlers');

// Test 1: ValidationError (400)
router.get('/validation', (req, res, next) => {
    // Simulate validation error - like invalid form input
    throw new ValidationError('Invalid email format', {
        errors: [
            { field: 'email', message: 'Email must be a valid email address', value: 'invalid-email' },
            { field: 'password', message: 'Password must be at least 8 characters', value: '123' }
        ]
    });
});

// Test 2: AuthenticationError (401)
router.get('/authentication', (req, res, next) => {
    // Simulate authentication error - like invalid credentials
    throw new AuthenticationError('Invalid email or password');
});

// Test 3: AuthorizationError (403)
router.get('/authorization', (req, res, next) => {
    // Simulate authorization error - like accessing admin-only resource
    throw new AuthorizationError('Access denied: Admin privileges required');
});

// Test 4: NotFoundError (404)
router.get('/not-found', (req, res, next) => {
    // Simulate resource not found
    throw new NotFoundError('Campaign not found', {
        resource: 'campaign',
        id: '507f1f77bcf86cd799439011'
    });
});

// Test 5: RateLimitError (429)
router.get('/rate-limit', (req, res, next) => {
    // Simulate rate limit error - like exceeding subscription limits
    throw new RateLimitError('You have reached your plan limit for campaign creation', {
        limit: 5,
        current: 5,
        redirectUrl: '/subscription/manage'
    });
});

// Test 6: DatabaseError (500)
router.get('/database', (req, res, next) => {
    // Simulate database error
    throw new DatabaseError('Failed to connect to MongoDB', {
        host: 'localhost:27017',
        database: 'ffsd'
    });
});

// Test 7: NetworkError (503)
router.get('/network', (req, res, next) => {
    // Simulate network/external API error
    throw new NetworkError('Failed to upload image to Cloudinary', {
        service: 'Cloudinary',
        originalError: 'Connection timeout after 30s'
    });
});

// Test 8: Generic AppError (500)
router.get('/generic', (req, res, next) => {
    // Simulate generic application error
    throw new AppError('An unexpected error occurred', 500, {
        context: 'Processing user request',
        timestamp: new Date().toISOString()
    });
});

// Test 9: Async Error (demonstrates error handling in async routes)
router.get('/async', async (req, res, next) => {
    try {
        // Simulate async operation that fails
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                reject(new Error('Async operation failed'));
            }, 100);
        });
    } catch (error) {
        throw new NetworkError('Async operation timed out', {
            originalError: error.message
        });
    }
});

// Test 10: Role-specific error (Brand user)
router.get('/brand-limit', (req, res, next) => {
    // Simulate brand hitting campaign limit
    throw new RateLimitError('You have reached your plan limit. Upgrade to create more campaigns.', {
        planType: 'Basic',
        limit: 3,
        current: 3,
        redirectUrl: '/subscription/manage'
    });
});

// Test 11: Role-specific error (Influencer user)
router.get('/influencer-verify', (req, res, next) => {
    // Simulate unverified influencer trying to apply
    throw new AuthorizationError('Your account is pending verification. You will be able to apply to campaigns once verified.', {
        verified: false,
        accountStatus: 'pending'
    });
});

// Test 12: Payment error
router.get('/payment-declined', (req, res, next) => {
    // Simulate payment declined
    throw new ValidationError('Payment declined. Please check your card details.', {
        field: 'payment',
        cardLast4: '4242',
        declineCode: 'insufficient_funds'
    });
});

// Test 13: MongoDB CastError simulation
router.get('/invalid-id', (req, res, next) => {
    // Simulate invalid MongoDB ObjectId
    const error = new Error('Cast to ObjectId failed');
    error.name = 'CastError';
    error.path = 'campaignId';
    error.value = 'invalid-id-123';

    throw new NotFoundError('Invalid campaign ID format');
});

// Test 14: Multiple validation errors
router.get('/multiple-validation', (req, res, next) => {
    throw new ValidationError('Profile validation failed', {
        errors: [
            { field: 'fullName', message: 'Full name is required' },
            { field: 'bio', message: 'Bio must be at least 50 characters' },
            { field: 'categories', message: 'At least one category is required' },
            { field: 'profilePicUrl', message: 'Profile picture is required' }
        ]
    });
});

// Test 15: Test with different user types (requires session)
router.get('/role-test/:userType', (req, res, next) => {
    const { userType } = req.params;

    // Temporarily set user type in session for testing
    if (!req.session.user) {
        req.session.user = {};
    }
    req.session.user.userType = userType;

    // Throw a generic error to see role-specific handling
    throw new AppError(`Testing error page for ${userType} user`, 500, {
        testMode: true,
        userType: userType
    });
});

// Test 16: API vs Browser request test
router.get('/api-test', (req, res, next) => {
    // This will return JSON if Accept header includes 'application/json'
    // Otherwise, it will render HTML error page
    throw new ValidationError('This error response format depends on your request headers', {
        hint: 'Try with Accept: application/json header for JSON response'
    });
});

// Landing page for error testing
router.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error Testing Dashboard</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 40px 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        h1 {
          color: #2c3e50;
          margin-bottom: 10px;
          font-size: 36px;
        }
        .subtitle {
          color: #7f8c8d;
          margin-bottom: 40px;
          font-size: 18px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        .card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          border-color: #667eea;
        }
        .card h3 {
          color: #2c3e50;
          margin-bottom: 10px;
          font-size: 20px;
        }
        .card p {
          color: #7f8c8d;
          margin-bottom: 15px;
          font-size: 14px;
          line-height: 1.6;
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .badge-400 { background: #f39c12; color: white; }
        .badge-401 { background: #e74c3c; color: white; }
        .badge-403 { background: #c0392b; color: white; }
        .badge-404 { background: #95a5a6; color: white; }
        .badge-429 { background: #e67e22; color: white; }
        .badge-500 { background: #34495e; color: white; }
        .badge-503 { background: #9b59b6; color: white; }
        .btn {
          display: inline-block;
          padding: 10px 20px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .section {
          margin-bottom: 40px;
        }
        .section h2 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 24px;
          border-bottom: 3px solid #667eea;
          padding-bottom: 10px;
        }
        .info-box {
          background: #e8f4f8;
          border-left: 4px solid #3498db;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .info-box h4 {
          color: #2c3e50;
          margin-bottom: 10px;
        }
        .info-box ul {
          margin-left: 20px;
          color: #555;
        }
        .info-box li {
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🧪 Error Handling Test Dashboard</h1>
        <p class="subtitle">Click any button below to test different error types and see how they're handled</p>
        
        <div class="info-box">
          <h4>📝 How to Test:</h4>
          <ul>
            <li><strong>Browser Test:</strong> Click any button to see the HTML error page</li>
            <li><strong>API Test:</strong> Use curl or Postman with <code>Accept: application/json</code> header to see JSON response</li>
            <li><strong>Role Test:</strong> Use the role-specific tests to see different error pages for different user types</li>
          </ul>
        </div>

        <div class="section">
          <h2>Client Errors (4xx)</h2>
          <div class="grid">
            <div class="card">
              <span class="badge badge-400">400</span>
              <h3>Validation Error</h3>
              <p>Invalid form input with multiple field errors</p>
              <a href="/test-errors/validation" class="btn">Test Validation</a>
            </div>
            
            <div class="card">
              <span class="badge badge-401">401</span>
              <h3>Authentication Error</h3>
              <p>Invalid credentials or expired session</p>
              <a href="/test-errors/authentication" class="btn">Test Auth</a>
            </div>
            
            <div class="card">
              <span class="badge badge-403">403</span>
              <h3>Authorization Error</h3>
              <p>Insufficient permissions to access resource</p>
              <a href="/test-errors/authorization" class="btn">Test Authorization</a>
            </div>
            
            <div class="card">
              <span class="badge badge-404">404</span>
              <h3>Not Found Error</h3>
              <p>Resource doesn't exist in database</p>
              <a href="/test-errors/not-found" class="btn">Test Not Found</a>
            </div>
            
            <div class="card">
              <span class="badge badge-429">429</span>
              <h3>Rate Limit Error</h3>
              <p>Subscription limit exceeded</p>
              <a href="/test-errors/rate-limit" class="btn">Test Rate Limit</a>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Server Errors (5xx)</h2>
          <div class="grid">
            <div class="card">
              <span class="badge badge-500">500</span>
              <h3>Database Error</h3>
              <p>MongoDB connection or query failure</p>
              <a href="/test-errors/database" class="btn">Test Database</a>
            </div>
            
            <div class="card">
              <span class="badge badge-503">503</span>
              <h3>Network Error</h3>
              <p>External API or service failure</p>
              <a href="/test-errors/network" class="btn">Test Network</a>
            </div>
            
            <div class="card">
              <span class="badge badge-500">500</span>
              <h3>Generic Error</h3>
              <p>Unexpected application error</p>
              <a href="/test-errors/generic" class="btn">Test Generic</a>
            </div>
            
            <div class="card">
              <span class="badge badge-503">503</span>
              <h3>Async Error</h3>
              <p>Async operation timeout</p>
              <a href="/test-errors/async" class="btn">Test Async</a>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Role-Specific Errors</h2>
          <div class="grid">
            <div class="card">
              <span class="badge badge-429">429</span>
              <h3>Brand Limit</h3>
              <p>Brand campaign creation limit</p>
              <a href="/test-errors/brand-limit" class="btn">Test Brand</a>
            </div>
            
            <div class="card">
              <span class="badge badge-403">403</span>
              <h3>Influencer Verify</h3>
              <p>Unverified influencer access</p>
              <a href="/test-errors/influencer-verify" class="btn">Test Influencer</a>
            </div>
            
            <div class="card">
              <span class="badge badge-400">400</span>
              <h3>Payment Declined</h3>
              <p>Payment card declined</p>
              <a href="/test-errors/payment-declined" class="btn">Test Payment</a>
            </div>
            
            <div class="card">
              <span class="badge badge-404">404</span>
              <h3>Invalid ID</h3>
              <p>Invalid MongoDB ObjectId</p>
              <a href="/test-errors/invalid-id" class="btn">Test Invalid ID</a>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Advanced Tests</h2>
          <div class="grid">
            <div class="card">
              <span class="badge badge-400">400</span>
              <h3>Multiple Validation</h3>
              <p>Multiple field validation errors</p>
              <a href="/test-errors/multiple-validation" class="btn">Test Multiple</a>
            </div>
            
            <div class="card">
              <span class="badge badge-500">500</span>
              <h3>Admin Role Test</h3>
              <p>See admin error page (with stack trace)</p>
              <a href="/test-errors/role-test/admin" class="btn">Test Admin</a>
            </div>
            
            <div class="card">
              <span class="badge badge-500">500</span>
              <h3>Brand Role Test</h3>
              <p>See brand-specific error page</p>
              <a href="/test-errors/role-test/brand" class="btn">Test Brand Role</a>
            </div>
            
            <div class="card">
              <span class="badge badge-500">500</span>
              <h3>Influencer Role Test</h3>
              <p>See influencer-specific error page</p>
              <a href="/test-errors/role-test/influencer" class="btn">Test Influencer Role</a>
            </div>
            
            <div class="card">
              <span class="badge badge-400">400</span>
              <h3>API vs Browser</h3>
              <p>Test JSON vs HTML response</p>
              <a href="/test-errors/api-test" class="btn">Test Response Format</a>
            </div>
          </div>
        </div>

        <div class="info-box">
          <h4>🔍 Testing with curl (API JSON responses):</h4>
          <ul>
            <li><code>curl -H "Accept: application/json" http://localhost:6000/test-errors/validation</code></li>
            <li><code>curl -H "Accept: application/json" http://localhost:6000/test-errors/authentication</code></li>
            <li><code>curl -H "Accept: application/json" http://localhost:6000/test-errors/rate-limit</code></li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `);
});

module.exports = router;
