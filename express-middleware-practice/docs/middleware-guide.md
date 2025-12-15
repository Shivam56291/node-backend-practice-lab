# 📘 Express Middleware: Concepts & Implementation

## 🧠 Conceptual Revision
**What is Middleware?**
In Express.js, middleware functions are the backbone of the request-response cycle. You can think of them as a series of **checkpoints** or **layers** that an HTTP request must pass through before a response is sent back to the client.

Each middleware function has access to:
1.  **The Request Object** (`req`)
2.  **The Response Object** (`res`)
3.  **The Next Function** (`next`)

### The "Next" Mechanism
The `next()` function is critical. If a middleware doesn't end the request-response cycle (e.g., by sending `res.send()`), it **must** call `next()` to pass control to the next middleware in the stack. If it fails to do so, the request will hang.

---

## 🛠️ Implementation Breakdown

This project demonstrates three distinct categories of middleware.

### 1. Built-in & Third-Party Middleware
These are pre-packaged modules used for common tasks like parsing data or logging.

```javascript
// Parses incoming JSON payloads and makes them available in req.body
app.use(express.json()); 

// HTTP request logger. 'dev' outputs concise color-coded logs
app.use(morgan("dev"));