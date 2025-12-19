const appConfig = require("../config/appConfig");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

//Middleware to authenticate user using JWT
const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    let token;
    token =
      req?.cookies?.accessToken || req?.headers?.authorization?.split(" ")?.[1];

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
    //Verify the token
    const decodedToken = jwt.verify(token, appConfig.accessTokenSecret);

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});
module.exports = verifyJWT;
