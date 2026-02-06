# Error Testing Guide

## 🧪 How to Test All Error Types

I've created a comprehensive error testing dashboard at:
**http://localhost:6000/test-errors**

---

## Quick Start

1. **Make sure your server is running**:
   ```bash
   npm start
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:6000/test-errors
   ```

3. **Click any button** to test different error types

---

## Available Test Routes

### Client Errors (4xx)

#### 1. **Validation Error (400)**
- **URL**: http://localhost:6000/test-errors/validation
- **Tests**: Invalid form input with multiple field errors
- **Expected**: Error page showing email and password validation errors

#### 2. **Authentication Error (401)**
- **URL**: http://localhost:6000/test-errors/authentication
- **Tests**: Invalid credentials
- **Expected**: Error page with "Sign In" button

#### 3. **Authorization Error (403)**
- **URL**: http://localhost:6000/test-errors/authorization
- **Tests**: Insufficient permissions
- **Expected**: Error page with "Access denied" message

#### 4. **Not Found Error (404)**
- **URL**: http://localhost:6000/test-errors/not-found
- **Tests**: Resource doesn't exist
- **Expected**: Error page with 🔍 icon and "Campaign not found"

#### 5. **Rate Limit Error (429)**
- **URL**: http://localhost:6000/test-errors/rate-limit
- **Tests**: Subscription limit exceeded
- **Expected**: Error page with "Upgrade Plan" button

---

### Server Errors (5xx)

#### 6. **Database Error (500)**
- **URL**: http://localhost:6000/test-errors/database
- **Tests**: MongoDB connection failure
- **Expected**: Error page with database connection error

#### 7. **Network Error (503)**
- **URL**: http://localhost:6000/test-errors/network
- **Tests**: External API failure (Cloudinary)
- **Expected**: Error page with network timeout message

#### 8. **Generic Error (500)**
- **URL**: http://localhost:6000/test-errors/generic
- **Tests**: Unexpected application error
- **Expected**: Generic error page with ⚠️ icon

#### 9. **Async Error (503)**
- **URL**: http://localhost:6000/test-errors/async
- **Tests**: Async operation timeout
- **Expected**: Network error page

---

### Role-Specific Errors

#### 10. **Brand Limit (429)**
- **URL**: http://localhost:6000/test-errors/brand-limit
- **Tests**: Brand campaign creation limit
- **Expected**: Error page with upgrade message and subscription link

#### 11. **Influencer Verification (403)**
- **URL**: http://localhost:6000/test-errors/influencer-verify
- **Tests**: Unverified influencer access
- **Expected**: Error page with verification pending message

#### 12. **Payment Declined (400)**
- **URL**: http://localhost:6000/test-errors/payment-declined
- **Tests**: Payment card declined
- **Expected**: Error page with payment retry guidance

#### 13. **Invalid ID (404)**
- **URL**: http://localhost:6000/test-errors/invalid-id
- **Tests**: Invalid MongoDB ObjectId
- **Expected**: Error page with "Invalid campaign ID format"

---

### Advanced Tests

#### 14. **Multiple Validation Errors (400)**
- **URL**: http://localhost:6000/test-errors/multiple-validation
- **Tests**: Multiple field validation errors
- **Expected**: Error page showing 4 validation errors

#### 15. **Admin Role Test (500)**
- **URL**: http://localhost:6000/test-errors/role-test/admin
- **Tests**: Admin-specific error page
- **Expected**: Error page WITH technical details and stack trace

#### 16. **Brand Role Test (500)**
- **URL**: http://localhost:6000/test-errors/role-test/brand
- **Tests**: Brand-specific error page
- **Expected**: Error page with brand-specific action buttons

#### 17. **Influencer Role Test (500)**
- **URL**: http://localhost:6000/test-errors/role-test/influencer
- **Tests**: Influencer-specific error page
- **Expected**: Error page with influencer-specific action buttons

#### 18. **API vs Browser Test (400)**
- **URL**: http://localhost:6000/test-errors/api-test
- **Tests**: Response format detection
- **Expected**: HTML error page in browser

---

## Testing API Responses (JSON)

Use curl or Postman to test JSON error responses:

### Example 1: Validation Error
```bash
curl -H "Accept: application/json" http://localhost:6000/test-errors/validation
```

