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
*   **Database:** MongoDB (Mongoose), Redis (Session Store)
*   **Security:** JWT, bcrypt, Helmet

## 📦 Installation

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
    *   Create a `.env` file in the root directory and configure your MongoDB URI, JWT Secret, and Session Secret.

4.  **Run the Application**
    *   **Backend:** `npm start` (runs on port 3000)
    *   **Frontend:** `npm run dev` (runs on port 5173)

## 📄 License

This project is licensed under the ISC License.
