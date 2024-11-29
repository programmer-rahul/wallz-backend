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

    // Invalidate relevant redisClient caches
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

const getWallpapersByCategoryController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("get wallpapers request");
    const { category } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const favouriteIds = req.query?.favouriteIds;

    const cacheKey = `wallpapers:${category}:${page}:${limit}`;

    // Check redisClient cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      res.status(200).json(JSON.parse(cachedData));
      return;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    let wallpapers, totalCount;

    if (category === "all-wallpapers") {
      wallpapers = await WallpaperModel.aggregate([
        { $sample: { size: limit } },
      ]);
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

    // Cache result in redisClient for 15 minutes
    category !== "favourite" &&
      (await redisClient.setex(cacheKey, 900, JSON.stringify(result)));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching wallpapers:", error);
    res.status(500).json({ error: "Error fetching wallpapers" });
  }
};

const addWallpaperViewCountController = async (req: Request, res: Response) => {
  try {
    const wallpaperId = req.query.wallpaperId as string;
    console.log("wallpaperId", wallpaperId);

    if (!wallpaperId) {
      res.status(400).json({ error: "WallpaperId is required" });
      return;
    }
    const updatedCount = await WallpaperModel.findOneAndUpdate(
      {
        id: wallpaperId,
      },
      { $inc: { viewCount: 1 } }
    );

    if (!updatedCount) {
      res
        .status(400)
        .json({ error: "Error in increamenting view count of wallpaper" });
      return;
    }

    res.status(200).json({
      message: "Wallpapers view count increamented successfully",
      status: true,
    });
  } catch (error) {
    console.error("Error in increamenting view count of wallpaper ", error);
    res
      .status(500)
      .json({ error: "Error in increamenting view count of wallpaper" });
  }
};

const addWallpaperDownloadCountController = async (
  req: Request,
  res: Response
) => {
  try {
    const wallpaperId = req.query.wallpaperId as string;
    console.log("wallpaperId", wallpaperId);

    if (!wallpaperId) {
      res.status(400).json({ error: "WallpaperId is required" });
      return;
    }
    const updatedCount = await WallpaperModel.findOneAndUpdate(
      {
        id: wallpaperId,
      },
      { $inc: { downloadCount: 1 } }
    );

    if (!updatedCount) {
      res
        .status(400)
        .json({ error: "Error in increamenting download count of wallpaper" });
      return;
    }

    res.status(200).json({
      message: "Wallpapers download count increamented successfully",
      status: true,
    });
  } catch (error) {
    console.error("Error in increamenting download count of wallpaper ", error);
    res
      .status(500)
      .json({ error: "Error in increamenting download count of wallpaper" });
  }
};

export {
  addWallpaperController,
  addBulkWallpapersController,
  getWallpapersByCategoryController,
  addWallpaperViewCountController,
  addWallpaperDownloadCountController,
};
