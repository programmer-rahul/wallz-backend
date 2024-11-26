import { Request, Response } from "express";
import { uploadToCloudinary } from "../config/cloudinary";
import WallpaperModel from "../models/wallpaper-schema";

const addWallpaperController = async (req: Request, res: Response) => {
  try {
    const { wallpaperName, category } = req.body;
    const wallpaperImage = req.file;

    // console.log("wallpaperName", wallpaperName);
    // console.log("category", category);
    // console.log("wallpaperImage", wallpaperImage);

    if (!wallpaperName || !category) {
      return;
    }
    // Check if the file exists
    if (!wallpaperImage) {
      res.status(400).json({ error: "Wallpaper image is required" });
      return;
    }

    const imgUploaded = await uploadToCloudinary(wallpaperImage.path);
    console.log(imgUploaded);

    if (!imgUploaded) {
      res.status(400).json({ error: "Cloudinary image uploading error" });
      return;
    }

    const newWallpaper = new WallpaperModel({
      id: imgUploaded.public_id,
      wallpaperName,
      category,
      url: imgUploaded.secure_url,
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

export { addWallpaperController, getWallpapersByCategoryController };
