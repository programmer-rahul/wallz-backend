import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const connectCloudinary = async () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const uploadToCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;

    // upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
    });

    // file has been uploaded
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("error", error);
    fs.unlinkSync(localFilePath);
  }
};

export { uploadToCloudinary, connectCloudinary };
