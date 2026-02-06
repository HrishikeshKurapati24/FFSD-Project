# Real-World Error Testing Scenarios

## Testing Error Handlers in Your Actual Application

Instead of using test routes, here are real scenarios in your FFSD application where you can see the error handling system in action:

---

## 🔐 Authentication Errors (401)

### Scenario 1: Access Protected Routes Without Login
**What to do**:
1. Make sure you're logged out
2. Try to access any of these URLs directly:
   - http://localhost:3000/brand/home
   - http://localhost:3000/influencer/home
   - http://localhost:3000/brand/campaigns
   - http://localhost:3000/influencer/profile

**Expected**: `AuthenticationError` with "Sign In" button

### Scenario 2: Invalid Login Credentials
**What to do**:
1. Go to http://localhost:3000/SignIn
2. Enter wrong email/password
3. Submit the form

**Expected**: `AuthenticationError` - "Invalid email or password"

---

## 🚫 Authorization Errors (403)

### Scenario 1: Brand Accessing Influencer Routes
**What to do**:
1. Login as a **brand** user
2. Try to access: http://localhost:3000/influencer/home

**Expected**: `AuthorizationError` - "Access denied: Influencers only"

### Scenario 2: Influencer Accessing Brand Routes
**What to do**:
1. Login as an **influencer** user
2. Try to access: http://localhost:3000/brand/campaigns

**Expected**: `AuthorizationError` - "Access denied: Brands only"

---

## ✅ Validation Errors (400)

### Scenario 1: Invalid Profile Update
**What to do**:
1. Login as an **influencer**
2. Go to http://localhost:3000/influencer/profile
3. Try to update profile with invalid data:
   - Leave required fields empty
   - Enter invalid email format
   - Submit very short bio (less than required)

**Expected**: `ValidationError` with specific field errors

### Scenario 2: Invalid Campaign Creation
**What to do**:
1. Login as a **brand**
2. Go to http://localhost:3000/brand/create_collab
3. Try to create campaign with:
   - Missing title
   - Invalid budget (negative or zero)
   - Missing required fields

**Expected**: `ValidationError` showing which fields are invalid

### Scenario 3: Payment Card Errors
**What to do**:
1. Login as **brand** or **influencer**
2. Go to subscription payment page
3. Use test card numbers from `subscriptionRoutes.js`:
   - Card: `4000 0000 0000 0002` (will be declined)
   - Card: `4000 0000 0000 0069` (expired card)
   - Card: `4000 0000 0000 0127` (incorrect CVC)

**Expected**: `ValidationError` with specific payment error messages

---

## 🔍 Not Found Errors (404)

### Scenario 1: Invalid Campaign ID
**What to do**:
1. Login as **brand**
2. Go to: http://localhost:3000/brand/influencer_profile/invalid-id-123

**Expected**: `NotFoundError` - "Invalid influencer ID format"

