const cloudinary = require("cloudinary").v2;
const appConfig = require("../config/appConfig");

// Configure Cloudinary
cloudinary.config({
  cloud_name: appConfig.cloudinary.cloudName,
  api_key: appConfig.cloudinary.apiKey,
  api_secret: appConfig.cloudinary.apiSecret,
});

const uploadToCloudinary = async (filePath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    throw new Error("Failed to upload to Cloudinary");
  }
};

const deleteFromCloudinary = async (publicId, resource_type = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type,
    });
    return result;
  } catch (error) {
    throw new Error("Failed to delete from Cloudinary");
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
