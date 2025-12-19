const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const appConfig = require("../config/appConfig");

const userSchema = new mongoose.Schema(
  {
    /* =========================
       BASIC USER INFORMATION
    ========================== */
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      index: true,
    },

    /* =========================
       PROFILE MEDIA
    ========================== */
    avatar: {
      public_id: String,
      url: String,
    },
    coverImage: {
      public_id: String,
      url: String,
    },

    /* =========================
       AUTHENTICATION & SECURITY
    ========================== */
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
      minlength: [8, "Password must be at least 8 characters"],
    },
    refreshToken: {
      type: String,
    },
    refreshPasswordToken: {
      type: String,
    },
    refreshPasswordTokenExpiry: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },

    /* =========================
       USER ACTIVITY & HISTORY
    ========================== */
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    /* =========================
       CHANNEL INFORMATION
    ========================== */
    channelDescription: {
      type: String,
      default: "",
    },
    channelTags: {
      type: [String],
      default: [],
    },

    /* =========================
       SOCIAL LINKS
    ========================== */
    socialLinks: {
      x: String,
      instagram: String,
      facebook: String,
      website: String,
    },

    /* =========================
       NOTIFICATION SETTINGS
    ========================== */
    notificationSettings: {
      emailNotification: {
        type: Boolean,
        default: true,
      },
      subscriptionActivity: {
        type: Boolean,
        default: true,
      },
      commentActivity: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    appConfig.accessTokenSecret,
    {
      expiresIn: appConfig.accessTokenExpiry,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    appConfig.refreshTokenSecret,
    {
      expiresIn: appConfig.refreshTokenExpiry,
    }
  );
};

const User = mongoose.model("User", userSchema);

module.exports = User;
