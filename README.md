<div align="center">
  <h1>⚙️ CraftNest Server ⚙️</h1>
  <p><strong>The robust, secure, and fast backend infrastructure powering the CraftNest platform.</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
</div>

<hr/>

## 📖 Overview
CraftNest Server is a high-performance Express.js backend designed to support the CraftNest platform. Built with TypeScript and the MongoDB Native Driver, it provides a secure API layer, handles data validation, and manages role-based access for both users and administrators.

## ✨ Features
- **Authentication:** Integrated with Better Auth.
- **Secure APIs:** All protected routes are secured using JWT (JSON Web Tokens).
- **Direct Database Access:** Utilizes the MongoDB Native Driver for fast, un-opinionated database queries.
- **Strong Typing:** Fully built with TypeScript.
- **API Framework:** Express.js.
- **Data Validation:** Strict payload validation using Zod.
- **Role-based Authorization:** Middleware to differentiate and secure Guest, User, and Admin access.
- **CRUD Operations:** Complete APIs for users, items, reviews, and more.
- **Reviews:** API for managing user ratings and reviews on items.
- **Analytics:** Data aggregation routes for generating platform and user-specific statistics.
- **Contact API:** Endpoints for handling user contact messages.
- **Newsletter API:** Secure endpoints for newsletter subscriptions.

## 🔌 API Modules
- **Authentication:** Handles user registration, login, logout, and session validation.
- **Users:** Manages public profiles, status updates, and user analytics.
- **Items:** Core CRUD for craft listings, including complex filtering, sorting, and pagination.
- **Reviews:** Endpoints for creating, fetching, and deleting item reviews.
- **Dashboard:** Aggregates personalized data for the authenticated user's dashboard view.
- **Analytics:** Utilizes MongoDB aggregation pipelines to return robust data for Recharts (admin/platform and user-level).
- **Blog:** Provides endpoints to fetch static or dynamic blog post content.
- **Newsletter:** Simple API to record newsletter subscriptions.
- **Contact:** Processes incoming contact form messages.
- **Admin:** Protected routes for moderating items, managing users, and viewing platform statistics.

## 🗄️ Database Collections
- **`users`**: Stores user profiles, authentication details (local and Google), roles (user/admin), and status.
- **`items`**: Stores the craft listings, including title, descriptions, price, ImgBB image URLs, and moderation status.
- **`reviews`**: Contains ratings and comments left by users on specific items.
- **`wishlists`**: Stores arrays of item IDs that users have saved for later.
- **`blogposts`**: Houses content, slugs, and metadata for platform blog articles.
- **`newslettersubscribers`**: Records the email addresses of users subscribed to updates.
- **`contactmessages`**: Stores inquiries submitted via the platform's contact form.

## 🔐 Authentication Flow
- **Better Auth** is utilized to handle the primary authentication mechanics (including OAuth flows).
- **JWT (JSON Web Tokens)** is used to protect and secure backend APIs after a user has been authenticated.
- **Collaboration:** These two systems work harmoniously; Better Auth verifies the identity of the user, and JWTs are issued to manage subsequent secured API requests seamlessly.

## 💻 Technology Stack
- **Node.js**
- **Express.js**
- **TypeScript**
- **MongoDB Native Driver**
- **Better Auth**
- **JWT** (JSON Web Tokens)
- **bcrypt**
- **Zod**
- **google-auth-library**

## 🔐 Environment Variables
Create a `.env` file in the root of the server project. **Never expose actual secret values!**

```env
MONGODB_URI=
JWT_SECRET=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
```

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd craft_nest_server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   The API will typically start on `http://localhost:5000` (or as configured).

## 📂 Folder Structure
```text
craft_nest_server/
├── src/
│   ├── config/            # Database connection and environment config
│   ├── types/             # TypeScript interfaces for models/requests
│   ├── validators/        # Zod validation schemas
│   ├── controllers/       # Route request/response logic
│   ├── routes/            # Express route definitions
│   ├── middleware/        # JWT auth, role guards, error handlers
│   ├── services/          # Business logic and MongoDB queries
│   ├── utils/             # Helper functions (bcrypt, jwt, pagination)
│   └── app.ts             # Express app setup and middleware registration
├── server.ts              # Entry point
└── .env                   # Environment variables (do not commit)
```

## 🛡️ Security Notes
- **HTTP-only Cookies:** Sessions and sensitive tokens are transmitted securely.
- **JWT:** Used for robust, stateless API protection.
- **Password Hashing:** Implemented via `bcrypt` for secure local credential storage.
- **Zod Validation:** Prevents malicious payloads from hitting the database or services.
- **Role Middleware:** Ensures users cannot access administrative endpoints.
- **Environment Variables:** All secrets and configuration keys are kept out of the source code.

## 🔮 Future Improvements
- Integration of a Redis cache layer for analytics and heavily accessed endpoints.
- Websocket support for real-time dashboard notifications.
- Rate limiting middleware to prevent brute-force attacks and abuse.

## 📄 License
This project is licensed under the [MIT License](LICENSE).
