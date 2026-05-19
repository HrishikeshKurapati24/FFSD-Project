<div align="center">

# CollabSync

**A full-stack Influencer Marketing Platform connecting Brands, Influencers, and Customers.**

[![CI](https://github.com/HrishikeshKurapati24/FFSD-Project/actions/workflows/ci.yml/badge.svg)](https://github.com/HrishikeshKurapati24/FFSD-Project/actions)
![Node.js](https://img.shields.io/badge/Node.js-Express.js-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [CI/CD](#cicd)

---

## Overview

CollabSync is a multi-role influencer marketing platform built on a **decoupled full-stack architecture** — a Node.js REST API backend paired with a React 19 + Vite frontend. The platform handles the complete campaign lifecycle: from brand-influencer matchmaking and collaboration management, to real-time analytics simulation, subscription billing, and a direct-to-consumer e-commerce layer.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React 19 Frontend (Vite)             │
│       Brand │ Influencer │ Customer │ Admin Portals      │
│              Redux Toolkit · Nginx (prod)                │
└────────────────────────┬────────────────────────────────┘
                         │  REST API + WebSockets
┌────────────────────────▼────────────────────────────────┐
│              Node.js + Express.js Backend                │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   Auth   │ │Campaign  │ │Analytics │ │ Payment  │  │
│  │ JWT+bcrypt│ │Collab Mgr│ │Simulation│ │Razorpay  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │     BullMQ Workers (Analytics · Subscription)     │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │          Socket.IO — /admin Namespace              │ │
│  └────────────────────────────────────────────────────┘ │
└──────────┬──────────────────┬────────────────┬──────────┘
           │                  │                │
    ┌──────▼──────┐   ┌───────▼──────┐  ┌─────▼──────┐
    │   MongoDB   │   │    Redis     │  │Elasticsearch│
    │  (Mongoose) │   │ (Cache+Queue)│  │  (Search)  │
    └─────────────┘   └──────────────┘  └────────────┘
```

---

## Features

### 🔐 Authentication & Role-Based Access Control
- **JWT + express-session** dual-layer auth — stateless API tokens alongside server-managed sessions.
- Passwords hashed with **bcrypt** (cost factor 10).
- Role-gated middleware (`isAuthenticated`, `isBrand`, `isInfluencer`) protecting all role-specific routes.
- Three distinct portals: **Brand**, **Influencer**, and **Admin**.

### 📢 Campaign & Collaboration Lifecycle
- Brands create campaigns with detailed requirements; influencers discover and apply.
- **Bi-directional invitation flow:** brands can directly invite influencers and influencers can pitch to brands.
- Full **state-machine collaboration model** tracking stages from proposal → active → completed via `collaborationRequestService`, `collaborationManageService`, and `collaborationMetricsService`.
- Per-collaboration KPI aggregation: views, engagement rate, conversions.

### 📊 Analytics Simulation Engine (BullMQ + Redis)
- A dedicated **background simulation framework** generates realistic, throttled analytics data points for campaigns without blocking the main event loop.
- Built on **BullMQ** (Redis-backed) with a recurring `analyticsSimulationScheduler` that enqueues jobs and a `saturationSimulationEngine` that controls data growth curves to prevent value overflow.
- An `analyticsHeartbeatService` syncs live snapshots into MongoDB's `AnalyticsSnapshot` collection periodically.

### 🔔 Real-Time Admin Dashboard (Socket.IO)
- A dedicated **Socket.IO `/admin` namespace** pushes live events (new registrations, flagged content, active users) directly to the admin dashboard.
- `AdminRealtimeEmitter` acts as a global singleton, callable from any backend service to broadcast without tight coupling.

### 💳 Subscription & Payment System (Razorpay)
- Full **subscription tier lifecycle**: plan initialization, access-gating middleware, and automated expiry via BullMQ (hourly job, with `setInterval` fallback).
- **Razorpay** payment gateway integration: order creation, HMAC-SHA256 webhook signature verification using Node's `crypto` module, and a mock service for development.

### ⚡ Redis Caching (ioredis)
- Route-level **response caching** via `routeCache` middleware — cache hits bypass the controller and DB entirely.
- Targeted `cacheInvalidationService` for purging stale keys on write operations.

### 🔍 Full-Text Search (Elasticsearch)
- **`@elastic/elasticsearch` v7** integration for indexing and searching brands, influencers, and campaigns — surfaced through the admin portal.

### 🛒 E-Commerce Layer
- Customers can purchase products directly through campaign promotions.
- `ProductMongo` and `OrderMongo` models handle product cataloguing and order tracking, linked to specific campaigns.

### 📤 File Uploads & Cloud Storage
- **Multer** handles multipart uploads; files are piped to **Cloudinary** for cloud storage and CDN delivery.

### 📧 Transactional Email (Nodemailer)
- **Nodemailer** handles transactional emails for registration confirmations and subscription status changes.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Redux Toolkit, Vite, CSS3, Nginx (prod) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Caching & Queue** | Redis (ioredis), BullMQ |
| **Real-time** | Socket.IO (WebSockets) |
| **Search** | Elasticsearch v7 |
| **Payments** | Razorpay |
| **Auth & Security** | JWT, bcrypt, Helmet (CSP), express-session |
| **File Storage** | Multer, Cloudinary |
| **Email** | Nodemailer |
| **API Docs** | Swagger UI (OpenAPI 3.0), swagger-jsdoc |
| **Testing** | Jest, Supertest, mongodb-memory-server |
| **DevOps** | Docker, Docker Compose, GitHub Actions |

---

## Project Structure

```
.
├── app.js                        # Server entry point — Express + Socket.IO + BullMQ bootstrap
├── routes/                       # Route definitions (admin, auth, brand, influencer, customer, subscription)
├── controllers/                  # Request handlers per domain (brand, influencer, campaign, payment, subscription)
├── services/
│   ├── analytics/                # Simulation scheduler, heartbeat, saturation engine
│   ├── queues/                   # BullMQ queue definitions (analytics, subscription)
│   ├── cache/                    # Redis cache service & invalidation
│   ├── realtime/                 # Socket.IO server singleton
│   ├── collaboration/            # Request, manage, and metrics services
│   ├── payment/                  # Razorpay gateway & mock service
│   ├── search/                   # Elasticsearch service
│   ├── subscription/             # Subscription lifecycle service
│   └── admin/                    # Dashboard, analytics, user, realtime emitter, seed services
├── models/                       # Mongoose schemas (Brand, Influencer, Campaign, Product, Order, etc.)
├── middleware/                   # asyncErrorWrapper, errorHandler, routeCache, subscriptionMiddleware
├── sockets/                      # adminSocket namespace initializer
├── frontend/
│   ├── src/
│   │   ├── pages/                # Brand, Influencer, Admin, Customer, Landing, Subscription portals
│   │   ├── store/                # Redux store + slices (notification, theme)
│   │   ├── components/           # Shared UI components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # Axios API client modules
│   │   └── contexts/             # React context providers
│   └── nginx.conf                # Nginx reverse proxy config (production)
├── tests/                        # Jest test suite (routes, services, middleware, mocks)
├── docker-compose.yml            # Multi-container orchestration
└── .github/workflows/ci.yml     # GitHub Actions CI pipeline
```

---

## Getting Started

### Option 1: Docker (Recommended)

Spins up the backend, frontend (Nginx), MongoDB, Redis, and Elasticsearch with a single command.

```bash
git clone <repository-url>
cd <project-folder>

# Copy and configure environment variables
cp .env.example .env

# Start all services
bash docker-run.sh
# or: docker compose up --build -d
```

### Option 2: Local Manual Setup

**Prerequisites:** Node.js ≥ 18, a running MongoDB instance, a running Redis instance.

```bash
# 1. Clone the repository
git clone <repository-url>
cd <project-folder>

# 2. Configure environment
cp .env.example .env
# Fill in: MONGO_URI, JWT_SECRET, SESSION_SECRET, REDIS_URL, RAZORPAY_KEY_ID, etc.

# 3. Install backend dependencies
npm install

# 4. Install frontend dependencies
cd frontend && npm install && cd ..

# 5. Seed initial data (optional)
node initAllSeedData.js

# 6. Run the application
npm start          # Backend → http://localhost:3000
cd frontend && npm run dev  # Frontend → http://localhost:5173
```

**Environment Variables (`.env.example`):**

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `SESSION_SECRET` | Secret for express-session |
| `REDIS_URL` | Redis connection URL (BullMQ + cache) |
| `RAZORPAY_KEY_ID` | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret |
| `CLOUDINARY_*` | Cloudinary credentials for file storage |

---

## API Documentation

Interactive OpenAPI 3.0 documentation is auto-generated from JSDoc annotations in route files and served at:

```
http://localhost:3000/api-docs
```

The Swagger UI is pre-configured with JWT Bearer token authentication. All available endpoints across `admin`, `auth`, `brand`, `influencer`, `customer`, `subscription`, and `notification` routes are documented.

---

## Testing

The test suite uses **Jest** + **Supertest** with an in-memory **`mongodb-memory-server`** instance, fully isolating tests from any live database.

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Tests are organized under `tests/` into:
- `routes/` — Integration tests for API endpoints
- `services/` — Unit tests for business logic services
- `middleware/` — Middleware behavior tests
- `mocks/` — Shared mock factories
- `setup/` — Global test environment configuration

---

## CI/CD

A **GitHub Actions** pipeline (`.github/workflows/ci.yml`) runs automatically on every Pull Request and push to main:

1. Provisions ephemeral **MongoDB** and **Redis** service containers.
2. Installs dependencies for both backend and frontend.
3. Enforces **ESLint** policies on all changed files.
4. Executes the full **Jest** test suite with coverage.

All checks must pass before a branch can be merged.

---

## License

This project is licensed under the **ISC License**.
