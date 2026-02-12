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

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Local or Docker)
- Redis Server (Local or Docker)

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd backend
npm install
