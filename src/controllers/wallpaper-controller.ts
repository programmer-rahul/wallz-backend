import { Request, Response } from "express";
import { uploadToCloudinary } from "../config/cloudinary";
import WallpaperModel from "../models/wallpaper-schema";
import fs from "fs";
import path from "path";

const addWallpaperController = async (req: Request, res: Response) => {
  try {
    console.log("add wallpaper request");
    const { category } = req.body;
    const wallpaperImage = req.file;

    // console.log("category", category);
    // console.log("wallpaperImage", wallpaperImage);

    if (!category) {
      return;
    }
    // Check if the file exists
    console.log("image", wallpaperImage);
    if (!wallpaperImage) {
      res.status(400).json({ error: "Wallpaper image is required" });
      return;
    }

    const imgUploaded = await uploadToCloudinary(wallpaperImage.path);
    console.log(imgUploaded);

    if (!imgUploaded) {
      res
        .status(400)
        .json({ error: "Cloudinary image uploading error", imgUploaded });
      return;
    }

    const newWallpaper = new WallpaperModel({
      id: imgUploaded.public_id,
      category,
      url: imgUploaded.secure_url,
      downloadCount: 0,
      viewCount: 0,
    });
    if (!newWallpaper) {
      res
        .status(400)
        .json({ error: "Error during creating new wallpaper model" });
      return;
    }
    await newWallpaper.save();

    res.status(200).json({ message: "Wallpaper added successfully" });
  } catch (error) {
    console.log("erro", error);
    res.status(500).json({ error: "Failed to add wallpaper" });
  }
};

const getWallpapersByCategoryController = async (
  req: Request,
  res: Response
) => {
  try {
    // Get category from request parameters
    console.log("request");
    const { category } = req.params;

    // Get page and limit from query parameters
    let page = req.query.page as string; // Treat page as string
    let limit = req.query.limit as string; // Treat limit as string
    let favouriteIds = req.query?.favouriteIds as string; // Treat limit as string

    // Set defaults for pagination if not provided
    page = page ? page : "1"; // Default to page 1 if undefined
    limit = limit ? limit : "10"; // Default to 10 wallpapers per page if undefined

    // Parse page and limit to integers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Ensure that the parsed values are valid numbers, otherwise fallback to defaults
    const validPage = pageNumber > 0 ? pageNumber : 1;
    const validLimit = limitNumber > 0 ? limitNumber : 10;

    // Calculate how many wallpapers to skip
    const skip = (validPage - 1) * validLimit;

    // Find wallpapers by category with pagination
    let wallpapers;
    let totalCount;
    if (category === "all-wallpapers") {
      wallpapers = await WallpaperModel.find({}).skip(skip).limit(validLimit);
      totalCount = await WallpaperModel.countDocuments({});
    } else if (category === "favourite" && favouriteIds) {
      const ids = JSON.parse(favouriteIds);
      wallpapers = await WallpaperModel.find({ id: { $in: ids } })
        .skip(skip)
        .limit(validLimit);

      totalCount = await WallpaperModel.countDocuments({ id: { $in: ids } });
    } else {
      wallpapers = await WallpaperModel.find({ category })
        .skip(skip)
        .limit(validLimit);
      totalCount = await WallpaperModel.countDocuments({ category });
    }

    // Get the total count of wallpapers in the category

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / validLimit);

    // Return the results with pagination info
    res.status(200).json({
      page: validPage,
      limit: validLimit,
      totalPages,
      totalCount,
      wallpapers,
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching wallpapers" });
  }
};

const addBulkWallpapersController = async (req: Request, res: Response) => {
  try {
    const { category } = req.body;
    const wallpaperImages = req.files as Express.Multer.File[];

    if (!category) {
      res.status(400).json({ error: "Category is required" });
      return;
    }

    if (!wallpaperImages || wallpaperImages.length === 0) {
      res
        .status(400)
        .json({ error: "At least one wallpaper image is required" });
      return;
    }

    const uploadedWallpapers = [];

    for (const wallpaper of wallpaperImages) {
      const imgUploaded = await uploadToCloudinary(wallpaper.path);

      if (!imgUploaded) {
        continue; // Skip to the next file if upload fails
      }

      const newWallpaper = new WallpaperModel({
        id: imgUploaded.public_id,
        category,
        url: imgUploaded.secure_url,
        downloadCount: 0,
        viewCount: 0,
      });

      await newWallpaper.save();
      uploadedWallpapers.push(newWallpaper);
    }

    // Cleanup: Delete all files in the 'public' folder after successful uploads
    const publicFolderPath = path.join(__dirname, "../../public");
    fs.readdir(publicFolderPath, (err, files) => {
      if (err) {
        console.error("Error reading public folder:", err);
        return;
      }
      for (const file of files) {
        const filePath = path.join(publicFolderPath, file);
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error("Error deleting file:", unlinkErr);
          }
        });
      }
    });

    res.status(200).json({
      message: "Wallpapers uploaded successfully",
      uploadedWallpapers,
    });
  } catch (error) {
    console.error("Error in bulk upload:", error);
    res.status(500).json({ error: "Failed to upload wallpapers in bulk" });
  }
};

export {
  addWallpaperController,
  getWallpapersByCategoryController,
  addBulkWallpapersController,
};
