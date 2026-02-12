# Task Management System - Backend API

## Project Overview
This is a secure, scalable RESTful API built with Node.js, Express, and PostgreSQL. It was designed to handle user authentication, role-based access control (RBAC), and efficient task management.

The architecture follows the MVC (Model-View-Controller) pattern to ensure separation of concerns. I integrated Redis for caching strategies to optimize read-heavy endpoints and ensure high performance under load.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (managed via `pg` connection pooling)
- **Caching:** Redis (Cache-Aside strategy)
- **Security:** JWT (JSON Web Tokens), bcryptjs, Helmet, Express-Rate-Limit
- **Validation:** Express-Validator
- **Documentation:** Swagger UI

---

## Key Features & Architectural Decisions

### 1. Security & Authentication
- **Stateless Auth:** Implemented JWT to manage sessions without server-side state.
- **Role-Based Access Control (RBAC):**
  - `USER`: Can only manage their own tasks. Access to other users' data is blocked at the controller level.
  - `ADMIN`: Has elevated privileges to manage the user directory and oversee all system tasks.
- **Protection:** secure HTTP headers are set using `helmet`, and `express-rate-limit` is configured to prevent brute-force attacks on auth routes.

### 2. Performance (Redis Caching)
- **Cache-Aside Pattern:** The `GET /tasks` endpoint checks Redis first. If data exists, it returns instantly (<10ms). If not, it queries PostgreSQL and caches the result for 60 seconds.
- **Cache Invalidation:** To maintain data consistency, the cache is automatically cleared whenever a Task is Created, Updated, or Deleted.

### 3. Data Integrity
- **Input Validation:** Middleware is used to sanitize and validate all incoming request bodies (email formats, password lengths, date types) before they reach the database driver.

---

## Project Structure
The codebase is organized to support modularity and testing:

```bash
backend/
├── src/
│   ├── config/         # Database (PG) and Redis connection logic
│   ├── controllers/    # Business logic for Users and Tasks
│   ├── middleware/     # Auth verification, Caching logic, Error handling
│   ├── routes/         # API endpoint definitions
│   ├── app.js          # App configuration and middleware setup
│   └── swagger.js      # API Documentation configuration
├── .env                # Environment variables
└── package.json        # Dependencies and scripts
```

## Setup Instructions

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd backend
npm install
```

### 2. Environment Configuration
Create a .env file in the root directory and configure your local credentials:
```bash
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/primetrade_db
JWT_SECRET=your_secure_secret_key
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```
### 3. Database Schema Setup
Run the following SQL commands in your PostgreSQL instance to initialize the tables:

Create Users Table:
```bash
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(10) DEFAULT 'USER',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Create Tasks Table:
```bash
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Running the Application
Go to the frontend directory and run:
```bash
npm run dev
```
Go to the backend directory and run:
```bash
nodemon src/app.js
```
### API Documentation
The API is fully documented using Swagger UI.
Once the server is running, navigate to the following URL to test endpoints interactively:
```bash
http://localhost:5000/api-docs
```
