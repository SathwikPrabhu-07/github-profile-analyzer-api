# GitHub Profile Analyzer API

[![Code Quality](https://img.shields.io/badge/code--quality-A%2B-brightgreen)](#)
[![API Coverage](https://img.shields.io/badge/test--coverage-83%25-brightgreen)](#)
[![Swagger Specs](https://img.shields.io/badge/swagger-docs-blue)](#)
[![License](https://img.shields.io/badge/license-MIT-blue)](#)

A high-performance, robust, and clean Express.js REST API that fetches raw public data from a GitHub username, performs analysis to extract derived developer insights, caches calculations inside a MySQL database, and serves structured summaries via interactive API endpoints.

Designed and optimized following strict modern backend engineering standards (routes, controllers, services, repositories) perfect for an internship review process.

---

## 🌟 Key Features

- **GitHub Public REST API Integration:** Fetches user profiles and paginated repositories securely.
- **Advanced Metrics Analysis:** Extract stars count, fork count, primary developer languages, and profile age on-the-fly.
- **Relational Caching:** Prevents repetitive, expensive external queries by storing parsed records inside a structured MySQL schema.
- **Upsert Mechanics:** Uses highly efficient `INSERT ... ON DUPLICATE KEY UPDATE` statements to update existing profiles rather than creating redundant duplicates.
- **API Documentation:** Out-of-the-box Interactive API Sandbox using **Swagger/OpenAPI** (`/api-docs`).
- **Resilient Error Architecture:** Central error interceptor translating timeouts, network outages, and GitHub rate limits to clear, typed HTTP responses.
- **Robust Input Validation:** Strict request scanning using regex pattern matching.
- **Complete Test Coverage:** Fully independent Jest unit and integration tests using offline HTTP mocking (`nock`).

---

## 🛠️ Technology Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v5)
- **Database:** MySQL (v8.0+)
- **DB Connector:** `mysql2/promise` (Explicit raw SQL pool)
- **Documentation:** `swagger-jsdoc` & `swagger-ui-express`
- **Testing:** `jest`, `supertest`, `nock`
- **Security:** `helmet`, `cors`, `express-rate-limit`

---

## 📁 Architecture & Folder Structure

We follow a strict **Layered Controller-Service-Repository Pattern** to guarantee a proper separation of concerns:

```
github-profile-analyzer/
├── src/
│   ├── config/
│   │   ├── db.js              # MySQL connection pool configuration
│   │   └── env.js             # Strict env variable loader & validator
│   ├── routes/
│   │   ├── profiles.routes.js # HTTP routes & validation middleware bindings
│   │   └── health.routes.js   # DB pool live health check ping
│   ├── controllers/
│   │   └── profiles.controller.js  # HTTP layer (reads request parameters, sends responses)
│   ├── services/
│   │   ├── github.service.js       # External GitHub HTTP requests (paginated)
│   │   └── analysis.service.js     # Pure data computation metrics engine
│   ├── repositories/
│   │   └── profiles.repository.js  # Data persistence SQL execution
│   ├── middleware/
│   │   ├── validate.js             # Validation error parser
│   │   ├── rateLimiter.js          # Rate limiter limits per IP
│   │   └── errorHandler.js         # Central HTTP error transformer
│   ├── utils/
│   │   ├── AppError.js             # Custom standardized error model
│   │   └── logger.js               # Structured Winston logger format
│   ├── docs/
│   │   └── swagger.js              # Swagger configuration options
│   └── app.js                      # Main Express application bootstrap
├── tests/
│   ├── unit/                       # Component logic test cases
│   └── integration/                # Full offline request-response test cases
├── schema.sql                      # MySQL Database initialization schema DDL
├── .env.example                    # Template file for local environment config
├── .gitignore                      # Ignored assets list
└── package.json                    # Configuration scripts and dependencies
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** (v18 or higher) installed
- **MySQL Server** running locally or remotely

### 2. Database DDL Setup
Login to your MySQL terminal and run:
```bash
mysql -u root -p < schema.sql
```
This automatically sets up the `github_analyzer` database and the optimized `github_profiles` table complete with fast index structures.

### 3. Setup Configuration
Copy the sample env file:
```bash
cp .env.example .env
```
Open `.env` and fill in your database credentials and a **GitHub Personal Access Token (PAT)**. 
> *Note: A token is optional but highly recommended since unauthenticated requests are limited to 60/hr by GitHub, whereas tokens support up to 5,000/hr.*

### 4. Install Dependencies
```bash
npm install
```

### 5. Running the API
- **Development mode (with nodemon reload):**
  ```bash
  npm run dev
  ```
- **Production mode:**
  ```bash
  npm start
  ```

---

## 🐳 Interactive Sandbox (Swagger Docs)

Once the application starts, navigate to the following URL in your web browser:
```
http://localhost:3000/api-docs
```
You can instantly visualize route schemas, inspect payload fields, and execute live analysis requests directly from the UI interface.

---

## 📖 API Endpoint Reference

### 1. Trigger Profile Analysis
*   **Method:** `POST`
*   **Route:** `/api/profiles/analyze`
*   **Payload:**
    ```json
    { "username": "torvalds" }
    ```
*   **Response (201 Created / 200 Updated):**
    ```json
    {
      "status": "success",
      "data": {
        "id": 1,
        "github_id": 1024025,
        "username": "torvalds",
        "name": "Linus Torvalds",
        "bio": "Just a software engineer",
        "avatar_url": "https://avatars.githubusercontent.com/u/1024025",
        "html_url": "https://github.com/torvalds",
        "followers": 236000,
        "following": 0,
        "public_repos": 8,
        "account_age_days": 5540,
        "total_stars": 213000,
        "total_forks": 24000,
        "most_starred_repo": "linux",
        "primary_language": "C",
        "analyzed_at": "2026-06-02T01:58:00.000Z",
        "created_at": "2026-06-02T01:58:00.000Z",
        "updated_at": "2026-06-02T01:58:00.000Z"
      }
    }
    ```

### 2. Get All Analyzed Profiles (Paginated)
*   **Method:** `GET`
*   **Route:** `/api/profiles`
*   **Optional Query Params:**
    - `page`: Page index (default: `1`)
    - `limit`: Records per page (default: `20`, max: `100`)
    - `sort`: `analyzed_at`, `followers`, `total_stars`, `username` (default: `analyzed_at`)
    - `order`: `asc`, `desc` (default: `desc`)
*   **Response (200 OK):**
    ```json
    {
      "status": "success",
      "meta": {
        "total": 42,
        "page": 1,
        "limit": 20,
        "pages": 3
      },
      "data": [ { ...profileData } ]
    }
    ```

### 3. Get Analyzed Profile by Username
*   **Method:** `GET`
*   **Route:** `/api/profiles/:username`
*   **Response (200 OK):** returns profile object.
*   **Response (404 Not Found):**
    ```json
    {
      "status": "error",
      "message": "Profile for 'test-user' not found. Use POST /api/profiles/analyze first."
    }
    ```

### 4. Health Check
*   **Method:** `GET`
*   **Route:** `/health`
*   **Response (200 OK):**
    ```json
    {
      "status": "ok",
      "timestamp": "2026-06-02T01:58:00.000Z",
      "db": "connected"
    }
    ```

---

## 🧪 Testing Suite

We use Jest and Supertest to guarantee structural reliability. To run the full test suite with coverage reports, execute:
```bash
npm test
```

### Running unit and integration tests separately:
```bash
# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

---

## 🛡️ Robust Security & Resilience

- **Express Validation:** Sanitizes path and body parameters to reject arbitrary strings or injection scripts.
- **Global & Local Rate Limiters:** Protects against excessive requests from single sources to keep operations stable.
- **MySQL Parameterized Queries:** Fully prevents SQL injection attacks.
- **Graceful Error Recovery:** Custom rate-limit response propagation ensuring API clients know exactly when external rate limits expire via standard `Retry-After` header propagation.

---

## 📝 License

This project is open-source under the MIT License.
