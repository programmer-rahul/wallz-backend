import { Request, Response } from "express";
import WallpaperModel from "../models/wallpaper-schema";

interface TCategory {
  name: string;
  previewUrl: string;
}

interface TCategory {
  name: string;
  previewUrl: string;
}

const getAllCategoriesController = async (_req: Request, res: Response) => {
  try {
    // Aggregate distinct categories along with a preview URL for each category
    const categories: TCategory[] = await WallpaperModel.aggregate([
      {
        $group: {
          _id: "$category", // Group by category
          previewUrl: { $first: "$url" }, // Pick the first image URL as preview
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

    res.status(200).json({ allCategories: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Error fetching categories" });
  }
};

export { getAllCategoriesController };
