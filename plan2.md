# Error Handling Implementation Plan - Detailed File Changes

## Overview
This document specifies **exactly where** code changes will be made to implement comprehensive, role-based error handling across the FFSD project.

---

## Phase 1: Create Error Handler Utilities

### 📁 NEW FILE: `utils/errorHandlers.js`
**Location**: `c:\Users\chara\OneDrive\Pictures\wbd_0602\FFSD-Project\utils\errorHandlers.js`

**What will be created**:
```javascript
// Custom Error Classes
class AppError extends Error { ... }
class ValidationError extends AppError { ... }
class AuthenticationError extends AppError { ... }
class AuthorizationError extends AppError { ... }
class DatabaseError extends AppError { ... }
class NetworkError extends AppError { ... }
class RateLimitError extends AppError { ... }

// Role-specific Error Handler Classes
class BaseErrorHandler { ... }
class AdminErrorHandler extends BaseErrorHandler { ... }
class BrandErrorHandler extends BaseErrorHandler { ... }
class InfluencerErrorHandler extends BaseErrorHandler { ... }
class CustomerErrorHandler extends BaseErrorHandler { ... }
class AuthErrorHandler extends BaseErrorHandler { ... }
class SubscriptionErrorHandler extends BaseErrorHandler { ... }
```

**Purpose**: Centralized error handling logic with role-specific formatting and logging.

---

### 📁 NEW FILE: `utils/errorLogger.js`
**Location**: `c:\Users\chara\OneDrive\Pictures\wbd_0602\FFSD-Project\utils\errorLogger.js`

**What will be created**:
```javascript
// Structured logging utility
class ErrorLogger {
  static log(error, context) { ... }
  static logToFile(error, context) { ... }
  static formatErrorLog(error, context) { ... }
}
```

**Purpose**: Enhanced logging with context (user ID, route, timestamp, stack traces).

---

## Phase 2: Update Global Error Middleware

### 📝 MODIFY: `app.js`
**Location**: `c:\Users\chara\OneDrive\Pictures\wbd_0602\FFSD-Project\app.js`

#### Change 1: Add imports (after line 18)
```javascript
// ADD THESE LINES AFTER LINE 18:
const { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError,
  DatabaseError,
  NetworkError,
  RateLimitError 
} = require('./utils/errorHandlers');
const { ErrorLogger } = require('./utils/errorLogger');
```

#### Change 2: Add request context middleware (after line 92)
```javascript
// ADD THESE LINES AFTER LINE 92 (after res.locals.user middleware):
app.use((req, res, next) => {
  // Attach error context to request
  req.errorContext = {
    userId: req.session?.user?.id || null,
    userType: req.session?.user?.userType || req.session?.user?.role || null,
    route: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  };
  next();
});
```

#### Change 3: Replace global error middleware (lines 379-382)
**Current code** (lines 379-382):
```javascript
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { error: err.message });
});
```

**Replace with**:
```javascript
// Enhanced global error handling middleware
app.use((err, req, res, next) => {
  // Log error with context
  ErrorLogger.log(err, req.errorContext);

  // Determine user type for role-specific handling
  const userType = req.session?.user?.userType || req.session?.user?.role || 'guest';
  
  // Get appropriate error handler
  const ErrorHandler = getErrorHandlerForUserType(userType);
  const handler = new ErrorHandler();
  
  // Handle error based on request type (API vs Browser)
  const isAPIRequest = req.xhr || req.headers.accept?.includes('application/json');
  
  if (isAPIRequest) {
    // Return JSON error response
    const errorResponse = handler.formatJSONError(err, req.errorContext);
    res.status(err.statusCode || 500).json(errorResponse);
  } else {
    // Render error page
    const errorData = handler.formatHTMLError(err, req.errorContext);
    res.status(err.statusCode || 500).render('error', errorData);
  }
});

// Helper function to get error handler by user type
function getErrorHandlerForUserType(userType) {
  const { 
    AdminErrorHandler, 
    BrandErrorHandler, 
    InfluencerErrorHandler, 
    CustomerErrorHandler,
    AuthErrorHandler 
  } = require('./utils/errorHandlers');
  
  switch(userType) {
    case 'admin': return AdminErrorHandler;
    case 'brand': return BrandErrorHandler;
    case 'influencer': return InfluencerErrorHandler;
    case 'customer': return CustomerErrorHandler;
    default: return AuthErrorHandler;
  }
}
```

---

## Phase 3: Update Route Files

### 📝 MODIFY: `routes/influencerRoutes.js`
**Location**: `c:\Users\chara\OneDrive\Pictures\wbd_0602\FFSD-Project\routes\influencerRoutes.js`

#### Change 1: Add imports (after line 32)
```javascript
// ADD AFTER LINE 32:
const { 
  ValidationError, 
  AuthenticationError, 
  DatabaseError,
  RateLimitError 
} = require('../utils/errorHandlers');
```

