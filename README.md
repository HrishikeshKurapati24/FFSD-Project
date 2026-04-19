

# CollabSync

CollabSync is a comprehensive Influencer Marketing Platform designed to bridge the gap between Brands, Influencers, and Customers. It facilitates seamless collaboration, campaign management, and a direct-to-consumer e-commerce marketplace.

## 🚀 Key Features

### 📢 Campaign Workflow
Manage the entire lifecycle of influencer marketing campaigns:
*   **Creation & Discovery:** Brands can create detailed campaigns with specific requirements.
*   **Workflow Management:** End-to-end handling from accepting proposals to running active campaigns.
*   **Progress Tracking:** Real-time tracking of campaign status and deliverables.
*   **Performance Metrics:** Detailed analytics and metrics to measure campaign success.

### 🤝 Invitations & Collaboration
*   **Brand Invitations:** Brands can directly invite specific influencers to their campaigns.
*   **Influencer Invitations:** Influencers can request brands to promote their products.
*   **Seamless Connection:** Efficient tools to facilitate the initial connection and agreement phase.

### 📶 Real-time Admin & Analytics Simulation
*   **WebSockets:** Real-time event emitters via WebSockets keep the administrative dashboard updated instantaneously for newly flagged content, active users, and immediate alert moderation.
*   **Analytics Simulation Engine & Background Jobs:** Employs an advanced simulation framework using BullMQ and Redis to intelligently generate, throttle, and process real-time analytics data points continuously in the background without blocking the main event loop.

### 🔐 Authentication (Auth)
*   **Secure Access:** Robust authentication system for Brands, Influencers, and Customers.
*   **Role-Based Portals:** Distinct, secure environments tailored for each user type.

### 🛍️ E-Commerce & Product Integration
*   **Direct Buying Options:** Integrated e-commerce functionality allowing customers to buy products directly from campaign promotions.
*   **Promoted Products:** Seamless storage and retrieval of product data linked to specific campaigns.

### 💳 Subscriptions
*   **Monetization Models:** Subscription-tier management offering different feature sets for users.
*   **Access Control:** Gated features and usage limits based on subscription status.

### 📝 Content Creation Workflow
*   **Submission & Approval:** Structured workflow for influencers to submit content for brand approval.
*   **Feedback Loops:** Tools for brands to provide feedback or approve content before it goes live.

## 🛠️ Technology Stack

*   **Frontend:** React 19, Redux Toolkit, Vite, CSS3
*   **Backend:** Node.js, Express.js
*   **Database & Caching:** MongoDB (Mongoose), Redis (Caching, Sessions, & Message Queue)
*   **Task Queue & Real-time:** BullMQ (Background Workers), WebSockets
*   **Security:** JWT, bcrypt, Helmet
*   **DevOps & CI/CD:** Docker, Docker Compose, GitHub Actions
*   **Testing Infrastructure:** Jest, Supertest

## 📦 Installation & Setup

### Option 1: Docker (Recommended)
CollabSync is fully containerized. You can spin up the Frontend, Backend, MongoDB, Redis, and Elasticsearch using Docker Compose.

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd <project-folder>
    ```

2.  **Start all services**
    ```bash
    bash docker-run.sh
    # or manually: docker compose up --build -d
    ```

### Option 2: Local Manual Setup

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd <project-folder>
    ```

2.  **Install Dependencies**
    *   **Backend:**
        ```bash
        npm install
        ```
    *   **Frontend:**
        ```bash
        cd frontend
        npm install
        ```

3.  **Environment Configuration**
    *   Create a `.env` file in the root directory. Ensure you have configurations for `MONGO_URI`, `JWT_SECRET`, `SESSION_SECRET`, and `REDIS_URL`. Local instances of Redis and MongoDB must be running.

4.  **Run the Application**
    *   **Backend:** `npm start` (runs on port 3000)
    *   **Frontend:** `npm run dev` (runs on port 5173)

## 🧪 Testing & CI/CD

CollabSync ensures code reliability via automated testing and continuous integration architectures.
*   **Unit & Integration Tests:** The backend utilizes Jest alongside Supertest to perform robust integration testing against API routes, authentication logic, job queues, and mocked dependencies.
*   **Running Tests Local:** Execute `npm test` inside the root directory.
*   **Continuous Integration:** GitHub Actions are configured to automatically trigger the `.github/workflows/ci.yml` pipeline on any new Pull Request or push. This provisions temporary service containers (e.g. MongoDB) to asynchronously execute the full backend and frontend builds while strictly enforcing linting policies on every change.

## 📄 License

This project is licensed under the ISC License.
