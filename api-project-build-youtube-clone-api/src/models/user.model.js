const mongoose = require("mongoose");

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
      publicId: String,
      url: String,
    },
    coverImage: {
      publicId: String,
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

const User = mongoose.model("User", userSchema);

module.exports = User;
