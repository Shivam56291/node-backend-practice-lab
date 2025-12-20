const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/user.model");
const ApiResponse = require("../utils/ApiResponse");
const fs = require("fs/promises");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinary");
const appConfig = require("../config/appConfig");
const jwt = require("jsonwebtoken");

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate access and refresh tokens");
  }
};

const cookieOptions = {
  httpOnly: true,
  secure: appConfig.nodeEnv === "production",
  sameSite: "strict",
  path: "/",
};

//!@Desc: Register a new user with optional avatar and cover image
//!@Route: Post /api/v1/users/register
//!@Access Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body || {};
  if (!username || !email || !fullName || !password) {
    throw new ApiError(400, "All fields are required");
  }
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }
  let avatarLocalPath;
  let avatarUpload = {};
  if (req.files && req.files.avatar && req.files.avatar[0]?.path) {
    avatarLocalPath = req.files.avatar[0].path;
    const uploadResult = await uploadToCloudinary(
      avatarLocalPath,
      "youtube/avatars"
    );
    if (!uploadResult) {
      throw new ApiError(500, "Failed to upload avatar");
    }
    avatarUpload = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }
  let coverImageLocalPath;
  let coverImageUpload = {};
  if (req.files && req.files.coverImage && req.files.coverImage[0]?.path) {
    coverImageLocalPath = req.files.coverImage[0].path;
    const uploadResult = await uploadToCloudinary(
      coverImageLocalPath,
      "youtube/cover-images"
    );
    if (!uploadResult) {
      throw new ApiError(500, "Failed to upload cover image");
    }
    coverImageUpload = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

  const user = await User.create({
    username,
    email,
    fullName,
    password,
    avatar: Object.keys(avatarUpload).length > 0 ? avatarUpload : undefined,
    coverImage:
      Object.keys(coverImageUpload).length > 0 ? coverImageUpload : undefined,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }
  if (avatarLocalPath) {
    fs.unlink(avatarLocalPath).catch(() => {});
  }

  if (coverImageLocalPath) {
    fs.unlink(coverImageLocalPath).catch(() => {});
  }
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

//!@Desc: Login a user and generate tokens
//!@Route: Post /api/v1/users/login
//!@Access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body || {};
  if (!email && !username) {
    throw new ApiError(400, "Email or username is required");
  }
  if (!password) {
    throw new ApiError(400, "Password is required");
  }
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

//!@Desc: Logout a user and clear tokens
//!@Route: Post /api/v1/users/logout
//!@Access Private
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: null,
      },
    },
    { new: true }
  );

  const logoutCookieOptions = {
    ...cookieOptions,
    maxAge: 0,
  };

  res.clearCookie("accessToken", logoutCookieOptions);
  res.clearCookie("refreshToken", logoutCookieOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

//!@Desc: Refresh access token using refresh token
//!@Route: Post /api/v1/users/refresh-token
//!@Access Private
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    // Get refresh token from cookies or body
    const incomingRefreshToken =
      req?.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is required");
    }
    //Verify the refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      appConfig.refreshTokenSecret
    );
    //Find the user with ths refresh token
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    //Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user?._id);
    //Set cookies
    const cookieOptions = {
      httpOnly: true,
      sameSite: "strict",
      secure: appConfig.nodeEnv === "production",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh token");
  }
});

//!@Desc: Change user password
//!@Route: Post /api/v1/users/change-password
//!@Access Private
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }
  //Find the user with password
  const user = await User.findById(req.user._id);
  //Check if old password is correct
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid Old password ");
  }
  //Update password
  user.password = newPassword;

  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

//!@Desc: Get current user's profile
//!@Route: Get /api/v1/users/current
//!@Access Private
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

//!@Desc: Update current user's profile
//!@Route: Put /api/v1/users/current
//!@Access Private
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName && !email) {
    throw new ApiError(400, "At least one field is required");
  }
  //Update user
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName: fullName || req.user.fullName,
        email: email || req.user.email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

//!@Desc: Update current user's avatar
//!@Route: Patch /api/v1/users/avatar
//!@Access Private
const updateAvatar = asyncHandler(async (req, res) => {
  //Get avatar file
  const avatarLocalPath = req.file.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  //get current user
  const user = await User.findById(req.user._id);
  //Delete old avatar
  if (user?.avatar?.public_id) {
    await deleteFromCloudinary(user?.avatar?.public_id);
  }
  //Upload new Avatar
  const uploadResult = await uploadToCloudinary(
    avatarLocalPath,
    "youtube/avatars"
  );
  if (!uploadResult) {
    throw new ApiError(500, "Error uploading avatar");
  }
  //Update the user
  const updatedUser = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        avatar: {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
        },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated"));
});

//!@Desc: Update current user's cover image
//!@Route: Patch /api/v1/users/cover-image
//!@Access Private
const updateCoverImage = asyncHandler(async (req, res) => {
  //Get cover image file
  const coverImageLocalPath = req.file.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is required");
  }
  //get current user
  const user = await User.findById(req.user._id);
  //Delete old avatar
  if (user?.coverImage?.public_id) {
    await deleteFromCloudinary(user?.coverImage?.public_id);
  }
  //Upload new Cover Image
  const uploadResult = await uploadToCloudinary(
    coverImageLocalPath,
    "youtube/coverImages"
  );
  if (!uploadResult) {
    throw new ApiError(500, "Error uploading Cover Image");
  }
  //Update the user
  const updatedUser = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        coverImage: {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
        },
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Cover image updated"));
});

//!@Desc: Get user channel profile
//!@Route: Get /api/v1/users/channel-profile/:username
//!@Access Public
const getUserChannelProfile = asyncHandler(async (req, res) => {
  try {
  } catch (error) {}
});

//!@Desc: Get user watch history
//!@Route: Get /api/v1/users/watch-history
//!@Access Private
const getWatchHistory = asyncHandler(async (req, res) => {
  try {
  } catch (error) {}
});

//!@Desc: Request password reset email
//!@Route: Post /api/v1/users/request-reset-password
//!@Access Public
const requestPasswordReset = asyncHandler(async (req, res) => {
  try {
  } catch (error) {}
});

//!@Desc: Reset password using reset token
//!@Route: Post /api/v1/users/reset-password/:token
//!@Access Public
const resetPassword = asyncHandler(async (req, res) => {
  try {
  } catch (error) {}
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  requestPasswordReset,
  resetPassword,
};
