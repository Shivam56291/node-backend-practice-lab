const express = require("express");
const userRouter = express.Router();

const {
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
} = require("../controllers/user.controller");

const upload = require("../middlewares/multer.middleware");
const verifyJWT = require("../middlewares/auth.middleware");
const cookieParser = require("cookie-parser");

userRouter.use(cookieParser());

/* =====================================================
   AUTHENTICATION ROUTES
===================================================== */
userRouter.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

userRouter.post("/login", loginUser);
userRouter.post("/logout", verifyJWT, logoutUser);
userRouter.post("/refresh-token", refreshAccessToken);

/* =====================================================
   PASSWORD & SECURITY
===================================================== */
userRouter.patch("/change-password", verifyJWT, changePassword);
userRouter.post("/request-password-reset", requestPasswordReset);
userRouter.post("/reset-password", verifyJWT, resetPassword);

/* =====================================================
   USER PROFILE (PRIVATE)
===================================================== */
userRouter.get("/current-user", verifyJWT, getCurrentUser);
userRouter.put("/update-account", verifyJWT, updateAccountDetails);

userRouter.patch("/avatar", verifyJWT, upload.single("avatar"), updateAvatar);

userRouter.patch(
  "/cover-image",
  verifyJWT,
  upload.single("coverImage"),
  updateCoverImage
);

/* =====================================================
   USER DATA & ACTIVITY
===================================================== */
userRouter.get("/history", verifyJWT, getWatchHistory);

/* =====================================================
   PUBLIC USER ROUTES
===================================================== */
userRouter.get("/c/:username", getUserChannelProfile);

module.exports = userRouter;
