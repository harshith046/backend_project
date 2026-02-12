# TaskMaster

> A high-performance, secure, and scalable RESTful API designed for efficient user and task management. Built with a focus on **security (RBAC)**, **performance (Redis Caching)**, and **maintainability (MVC Architecture)**.

![Node.js](https://img.shields.io/badge/Node.js-Production-green) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Relational_DB-blue) ![Redis](https://img.shields.io/badge/Redis-Caching-red) ![Security](https://img.shields.io/badge/Security-JWT_&_Helmet-orange)

## 📖 Table of Contents
- [Architecture & Design Decisions](#-architecture--design-decisions)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [API Documentation (Swagger)](#-api-documentation)
- [Security Implementation](#-security-implementation)
- [Performance Optimizations](#-performance-optimizations)

---

## 🏗 Architecture & Design Decisions
This backend follows a strict **Model-View-Controller (MVC)** separation of concerns to ensure scalability and ease of testing.

* **Controllers (`/src/controllers`)**: Handle business logic, separating the "what" from the "how".
* **Middleware (`/src/middleware`)**: Intercepts requests for cross-cutting concerns like **Authentication**, **Caching**, and **Validation**.
* **Config (`/src/config`)**: Centralized configuration for Database (PostgreSQL) and Cache (Redis) ensures connection pooling and singleton patterns are respected.

---

## 🌟 Key Features

### 1. Robust Authentication & Authorization (RBAC)
* **JWT Implementation**: Stateless authentication using JSON Web Tokens.
* **Role-Based Access Control**:
    * **USER**: Can only create, view, and manage *their own* tasks.
    * **ADMIN**: Has elevated privileges to view all users, manage system data, and perform administrative overrides.

### 2. High-Performance Caching
* **Redis Integration**: Implemented a **Cache-Aside** strategy for read-heavy endpoints (e.g., `GET /tasks`).
* **Automatic Invalidation**: Cache is automatically cleared on `POST`, `PUT`, or `DELETE` operations to ensure data consistency.

### 3. Enterprise-Grade Security
* **Input Sanitization**: Uses `express-validator` to scrub incoming data, preventing SQL Injection and XSS attacks.
* **Rate Limiting**: Implemented `express-rate-limit` to prevent brute-force and DDoS attacks (100 req/15min).
* **Secure Headers**: integrated `helmet` to set secure HTTP headers (HSTS, X-Frame-Options).

---

## 🛠 Tech Stack

| Technology | Purpose | Justification |
| :--- | :--- | :--- |
| **Node.js & Express** | Runtime & Framework | Event-driven, non-blocking I/O ideal for high-concurrency APIs. |
| **PostgreSQL** | Primary Database | ACID-compliant relational storage for structured user/task data. |
| **pg-pool** | DB Connection | Manages connection pooling to handle high traffic loads efficiently. |
| **Redis** | Caching Layer | In-memory key-value store to reduce DB load and latency. |
| **Docker** | Containerization | Ensures consistent environments across Development and Production. |
| **Swagger UI** | Documentation | Auto-generated, interactive API documentation for frontend consumption. |

---

## 📂 Project Structure

```bash
backend/
├── src/
│   ├── config/         # Database (PG) & Redis connection logic
│   ├── controllers/    # Business logic (Auth, User, Task operations)
│   ├── middleware/     # Auth checks, Caching, Error handling
│   ├── routes/         # API Route definitions
│   ├── app.js          # Entry point & App configuration
│   └── swagger.js      # API Documentation config
├── .env                # Environment variables (GitIgnored)
└── package.json        # Dependencies & Scripts
