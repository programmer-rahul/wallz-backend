import { Request, Response } from "express";
import { uploadToCloudinary } from "../config/cloudinary";
import WallpaperModel from "../models/wallpaper-schema";
import { redisClient } from "../config/redis";

const addWallpaperController = async (req: Request, res: Response) => {
  try {
    console.log("add wallpaper request");
    const { category } = req.body;
    const wallpaperImage = req.file;

    if (!category || !wallpaperImage) {
      res.status(400).json({ error: "Category and image are required" });
      return;
    }

    const imgUploaded = await uploadToCloudinary(wallpaperImage.path);

    if (!imgUploaded) {
      res.status(400).json({ error: "Error uploading image to Cloudinary" });
      return;
    }

    const newWallpaper = new WallpaperModel({
      id: imgUploaded.public_id,
      category,
      url: imgUploaded.secure_url,
      downloadCount: 0,
      viewCount: 0,
    });

    await newWallpaper.save();

    // Invalidate relevant Redis caches
    await redisClient.del("categories"); // Clear category cache
    await redisClient.keys(`wallpapers:*`).then((keys) => {
      if (keys.length) redisClient.del(keys); // Clear all wallpaper-related caches
    });

    res.status(200).json({ message: "Wallpaper added successfully" });
  } catch (error) {
    console.error("Error adding wallpaper:", error);
    res.status(500).json({ error: "Failed to add wallpaper" });
  }
};

const getWallpapersByCategoryController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const favouriteIds = req.query?.favouriteIds;

    const cacheKey = `wallpapers:${category}:${page}:${limit}`;

    // Check Redis cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      res.status(200).json(JSON.parse(cachedData));
      return;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    let wallpapers, totalCount;

    if (category === "all-wallpapers") {
      wallpapers = await WallpaperModel.find({}).skip(skip).limit(limit);
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

    const result = {
      page,
      limit,
      totalPages,
      totalCount,
      wallpapers,
    };

    // Cache result in Redis for 30 minutes
    await redisClient.setEx(cacheKey, 1800, JSON.stringify(result));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching wallpapers:", error);
    res.status(500).json({ error: "Error fetching wallpapers" });
  }
};

const addBulkWallpapersController = async (req: Request, res: Response) => {
  try {
    const { category } = req.body;
    const wallpaperImages = req.files as Express.Multer.File[];

    if (!category || !wallpaperImages?.length) {
      res.status(400).json({ error: "Category and images are required" });
      return;
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
    await redisClient.keys(`wallpapers:*`).then((keys) => {
      if (keys.length) redisClient.del(keys);
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
  addBulkWallpapersController,
  getWallpapersByCategoryController,
};