### Scenario 2: Non-existent Collaboration
**What to do**:
1. Login as **influencer**
2. Try to access: http://localhost:3000/influencer/collab/507f1f77bcf86cd799439011
   (Use a valid ObjectId format but one that doesn't exist)

**Expected**: `NotFoundError` - "Collaboration not found"

### Scenario 3: Non-existent Page
**What to do**:
1. Go to: http://localhost:3000/this-page-does-not-exist

**Expected**: 404 error page

---

## ⏱️ Rate Limit Errors (429)

### Scenario 1: Campaign Creation Limit (Brand)
**What to do**:
1. Login as a **brand** with Basic subscription
2. Create campaigns until you hit your plan limit
3. Try to create one more campaign

**Expected**: `RateLimitError` with "Upgrade Plan" button

### Scenario 2: Brand Connection Limit (Influencer)
**What to do**:
1. Login as an **influencer** with Basic subscription
2. Apply to campaigns until you hit your connection limit
3. Try to apply to another campaign

**Expected**: `RateLimitError` with upgrade message

---

## 💾 Database Errors (500)

### Scenario 1: Simulate Database Failure
**What to do**:
1. **Stop MongoDB** temporarily:
   ```bash
   # Stop MongoDB service
   net stop MongoDB
   ```
2. Try to access any page that requires database:
   - http://localhost:3000/brand/home
   - http://localhost:3000/influencer/collab

**Expected**: `DatabaseError` - "Failed to load..."

3. **Restart MongoDB**:
   ```bash
   net start MongoDB
   ```

---

## 🌐 Network Errors (503)

### Scenario 1: Image Upload Failure
**What to do**:
1. Login as **influencer**
2. Go to profile page
3. Try to upload a very large image (>50MB)

**Expected**: `NetworkError` or file size validation error

### Scenario 2: Cloudinary Connection Issue
**What to do**:
1. Temporarily break Cloudinary credentials in `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=invalid
   ```
2. Try to upload profile picture or banner
3. Restore correct credentials after testing

**Expected**: `NetworkError` - "Failed to upload image"

---

## 📊 Testing Different User Roles

### Admin User
**What to do**:
1. Login as **admin** (create one if needed)
2. Trigger any error (e.g., access invalid route)

**Expected**: Error page WITH technical details and stack trace

### Brand User
**What to do**:
1. Login as **brand**
2. Trigger any error

**Expected**: Error page with brand-specific action buttons:
- "Dashboard"
- "My Campaigns"
- "Upgrade Plan" (for rate limits)

### Influencer User
**What to do**:
1. Login as **influencer**
2. Trigger any error

**Expected**: Error page with influencer-specific action buttons:
- "Dashboard"
- "Collaborations"
- "Upgrade Plan" (for rate limits)

### Guest User (Not Logged In)
**What to do**:
1. Logout
2. Try to access protected route

**Expected**: Error page with:
- "Sign In" button
- "Sign Up" button
- "Home" button

---

## 🧪 API Testing (JSON Responses)

### Test with Postman or curl

**Example 1: Protected Route Without Auth**
```bash
curl -H "Accept: application/json" http://localhost:3000/brand/home
```
**Expected**: JSON with 401 AuthenticationError

**Example 2: Invalid Login**
```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email": "wrong@email.com", "password": "wrongpass"}'
```
**Expected**: JSON with 401 AuthenticationError

**Example 3: Invalid Profile Update**
```bash
# First login to get session/token, then:
curl -X POST http://localhost:3000/influencer/profile/update \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email": "invalid-email", "bio": "short"}'
```
**Expected**: JSON with 400 ValidationError

---

## 📝 What to Check

For each error, verify:

### ✅ Browser (HTML Response)
- [ ] Correct error icon (🔍 🚫 🔒 ⏱️ ⚠️)
- [ ] Correct status code (400, 401, 403, 404, 429, 500, 503)
- [ ] Error type displayed (ValidationError, AuthenticationError, etc.)
- [ ] Helpful error message
- [ ] Contextual help text
- [ ] Appropriate action buttons
- [ ] User role badge (if logged in)
- [ ] Technical details (only for admin)

### ✅ API (JSON Response)
- [ ] Correct HTTP status code
- [ ] JSON structure with `success: false`
- [ ] `message` field with error description
- [ ] `errorCode` field with error type
- [ ] `statusCode` field
- [ ] `timestamp` field
- [ ] `path` field
- [ ] `details` object (when relevant)

### ✅ Console Logs
Check your terminal for structured error logs:
```
================================================================================
🚨 ERROR: ValidationError [400]
================================================================================
⏰ Time: 2026-02-06T10:44:58.123Z
📍 Route: POST /influencer/profile/update
👤 User: influencer (507f1f77bcf86cd799439011)
💬 Message: Profile validation failed
================================================================================
```

---

## 🎯 Quick Testing Checklist

**5-Minute Test**:
1. [ ] Logout → Access /brand/home → See auth error
2. [ ] Login with wrong password → See auth error
3. [ ] Login as brand → Access /influencer/home → See authorization error
4. [ ] Update profile with invalid data → See validation error
5. [ ] Access /invalid-page → See 404 error

**Complete Test** (15-20 minutes):
1. [ ] Test all authentication scenarios
2. [ ] Test all authorization scenarios
3. [ ] Test validation errors (profile, campaign, payment)
4. [ ] Test not found errors (invalid IDs, non-existent resources)
5. [ ] Test rate limit errors (if you have subscription limits)
6. [ ] Test as different user roles (admin, brand, influencer, guest)
7. [ ] Test API responses with curl/Postman
8. [ ] Verify console logs are structured correctly

---

## 💡 Tips

1. **Keep browser DevTools open** to see network requests and responses
2. **Check the terminal** to see structured error logs
3. **Test both browser and API** requests for the same error
4. **Try different user roles** to see role-specific error pages
5. **Check `logs/` folder** for error log files (in production mode)

---

## Summary

You don't need the `/test-errors` routes! The error handling is already integrated throughout your application. Just use your app normally and:

- Try to access pages you shouldn't
- Submit invalid forms
- Use wrong credentials
- Access non-existent resources
- Hit subscription limits

Every error will be handled beautifully with contextual help and appropriate actions! 🎉
