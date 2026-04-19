# CollabSync Core REST API Documentation

## 1. Overview
- **API Name**: CollabSync Business Engine
- **Version**: v1
- **Base URL**: `https://api.collabsync.com/v1`
- **Purpose**: To provide a standardized interface for B2B brand-influencer partnerships and B2C influencer-led commerce.
- **Authentication**: JWT-based session authentication. Clients must provide a `token` cookie or a `Bearer` token in the `Authorization` header.

---

## 2. Endpoint Structure
All resources use plural nouns and consistent camelCase for field names.

- **B2B Resources**: `/campaigns`, `/collaborations`, `/subscriptions`.
- **B2C Resources**: `/products`, `/orders`, `/checkout`.
- **System Resources**: `/webhooks`.

---

## 3. HTTP Methods
- `GET`: Retrieve list or specific resource.
- `POST`: Create a new resource or initiate a process.
- `PUT`: Update a resource entirely (e.g., campaign draft).
- `PATCH`: Partially update a resource (e.g., updating a single deliverable status).
- `DELETE`: Remove a resource.

---

## 4. Authentication & Security
- **Protocol**: HTTPS only.
- **Method**: JWT (JSON Web Token).
- **Header**: `Authorization: Bearer <token>`
- **Cookie**: `token=<jwt_value>` (used for browser-based dashboard clients).

---

## 5. B2B: Brand & Influencer Operations

### 5.1 Campaigns
Manage the lifecycle of marketing campaigns.

#### `POST /campaigns`
Create a new campaign with optional product snapshotting.
- **Auth**: `Role: Brand`
- **Request Body (JSON)**:
```json
{
  "title": "Summer Glow 2026",
  "description": "Premium skincare campaign",
  "budget": 5000,
  "minFollowers": 10000,
  "requiredChannels": ["Instagram", "TikTok"],
  "featuredProducts": ["64f2a1..."],
  "deliverables": [
    {
      "title": "Unboxing Reel",
      "platform": "Instagram",
      "dueDate": "2026-06-01"
    }
  ]
}
```
- **Response (201 Created)**:
```json
{
  "status": "success",
  "data": {
    "id": "64f2b3...",
    "status": "draft",
    "createdAt": "2026-04-18T12:00:00Z"
  }
}
```

#### `GET /campaigns/{id}/influencers`
Retrieve a list of influencers partnered with a specific campaign.
- **Auth**: `Role: Brand`
- **Response (200 OK)**:
```json
{
  "status": "success",
  "data": [
    {
      "id": "64f2c5...",
      "name": "Alex Rivera",
      "progress": 75,
      "revenueGenerated": 1200
    }
  ]
}
```

---

### 5.2 Collaborations & Deliverables
The operational core of the brand-influencer relationship.

#### `POST /collaborations/apply`
Influencer applies to a public or invited campaign.
- **Auth**: `Role: Influencer`
- **Request Body**: `{ "campaignId": "64f2b3..." }`
- **Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Application submitted"
}
```

#### `PATCH /collaborations/{collabId}/deliverables/{itemId}`
Update deliverable status (e.g., submit URL or approve content).
- **Auth**: `Role: Brand | Influencer`
- **Request Body**:
```json
{
  "status": "submitted",
  "contentUrl": "https://instagram.com/p/..."
}
```
- **Response (200 OK)**:
```json
{
  "status": "success",
  "data": { "newProgress": 25 }
}
```

---

## 6. B2B: SaaS & Financial Operations

### 6.1 Subscriptions
Manage platform access and tiering.

#### `POST /subscriptions/initiate`
Initiate a SaaS subscription payment.
- **Auth**: `Role: Brand | Influencer`
- **Request Body**: `{ "planId": "premium_monthly" }`
- **Response (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "paymentIntentId": "pi_123...",
    "razorpayOrderId": "order_xyz...",
    "amount": 4900
  }
}
```

---

## 7. B2C: Influencer Commerce Engine

### 7.1 Checkout & Orders
Direct-to-consumer sales via influencer storefronts.

#### `POST /checkout/initiate`
Create a customer order from an influencer's shoppable campaign.
- **Auth**: `None (Public Customer)`
- **Request Body**:
```json
{
  "campaignId": "64f2b3...",
  "items": [{ "productId": "64f2d7...", "quantity": 1 }],
  "customerInfo": {
    "email": "customer@example.com",
    "address": "123 Street, NY"
  }
}
```
- **Response (200 OK)**:
```json
{
  "status": "success",
  "data": { "orderId": "64f2e9...", "razorpayOrderId": "order_abc..." }
}
```

---

## 8. System: Webhooks
Integrations for asynchronous state synchronization.

#### `POST /webhooks/razorpay`
Global listener for payment events.
- **Security**: Requires signed `X-Razorpay-Signature` header.
- **Events Handled**: `payment.captured`, `order.paid`.
- **Logic**: Automatically finalizes state for Subscriptions, Campaign Milestones, or B2C Orders.

---

## 9. Standard Error Responses
All errors follow this consistent structure:

```json
{
  "status": "error",
  "message": "Detailed explanation of the failure",
  "code": 401
}
```

- **400**: Bad Request (Missing fields or invalid format).
- **401**: Unauthorized (Valid JWT required).
- **403**: Forbidden (Insufficient role permissions).
- **404**: Not Found (Resource ID does not exist).
- **500**: Internal Server Error.

---

## 10. Pagination & Filtering
- **Pagination**: Use `page` and `limit` query parameters.
- **Filtering**: Resources like `/campaigns` support `status` and `category` filters.
- **Example**: `GET /v1/campaigns?status=active&page=1&limit=20`

---
*Documentation Version: 1.0.0 | Last Updated: 2026-04-18*