#### Change 2: Update profile image upload error handling (lines 178-184, 194-200)
**Current code** (lines 178-184):
```javascript
} catch (error) {
    console.error('Error uploading profile picture:', error);
    return res.status(500).json({
        success: false,
        message: 'Error uploading profile picture: ' + error.message
    });
}
```

**Replace with**:
```javascript
} catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new NetworkError('Failed to upload profile picture. Please try again.', { 
      originalError: error.message 
    });
}
```

**Apply similar pattern to**:
- Lines 194-200 (banner upload error)
- Lines 225-230 (database update error)
- Lines 238-244 (general route error)

#### Change 3: Update profile data update error handling (lines 364-376)
**Current code**:
```javascript
} catch (error) {
    console.error('Error updating influencer profile:', error);
    console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
    });
    return res.status(500).json({
        success: false,
        message: 'Error updating profile',
        error: error.message
    });
}
```

**Replace with**:
```javascript
} catch (error) {
    if (error.name === 'ValidationError') {
        throw new ValidationError('Profile validation failed', { 
          errors: error.errors 
        });
    }
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        throw new DatabaseError('Failed to update profile in database');
    }
    throw new AppError('Error updating profile', 500, { originalError: error.message });
}
```

#### Change 4: Update campaign application errors (lines 752-759)
**Current code**:
```javascript
} catch (error) {
    console.error('Error applying to campaign:', error);
    res.status(500).json({
        success: false,
        message: 'Error applying to campaign',
        error: error.message
    });
}
```

**Replace with**:
```javascript
} catch (error) {
    if (error.name === 'CastError') {
        throw new ValidationError('Invalid campaign ID format');
    }
    if (error.name === 'MongoError') {
        throw new DatabaseError('Database error while processing application');
    }
    throw error; // Let global handler catch it
}
```

**Similar updates needed for**:
- Lines 466-478 (collaboration listing)
- Lines 563-575 (collaboration details)
- Lines 793-796 (account deletion)

---

### 📝 MODIFY: `routes/subscriptionRoutes.js`
**Location**: `c:\Users\chara\OneDrive\Pictures\wbd_0602\FFSD-Project\routes\subscriptionRoutes.js`

#### Change 1: Add imports (after line 4)
```javascript
// ADD AFTER LINE 4:
const { 
  ValidationError, 
  AuthenticationError, 
  NetworkError 
} = require('../utils/errorHandlers');
```

#### Change 2: Update plan selection error (lines 44-56)
**Current code**:
```javascript
} catch (error) {
    console.error('Error loading subscription plan selection:', error);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({
            success: false,
            message: 'Failed to load subscription plans'
        });
    }
    res.status(500).render('error', {
        message: 'Failed to load subscription plans',
        error: { status: 500 }
    });
}
```

**Replace with**:
```javascript
} catch (error) {
    throw new DatabaseError('Failed to load subscription plans', { 
      originalError: error.message 
    });
}
```

#### Change 3: Update payment processing errors (lines 446-452)
**Current code**:
```javascript
} catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
        success: false,
        message: 'Payment processing failed'
    });
}
```

**Replace with**:
```javascript
} catch (error) {
    if (error.message?.includes('Card declined')) {
        throw new ValidationError('Payment declined. Please check your card details.');
    }
    if (error.message?.includes('Expired card')) {
        throw new ValidationError('Your card has expired. Please use a different card.');
    }
    throw new NetworkError('Payment processing failed. Please try again.', {
      originalError: error.message
    });
}
```

**Similar updates for**:
- Lines 119-125 (subscription creation)
- Lines 262-274 (payment page loading)
- Lines 595-604 (payment success page)

---

### 📝 MODIFY: `routes/brandRoutes.js`
**Location**: `c:\Users\chara\OneDrive\Pictures\wbd_0602\FFSD-Project\routes\brandRoutes.js`

#### Change 1: Add imports (at top of file)
```javascript
// ADD AT TOP:
const { 
  ValidationError, 
  AuthorizationError, 
  DatabaseError,
  RateLimitError 
} = require('../utils/errorHandlers');
```

#### Change 2: Update campaign creation errors
**Find all catch blocks** and replace generic 500 errors with specific error types:
- Validation errors → `ValidationError`
- Subscription limit errors → `RateLimitError`
- Database errors → `DatabaseError`

---

### 📝 MODIFY: `routes/authRoutes.js`
**Location**: `c:\Users\chara\OneDrive\Pictures\wbd_0602\FFSD-Project\routes\authRoutes.js`

#### Change 1: Add imports
```javascript
const { 
  AuthenticationError, 
  ValidationError 
} = require('../utils/errorHandlers');
```

#### Change 2: Update authentication failures
Replace generic error responses with:
- Invalid credentials → `AuthenticationError`
- Missing fields → `ValidationError`

---

### 📝 MODIFY: `routes/customerRoutes.js`
**Location**: `c:\Users\chara\OneDrive\Pictures\wbd_0602\FFSD-Project\routes\customerRoutes.js`

#### Change 1: Add imports and update error handling
Similar pattern to other routes - replace generic errors with specific error types.