**Expected JSON Response**:
```json
{
  "success": false,
  "message": "Invalid email format",
  "errorCode": "ValidationError",
  "statusCode": 400,
  "errors": [
    {
      "field": "email",
      "message": "Email must be a valid email address",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "value": "123"
    }
  ],
  "timestamp": "2026-02-06T10:16:40.000Z",
  "path": "/test-errors/validation"
}
```

### Example 2: Authentication Error
```bash
curl -H "Accept: application/json" http://localhost:6000/test-errors/authentication
```

**Expected JSON Response**:
```json
{
  "success": false,
  "message": "Invalid email or password",
  "errorCode": "AuthenticationError",
  "statusCode": 401,
  "timestamp": "2026-02-06T10:16:40.000Z",
  "path": "/test-errors/authentication"
}
```

### Example 3: Rate Limit Error
```bash
curl -H "Accept: application/json" http://localhost:6000/test-errors/rate-limit
```

**Expected JSON Response**:
```json
{
  "success": false,
  "message": "You have reached your plan limit for campaign creation",
  "errorCode": "RateLimitError",
  "statusCode": 429,
  "timestamp": "2026-02-06T10:16:40.000Z",
  "path": "/test-errors/rate-limit",
  "details": {
    "limit": 5,
    "current": 5,
    "redirectUrl": "/subscription/manage"
  }
}
```

---

## What to Look For

### ✅ Browser Tests (HTML Response)

When testing in browser, verify:

1. **Error Icon** changes based on status code:
   - 🔍 for 404
   - 🚫 for 403
   - 🔒 for 401
   - ⏱️ for 429
   - ⚠️ for others

2. **Error Code** displays correctly (400, 401, 403, 404, 429, 500, 503)

3. **Error Type** shows the error class name (ValidationError, AuthenticationError, etc.)

4. **Help Text** is contextual and helpful

5. **Action Buttons** are appropriate:
   - "Sign In" for authentication errors
   - "Upgrade Plan" for rate limit errors
   - "Go Back" and "Home" for generic errors

6. **User Badge** shows current user type (for role tests)

7. **Technical Details** only visible for admin users

### ✅ API Tests (JSON Response)

When testing with curl/Postman, verify:

1. **Correct status code** in HTTP response
2. **JSON structure** includes:
   - `success: false`
   - `message` - error message
   - `errorCode` - error type
   - `statusCode` - HTTP status
   - `timestamp` - when error occurred
   - `path` - route that errored
3. **Error details** included when relevant
4. **No stack trace** in production (only in development)

---

## Check the Logs

After triggering errors, check the console output. You should see:

```
================================================================================
🚨 ERROR: ValidationError [400]
================================================================================
⏰ Time: 2026-02-06T10:16:40.123Z
📍 Route: GET /test-errors/validation
👤 User: guest (null)
💬 Message: Invalid email format
📋 Details: {
  "errors": [
    {
      "field": "email",
      "message": "Email must be a valid email address",
      "value": "invalid-email"
    }
  ]
}
================================================================================
```

In production, errors are also logged to `logs/error-YYYY-MM-DD.log`

---

## Testing Checklist

- [ ] Open http://localhost:6000/test-errors in browser
- [ ] Test all 18 error types from the dashboard
- [ ] Verify error icons change appropriately
- [ ] Check action buttons are contextual
- [ ] Test admin role to see technical details
- [ ] Test brand role to see brand-specific buttons
- [ ] Test influencer role to see influencer-specific buttons
- [ ] Use curl to test JSON responses for at least 3 error types
- [ ] Check console logs show structured error information
- [ ] Verify different user types see different error pages

---

## Cleanup (Optional)

After testing, you can remove the test routes by:

1. Commenting out or removing this line in `app.js`:
   ```javascript
   app.use('/test-errors', require('./routes/testErrorRoutes'));
   ```

2. Or keep it for future testing (recommended during development)

---

## Summary

You now have a complete testing suite for all error types! The dashboard provides:

- ✅ **16 different error scenarios**
- ✅ **Visual testing interface**
- ✅ **Both HTML and JSON response testing**
- ✅ **Role-specific error page testing**
- ✅ **Structured error logging verification**

Enjoy testing! 🎉
