const mongoose = require("mongoose");
const appConfig = require("./appConfig");

const connectDB = async () => {
  try {
    await mongoose.connect(appConfig.mongoURI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;