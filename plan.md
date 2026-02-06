# Detailed Error Handling Implementation Plan

## Current Status of Error Handling

### Global Error Handling
- **Location**: `app.js` (lines ~300-305)
- **Implementation**: Basic middleware that catches unhandled errors, logs to console, and renders a generic 'error' view with status code and message.
- **Limitations**: No differentiation by route type, user role, or error category. All errors result in the same generic response.

### Route-Specific Error Handling
- **Current State**: Most routes in `routes/` files have try-catch blocks, but they are generic:
  - Console logging of errors
  - Standard 500 status responses
  - Basic JSON responses or error page renders
- **Examples**:
  - `subscriptionRoutes.js`: Multiple try-catch blocks, all log to console and return 500 with generic messages
  - `influencerRoutes.js`: Similar pattern, with some validation error handling but still generic 500 responses
- **Error Page**: `views/error.ejs` - Simple HTML page showing error code and message, with a "Back to Home" link.

### Identified Issues
- No role-based error handling (different for admin, brand, influencer, customer)
- No error categorization (validation, authentication, database, network, etc.)
- Inconsistent error responses (some JSON, some HTML renders)
- Limited logging (only console.error)
- No error tracking or monitoring
- Generic error pages don't provide user-specific guidance

## Proposed Implementation Plan

### 1. Create Centralized Error Handling System

#### 1.1 Error Types and Categories
- **ValidationError**: For input validation failures
- **AuthenticationError**: For auth-related issues
- **AuthorizationError**: For permission/access issues
- **DatabaseError**: For MongoDB/connection issues
- **NetworkError**: For external API failures
- **RateLimitError**: For rate limiting
- **GenericError**: Fallback for unhandled errors

#### 1.2 Error Handler Classes
- Create `utils/errorHandlers.js` with specific handler classes for each user type:
  - `AdminErrorHandler`
  - `BrandErrorHandler`
  - `InfluencerErrorHandler`
  - `CustomerErrorHandler`
  - `AuthErrorHandler`
  - `SubscriptionErrorHandler`

Each handler will:
- Log errors with context (user ID, route, timestamp)
- Format responses appropriately (JSON for API calls, HTML for page renders)
- Send user-specific error pages or messages
- Track error metrics if needed

### 2. Update Route Files with Specific Error Handling

#### 2.1 Influencer Routes (`routes/influencerRoutes.js`)
- Replace generic try-catch with specific error handlers
- Use `InfluencerErrorHandler` for profile updates, collaborations, etc.
- Handle validation errors with detailed field-specific messages
- For API endpoints: Return structured JSON errors
- For page renders: Use custom error page with influencer-specific messaging

#### 2.2 Brand Routes (`routes/brandRoutes.js`)
- Similar to influencer, but with brand-specific context
- Handle campaign creation errors, payment issues, etc.
- Custom error messages for business logic failures

#### 2.3 Customer Routes (`routes/customerRoutes.js`)
- Focus on purchase and interaction errors
- Handle payment failures, subscription issues
- User-friendly error messages for end customers

