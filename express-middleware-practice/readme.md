# 🛡️ Express Middleware Practice

![Node.js](https://img.shields.io/badge/Node.js-RunTime-339933?style=for-the-badge&logo=nodedotjs)
![Express.js](https://img.shields.io/badge/Express.js-Framework-000000?style=for-the-badge&logo=express)

> A practical demonstration of the Middleware pattern in Express.js, featuring global logging, request parsing, and route guarding.

## 📂 Project Overview

This lightweight project illustrates how to intercept and manipulate HTTP requests in a Node.js environment. It focuses on the "Layered Architecture" of Express applications.

### Key Features
-   **Global Logging:** Custom middleware to timestamp and track every incoming request.
-   **Third-Party Integration:** Utilizes `morgan` for developer-friendly HTTP logs.
-   **Route Guarding:** Implements an `adminAuthMiddleware` to simulate protected route access.
-   **In-Memory Database:** Mock user data for testing authorization logic.

## 🚀 Getting Started

### Prerequisites
-   Node.js installed
-   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone <your-repo-url>
    ```

2.  **Install dependencies**
    ```bash
    npm install express morgan
    ```

3.  **Run the server**
    ```bash
    node app.js
    ```

## 🔌 API Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Root health check | Public |
| `GET` | `/users` | Returns list of all users | Public |
| `GET` | `/admin` | Returns admin dashboard message | **Protected** (Requires Admin Role) |

## 📚 Documentation
For a deep dive into how the middleware logic works in this project, please refer to the internal documentation:

👉 **[Read the Middleware Guide](./docs/middleware-guide.md)**

## 🧪 Testing with REST Client
You can test the endpoints using the provided `.http` file logic:

```http
### GET Public Route
GET http://localhost:3000/users

### GET Protected Route
GET http://localhost:3000/admin