---

### 📝 MODIFY: `routes/adminRoutes.js`
**Location**: `c:\Users\chara\OneDrive\Pictures\wbd_0602\FFSD-Project\routes\adminRoutes.js`

#### Change 1: Add authorization checks
Add `AuthorizationError` for non-admin access attempts.

---

## Phase 4: Create Enhanced Error Views

### 📁 NEW FILE: `views/errors/influencer-error.ejs`
**Location**: `c:\Users\chara\OneDrive\Pictures\wbd_0602\FFSD-Project\views\errors\influencer-error.ejs`

**Purpose**: Influencer-specific error page with relevant help links and guidance.

---

### 📁 NEW FILE: `views/errors/brand-error.ejs`
**Location**: `c:\Users\chara\OneDrive\Pictures\wbd_0602\FFSD-Project\views\errors\brand-error.ejs`

**Purpose**: Brand-specific error page with campaign-related help.

---

### 📁 NEW FILE: `views/errors/customer-error.ejs`
**Location**: `c:\Users\chara\OneDrive\Pictures\wbd_0602\FFSD-Project\views\errors\customer-error.ejs`

**Purpose**: Customer-specific error page with purchase support.

---

### 📁 NEW FILE: `views/errors/admin-error.ejs`
**Location**: `c:\Users\chara\OneDrive\Pictures\wbd_0602\FFSD-Project\views\errors\admin-error.ejs`

**Purpose**: Admin-specific error page with detailed technical information.

---

### 📝 MODIFY: `views/error.ejs`
**Location**: `c:\Users\chara\OneDrive\Pictures\wbd_0602\FFSD-Project\views\error.ejs`

**Change**: Update to use role-specific error templates based on user type.

---

## Phase 5: Add Validation Middleware

### 📁 NEW FILE: `middleware/errorMiddleware.js`
**Location**: `c:\Users\chara\OneDrive\Pictures\wbd_0602\FFSD-Project\middleware\errorMiddleware.js`

**What will be created**:
```javascript
// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Validation error handler
const handleValidationError = (err, req, res, next) => { ... };

module.exports = { asyncHandler, notFoundHandler, handleValidationError };
```

---

## Summary of Files to be Modified/Created

### New Files (7):
1. ✨ `utils/errorHandlers.js` - Error classes and handlers
2. ✨ `utils/errorLogger.js` - Logging utility
3. ✨ `middleware/errorMiddleware.js` - Error middleware
4. ✨ `views/errors/influencer-error.ejs` - Influencer error page
5. ✨ `views/errors/brand-error.ejs` - Brand error page
6. ✨ `views/errors/customer-error.ejs` - Customer error page
7. ✨ `views/errors/admin-error.ejs` - Admin error page

### Modified Files (8):
1. 📝 `app.js` - Global error middleware (lines 18, 92, 379-382)
2. 📝 `routes/influencerRoutes.js` - Multiple catch blocks
3. 📝 `routes/subscriptionRoutes.js` - Multiple catch blocks
4. 📝 `routes/brandRoutes.js` - Multiple catch blocks
5. 📝 `routes/authRoutes.js` - Authentication errors
6. 📝 `routes/customerRoutes.js` - Customer errors
7. 📝 `routes/adminRoutes.js` - Authorization errors
8. 📝 `views/error.ejs` - Role-based routing

---

## Verification Plan

### 1. Unit Tests
**Create**: `tests/errorHandlers.test.js`
```bash
# Run with:
npm test tests/errorHandlers.test.js
```

### 2. Integration Tests
**Test each route** with the test cases from `plan.md`:
- Use Postman collection or create `tests/integration/error-handling.test.js`

### 3. Manual Testing Checklist
- [ ] Test invalid login (should show AuthenticationError)
- [ ] Test profile update with invalid data (should show ValidationError)
- [ ] Test campaign application without subscription (should show RateLimitError)
- [ ] Test accessing admin route as brand (should show AuthorizationError)
- [ ] Test with MongoDB down (should show DatabaseError)
- [ ] Verify error pages render correctly for each user type
- [ ] Verify JSON responses for API requests
- [ ] Verify HTML responses for browser requests

---

## Implementation Order

1. **Phase 1**: Create utility files (errorHandlers.js, errorLogger.js)
2. **Phase 2**: Update app.js global middleware
3. **Phase 3**: Update route files one by one (start with influencerRoutes.js)
4. **Phase 4**: Create error view templates
5. **Phase 5**: Add middleware and test

---

## Questions for You

1. **Do you want me to proceed with all phases**, or should I implement phase by phase and get your approval after each?

2. **Logging preference**: Should I use Winston for structured logging, or stick with enhanced console.log?

3. **Error tracking**: Do you want integration with error monitoring services (like Sentry), or just file-based logging?

4. **Testing**: Should I create automated tests, or is manual testing sufficient for now?

5. **Backward compatibility**: Should I ensure existing error responses remain the same, or can I update all error formats?

Please review this plan and let me know your feedback!
