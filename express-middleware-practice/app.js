const express = require("express");
const morgan = require("morgan");

const app = express();

// Built in middleware
app.use(express.json());
app.use(morgan("dev"));

// In-memory user database
const users = [
  { id: 1, username: "alice", role: "user" },
  { id: 2, username: "bob", role: "admin" },
];

//Custom middleware
app.use((req, res, next) => {
  console.log("Time: ", Date.now().toLocaleString());
  console.log("Method: ", req.method);
  console.log("Path: ", req.path);
  next();
});

//Public routes /users
app.get("/users", (req, res) => {
  res.send(users);
});

//Application-Level middleware for admin routes
const adminAuthMiddleware = (req, res, next) => {
  const user = users.find((user) => user.role === "admin");
  if (!user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  next();
};

//Admin Route
app.get("/admin", adminAuthMiddleware, (req, res) => {
  res.json({
    message: "Welcome to the Admin Dashboard",
  });
});

app.get("/", (req, res) => {
  res.send("Express Middleware Practice");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running on port 3000");
});
