require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const appConfig = require("./config/appConfig");
const userRouter = require("./routes/user.routes");
const cookieParser = require("cookie-parser");

const app = express();

connectDB();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/users", userRouter);

app.listen(appConfig.port, () => {
  console.log(`Server is running on port ${appConfig.port}`);
});
