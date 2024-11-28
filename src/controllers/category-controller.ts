import { Request, Response } from "express";
import WallpaperModel from "../models/wallpaper-schema";
import { redisClient } from "../config/redis";

const getAllCategoriesController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const cacheKey = "categories";

    // Check Redis cache
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      res.status(200).json({ allCategories: JSON.parse(cachedData) });
      return;
    }

    // Fetch categories from database
    const categories = await WallpaperModel.aggregate([
      {
        $group: {
          _id: "$category", // Group by category
          previewUrl: { $first: "$url" }, // Use the first image URL as preview
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          previewUrl: 1,
        },
      },
    ]);

    if (!categories.length) {
      res.status(404).json({ error: "No categories found" });
      return;
    }

    // Cache categories in Redis for 1 hour
    await redisClient.setex(cacheKey, 3600, JSON.stringify(categories));

    res.status(200).json({ allCategories: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Error fetching categories" });
  }
};

export { getAllCategoriesController };