#### 2.4 Admin Routes (`routes/adminRoutes.js`)
- Detailed logging for admin actions
- Secure error responses (don't expose sensitive info)
- Admin-specific error dashboard integration

#### 2.5 Subscription Routes (`routes/subscriptionRoutes.js`)
- Payment-specific error handling
- Subscription logic error categorization
- Integration with payment provider error codes

#### 2.6 Auth Routes (`routes/authRoutes.js`)
- Authentication failure handling
- Session management errors
- Security-focused error responses

### 3. Middleware Updates

#### 4.1 Global Error Middleware Enhancement
- Update `app.js` error middleware to use the new error handler system
- Add error categorization logic
- Route to appropriate handler based on request path and user type

#### 4.2 Request Context Middleware
- Add middleware to attach user context to requests
- Include user type, ID, and route information for error handling

### 5. Logging and Monitoring

#### 5.1 Enhanced Logging
- Implement structured logging with Winston or similar
- Log errors with full context (stack traces, user info, request details)
- Separate log levels for different error types

#### 5.2 Error Tracking
- Add error aggregation and alerting
- Track error rates by route and user type
- Generate error reports for monitoring

### 6. Testing and Validation

#### 6.1 Unit Tests
- Test each error handler class
- Mock different error scenarios
- Verify correct responses and logging

#### 6.2 Integration Tests
- Test error handling in actual route contexts
- Verify user-specific error pages render correctly
- Test API error responses

## Implementation Order

1. Create error handler utilities (`utils/errorHandlers.js`)
2. Update global error middleware in `app.js`
3. Update individual route files one by one (start with influencerRoutes.js)
4. Create/update error view templates
5. Add logging enhancements
6. Implement testing

## Benefits

- **User Experience**: Role-specific error messages and pages
- **Debugging**: Better logging and error categorization
- **Security**: Prevent information leakage in error responses
- **Maintainability**: Centralized error handling logic
- **Monitoring**: Better error tracking and alerting

## Dependencies

- No new npm packages required (can use existing Winston if available)
- Requires updates to all route files
- May need database schema updates for error logging if implemented

## Risk Assessment

- **Low Risk**: Changes are additive and don't affect core functionality
- **Testing Required**: Comprehensive testing of error scenarios
- **Backward Compatibility**: Existing error responses should be maintained where possible

## Next Steps

1. Review and approve this plan
2. Begin implementation with error handler utilities
3. Update routes incrementally
4. Test thoroughly before deployment

---

## Test Cases for Error Handling Implementation

### 1. Authentication & Authorization Error Tests

#### 1.1 Auth Routes (`/auth/*`)
- **Test Case 1.1.1**: Login with invalid credentials
  - **Input**: POST `/auth/signin` with wrong email/password
  - **Expected**: 401 status, JSON response with `{ success: false, message: "Invalid credentials" }`
  - **Error Type**: AuthenticationError

- **Test Case 1.1.2**: Login with missing fields
  - **Input**: POST `/auth/signin` with empty email or password
  - **Expected**: 400 status, validation error with field-specific messages
  - **Error Type**: ValidationError

- **Test Case 1.1.3**: Access protected route without authentication
  - **Input**: GET `/influencer/home` without session
  - **Expected**: 302 redirect to `/SignIn` or 401 JSON for API requests
  - **Error Type**: AuthenticationError

- **Test Case 1.1.4**: Access route with wrong user type
  - **Input**: Brand user accessing `/influencer/home`
  - **Expected**: 403 status with `{ message: "Access denied: User is not an influencer" }`
  - **Error Type**: AuthorizationError

### 2. Influencer Routes Error Tests (`/influencer/*`)

#### 2.1 Profile Update Errors
- **Test Case 2.1.1**: Update profile with invalid username format
  - **Input**: POST `/influencer/profile/update/data` with username containing special characters
  - **Expected**: 400 status, validation error: `{ username: "Username can only contain letters, numbers, and underscores" }`
  - **Error Type**: ValidationError

- **Test Case 2.1.2**: Update profile with bio exceeding 500 characters
  - **Input**: POST `/influencer/profile/update/data` with 501 character bio
  - **Expected**: 400 status, validation error: `{ bio: "Bio must be less than 500 characters" }`
  - **Error Type**: ValidationError

- **Test Case 2.1.3**: Upload profile image exceeding size limit
  - **Input**: POST `/influencer/profile/update-images` with 60MB file
  - **Expected**: 400 status, `{ success: false, message: "File size exceeds 50MB limit" }`
  - **Error Type**: ValidationError

- **Test Case 2.1.4**: Upload invalid file type for profile picture
  - **Input**: POST `/influencer/profile/update-images` with .exe file
  - **Expected**: 400 status, `{ success: false, message: "Invalid file type. Only images allowed" }`
  - **Error Type**: ValidationError

#### 2.2 Campaign Application Errors
- **Test Case 2.2.1**: Apply to non-existent campaign
  - **Input**: POST `/influencer/apply/invalid-campaign-id`
  - **Expected**: 404 status, `{ success: false, message: "Campaign not found" }`
  - **Error Type**: DatabaseError

- **Test Case 2.2.2**: Apply to campaign when not verified
  - **Input**: POST `/influencer/apply/:campaignId` with unverified influencer
  - **Expected**: 400 status, `{ success: false, message: "Your account is not verified. Please wait for verification." }`
  - **Error Type**: AuthorizationError

- **Test Case 2.2.3**: Apply when subscription limit reached
  - **Input**: POST `/influencer/apply/:campaignId` with free plan at limit
  - **Expected**: 400 status, `{ success: false, message: "...", showUpgradeLink: true }`
  - **Error Type**: RateLimitError

- **Test Case 2.2.4**: Apply to campaign with expired subscription
  - **Input**: POST `/influencer/apply/:campaignId` with expired subscription
  - **Expected**: 403 status, `{ success: false, expired: true, redirectUrl: "/subscription/manage" }`
  - **Error Type**: AuthorizationError

- **Test Case 2.2.5**: Duplicate application to same campaign
  - **Input**: POST `/influencer/apply/:campaignId` when already applied
  - **Expected**: 400 status, `{ success: false, message: "You have already applied to this campaign" }`
  - **Error Type**: ValidationError

#### 2.3 Collaboration View Errors
- **Test Case 2.3.1**: View collaboration details for non-existent campaign
  - **Input**: GET `/influencer/collab/invalid-id`
  - **Expected**: 404 status, render error page with "Collaboration not found"
  - **Error Type**: DatabaseError

- **Test Case 2.3.2**: Database connection failure
  - **Input**: GET `/influencer/collab` when MongoDB is down
  - **Expected**: 500 status, `{ success: false, message: "Error loading campaign requests" }` for API
  - **Error Type**: DatabaseError

### 3. Brand Routes Error Tests (`/brand/*`)

#### 3.1 Campaign Creation Errors
- **Test Case 3.1.1**: Create campaign with missing required fields
  - **Input**: POST `/brand/campaign/create` without title or budget
  - **Expected**: 400 status, validation errors for each missing field
  - **Error Type**: ValidationError

- **Test Case 3.1.2**: Create campaign with negative budget
  - **Input**: POST `/brand/campaign/create` with budget = -100
  - **Expected**: 400 status, `{ budget: "Budget must be a positive number" }`
  - **Error Type**: ValidationError

- **Test Case 3.1.3**: Create campaign when subscription limit reached
  - **Input**: POST `/brand/campaign/create` with free plan at 2 campaigns
  - **Expected**: 403 status, redirect to upgrade page
  - **Error Type**: RateLimitError

#### 3.2 Influencer Management Errors
- **Test Case 3.2.1**: Invite non-existent influencer
  - **Input**: POST `/brand/campaign/:id/invite` with invalid influencer ID
  - **Expected**: 404 status, `{ success: false, message: "Influencer not found" }`
  - **Error Type**: DatabaseError

- **Test Case 3.2.2**: Accept/reject application for non-existent campaign
  - **Input**: POST `/brand/campaign/invalid-id/accept`
  - **Expected**: 404 status, `{ success: false, message: "Campaign not found" }`
  - **Error Type**: DatabaseError

### 4. Subscription Routes Error Tests (`/subscription/*`)

#### 4.1 Plan Selection Errors
- **Test Case 4.1.1**: Access plan selection without userId or userType
  - **Input**: GET `/subscription/select-plan` without query params
  - **Expected**: 400 status or redirect to `/signin`
  - **Error Type**: ValidationError

- **Test Case 4.1.2**: Select invalid plan
  - **Input**: POST `/subscription/subscribe-after-signup` with non-existent planId
  - **Expected**: 400 status, `{ success: false, message: "Invalid plan selected" }`
  - **Error Type**: ValidationError

#### 4.2 Payment Processing Errors
- **Test Case 4.2.1**: Payment with missing card details
  - **Input**: POST `/subscription/process-payment` without cardData
  - **Expected**: 400 status, `{ success: false, message: "Missing required payment information" }`
  - **Error Type**: ValidationError

- **Test Case 4.2.2**: Payment with declined card
  - **Input**: POST `/subscription/process-payment` with card number `4000000000000002`
  - **Expected**: 400 status, `{ success: false, message: "Card declined" }`
  - **Error Type**: NetworkError (payment gateway)

- **Test Case 4.2.3**: Payment with expired card
  - **Input**: POST `/subscription/process-payment` with card number `4000000000000069`
  - **Expected**: 400 status, `{ success: false, message: "Expired card" }`
  - **Error Type**: ValidationError

- **Test Case 4.2.4**: Payment with incorrect CVV
  - **Input**: POST `/subscription/process-payment` with card number `4000000000000127`
  - **Expected**: 400 status, `{ success: false, message: "Incorrect CVC" }`
  - **Error Type**: ValidationError

- **Test Case 4.2.5**: Duplicate subscription attempt
  - **Input**: POST `/subscription/subscribe` when already having active subscription
  - **Expected**: 400 status, `{ success: false, message: "You already have an active subscription" }`
  - **Error Type**: ValidationError

#### 4.3 Subscription Management Errors
- **Test Case 4.3.1**: Access manage page without authentication
  - **Input**: GET `/subscription/manage` without session
  - **Expected**: 302 redirect to `/auth/signin`
  - **Error Type**: AuthenticationError

- **Test Case 4.3.2**: Check limit with invalid action
  - **Input**: POST `/subscription/check-limit` with unknown action type
  - **Expected**: 400 status, validation error
  - **Error Type**: ValidationError

### 5. Customer Routes Error Tests (`/customer/*`)

#### 5.1 Product Purchase Errors
- **Test Case 5.1.1**: Purchase non-existent product
  - **Input**: POST `/customer/purchase` with invalid product ID
  - **Expected**: 404 status, `{ success: false, message: "Product not found" }`
  - **Error Type**: DatabaseError

- **Test Case 5.1.2**: Purchase with insufficient payment details
  - **Input**: POST `/customer/purchase` without payment method
  - **Expected**: 400 status, validation error
  - **Error Type**: ValidationError

### 6. Admin Routes Error Tests (`/admin/*`)

#### 6.1 Admin Access Errors
- **Test Case 6.1.1**: Access admin panel as non-admin user
  - **Input**: GET `/admin/dashboard` as brand/influencer
  - **Expected**: 403 status, `{ message: "Access denied: Admin privileges required" }`
  - **Error Type**: AuthorizationError

- **Test Case 6.1.2**: Delete user with invalid ID
  - **Input**: DELETE `/admin/user/invalid-id`
  - **Expected**: 404 status, `{ success: false, message: "User not found" }`
  - **Error Type**: DatabaseError

### 7. Global Error Tests

#### 7.1 Network & Database Errors
- **Test Case 7.1.1**: MongoDB connection failure
  - **Input**: Any database query when MongoDB is down
  - **Expected**: 500 status, generic error page with "Database connection error"
  - **Error Type**: DatabaseError

- **Test Case 7.1.2**: Cloudinary upload failure
  - **Input**: Upload image when Cloudinary service is down
  - **Expected**: 500 status, `{ success: false, message: "Error uploading image. Please try again." }`
  - **Error Type**: NetworkError

#### 7.2 Malformed Request Errors
- **Test Case 7.2.1**: Send malformed JSON
  - **Input**: POST request with invalid JSON body
  - **Expected**: 400 status, `{ success: false, message: "Invalid request format" }`
  - **Error Type**: ValidationError

- **Test Case 7.2.2**: Exceed request size limit
  - **Input**: POST request with body exceeding size limit
  - **Expected**: 413 status, `{ success: false, message: "Request entity too large" }`
  - **Error Type**: ValidationError

#### 7.3 Rate Limiting Errors
- **Test Case 7.3.1**: Exceed API rate limit
  - **Input**: 100 requests in 1 minute from same IP
  - **Expected**: 429 status, `{ success: false, message: "Too many requests. Please try again later." }`
  - **Error Type**: RateLimitError

### 8. Content-Type Specific Error Responses

#### 8.1 API Request Errors (JSON Response)
- **Test Case 8.1.1**: API request with Accept: application/json
  - **Input**: GET `/influencer/collab` with header `Accept: application/json` causing error
  - **Expected**: JSON response with `{ success: false, message: "..." }`
  - **Error Type**: Any

#### 8.2 Browser Request Errors (HTML Response)
- **Test Case 8.2.1**: Browser request without JSON accept header
  - **Input**: GET `/influencer/collab` from browser causing error
  - **Expected**: Render `error.ejs` page with error details
  - **Error Type**: Any

### 9. Session & Cookie Errors

#### 9.1 Session Expiry
- **Test Case 9.1.1**: Access protected route with expired session
  - **Input**: GET `/influencer/home` with expired session cookie
  - **Expected**: 302 redirect to `/SignIn`
  - **Error Type**: AuthenticationError

#### 9.2 CSRF Protection
- **Test Case 9.2.1**: POST request without valid CSRF token (if implemented)
  - **Input**: POST `/influencer/profile/update` without CSRF token
  - **Expected**: 403 status, `{ success: false, message: "Invalid CSRF token" }`
  - **Error Type**: AuthorizationError

### 10. File Upload Specific Errors

#### 10.1 Multer Errors
- **Test Case 10.1.1**: Upload more than 10 files
  - **Input**: POST `/influencer/content/create` with 11 files
  - **Expected**: 400 status, `{ success: false, message: "Maximum 10 files allowed" }`
  - **Error Type**: ValidationError

- **Test Case 10.1.2**: Upload file exceeding 50MB limit
  - **Input**: POST with 60MB file
  - **Expected**: 400 status, `{ success: false, message: "File size exceeds limit" }`
  - **Error Type**: ValidationError

### Test Execution Guidelines

1. **Manual Testing**: Execute each test case manually using tools like Postman or browser
2. **Automated Testing**: Create Jest/Mocha test suites for each route category
3. **Integration Testing**: Test error flows across multiple routes (e.g., signup → payment → error)
4. **Load Testing**: Verify error handling under high load conditions
5. **Security Testing**: Ensure error messages don't leak sensitive information
6. **User Acceptance Testing**: Verify error pages are user-friendly and provide clear guidance

### Expected Error Response Format

#### For API Requests (JSON):
```json
{
  "success": false,
  "message": "User-friendly error message",
  "errorCode": "ERROR_CODE_CONSTANT",
  "errors": {
    "fieldName": "Field-specific error message"
  },
  "timestamp": "2026-02-06T09:43:30Z",
  "path": "/api/endpoint"
}
```

#### For Browser Requests (HTML):
- Render appropriate error page based on user type
- Include error code, message, and helpful next steps
- Provide "Back" or "Home" navigation options
- Display user-specific guidance based on role
