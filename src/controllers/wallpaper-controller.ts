import { Request, Response } from "express";
import { removeToCloudinary, uploadToCloudinary } from "../config/cloudinary";
import WallpaperModel from "../models/wallpaper-schema";
import { redisClient } from "../config/redis";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

// Bulk Upload Wallpapers
const addBulkWallpapersController = async (req: Request, res: Response) => {
  const { category } = req.body;
  const wallpaperImages = req.files as Express.Multer.File[];

  if (!category || !wallpaperImages?.length) {
    throw new ApiError("Category and images are required", 400);
  }

  const uploadedWallpapers = [];

  for (const wallpaper of wallpaperImages) {
    const imgUploaded = await uploadToCloudinary(wallpaper.path);

    if (!imgUploaded) continue;

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

  // Invalidate caches
  await redisClient.del("categories");
  await redisClient.keys("wallpapers:*").then((keys) => {
    if (keys.length) redisClient.del(keys);
  });

  res.status(200).json(
    new ApiResponse(200, "Wallpapers uploaded successfully", {
      uploadedWallpapers,
    })
  );
};

// Get Wallpapers By Category
const getWallpapersByCategoryController = async (
  req: Request,
  res: Response
) => {
  const { category } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const favouriteIds = req.query?.favouriteIds;

  if (!category) {
    throw new ApiError("Category is required", 400);
  }

  const cacheKey = `wallpapers:${category}:${page}:${limit}`;
  const cachedData = await redisClient.get(cacheKey);

  if (cachedData) {
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Wallpapers fetched from cache",
          JSON.parse(cachedData)
        )
      );
    return;
  }

  const skip = (page - 1) * limit;
  let wallpapers, totalCount;

  if (category === "all-wallpapers") {
    wallpapers = await WallpaperModel.aggregate([{ $sample: { size: limit } }]);
    totalCount = await WallpaperModel.countDocuments({});
  } else if (category === "favourite" && favouriteIds) {
    const ids = JSON.parse(favouriteIds as string);
    wallpapers = await WallpaperModel.find({ id: { $in: ids } })
      .skip(skip)
      .limit(limit);
    totalCount = await WallpaperModel.countDocuments({ id: { $in: ids } });
  } else {
    wallpapers = await WallpaperModel.find({ category })
      .skip(skip)
      .limit(limit);
    totalCount = await WallpaperModel.countDocuments({ category });
  }

  const totalPages = Math.ceil(totalCount / limit);
  const result = { page, limit, totalPages, totalCount, wallpapers };

  if (category !== "favourite") {
    await redisClient.setex(cacheKey, 900, JSON.stringify(result));
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Wallpapers fetched successfully", result));
};

// Increment View Count
const addWallpaperViewCountController = async (req: Request, res: Response) => {
  const wallpaperId = req.query.wallpaperId as string;

  if (!wallpaperId) {
    throw new ApiError("WallpaperId is required", 400);
  }

  const updatedCount = await WallpaperModel.findOneAndUpdate(
    { id: wallpaperId },
    { $inc: { viewCount: 1 } }
  );

  if (!updatedCount) {
    throw new ApiError("Wrong wallpaper id or wallpaper does not exist", 400);
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Wallpaper view count incremented successfully",
        null
      )
    );
};

// Increment Download Count
const addWallpaperDownloadCountController = async (
  req: Request,
  res: Response
) => {
  const wallpaperId = req.query.wallpaperId as string;

  if (!wallpaperId) {
    throw new ApiError("WallpaperId is required", 400);
  }

  const updatedCount = await WallpaperModel.findOneAndUpdate(
    { id: wallpaperId },
    { $inc: { downloadCount: 1 } }
  );

  if (!updatedCount) {
    throw new ApiError(
      "Error in incrementing download count of wallpaper",
      500
    );
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Wallpaper download count incremented successfully",
        null
      )
    );
};

// Delete Wallpaper
const deleteWallpaperByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError("Wallpaper ID is required", 400);
  }

  // Find and delete wallpaper by ID
  const wallpaper = await WallpaperModel.findOneAndDelete({ id });

  if (!wallpaper) {
    throw new ApiError("Wallpaper not found", 404);
  }
  // Remove from cloudinary
  removeToCloudinary(id);

  const categoryCacheKey = "categories";
  const wallpapersCachePattern = `wallpapers:*`;

  await redisClient.del(categoryCacheKey);
  const cacheKeys = await redisClient.keys(wallpapersCachePattern);
  if (cacheKeys.length > 0) {
    await redisClient.del(cacheKeys);
  }

  res.status(200).json(
    new ApiResponse(200, "Wallpaper deleted successfully", {
      deletedWallpaper: wallpaper,
    })
  );
};

export {
  addBulkWallpapersController,
  getWallpapersByCategoryController,
  addWallpaperViewCountController,
  addWallpaperDownloadCountController,
  deleteWallpaperByIdController,
};
