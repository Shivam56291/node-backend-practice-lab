require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const appConfig = require("./config/appConfig");

const app = express();

connectDB();

app.listen(appConfig.port, () => {
  console.log(`Server is running on port ${appConfig.port}`);
});
