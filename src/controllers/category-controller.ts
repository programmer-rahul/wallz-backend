import { Request, Response } from "express";
import WallpaperModel from "../models/wallpaper-schema";
import { redisClient } from "../config/redis";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

const getAllCategoriesController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const cacheKey = "categories";

  const cachedData = await redisClient.get(cacheKey);

  if (cachedData) {
    res.status(200).json(
      new ApiResponse(200, "Categories fetched succesfully from cache!", {
        allCategories: JSON.parse(cachedData),
      })
    );
    return;
  }

  const categories = await WallpaperModel.aggregate([
    {
      $group: {
        _id: "$category",
        previewUrl: { $first: "$url" },
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
    throw new ApiError("No categories found", 400);
  }

  await redisClient.setex(cacheKey, 3600, JSON.stringify(categories));

  res.status(200).json(
    new ApiResponse(200, "Categories fetched successfully", {
      allCategories: categories,
    })
  );
};

const renameCategoryController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { oldCategoryName, newCategoryName } = req.body;

  if (!oldCategoryName || !newCategoryName) {
    throw new ApiError(
      "Both 'oldCategoryName' and 'newCategoryName' are required",
      400
    );
  }

  const categoryExists = await WallpaperModel.exists({
    category: oldCategoryName,
  });
  if (!categoryExists) {
    throw new ApiError("The category to rename does not exist", 404);
  }

  const result = await WallpaperModel.updateMany(
    { category: oldCategoryName },
    { category: newCategoryName }
  );

  if (result.modifiedCount === 0) {
    throw new ApiError("Failed to rename the category", 500);
  }

  const cacheKey = "categories";
  await redisClient.del(cacheKey);

  res.status(200).json(
    new ApiResponse(200, "Category renamed successfully", {
      oldCategoryName,
      newCategoryName,
    })
  );
};

const removeCategoryController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { categoryName } = req.body;

  if (!categoryName) {
    throw new ApiError("The 'categoryName' is required", 400);
  }
  const categoryExists = await WallpaperModel.exists({
    category: categoryName,
  });
  if (!categoryExists) {
    throw new ApiError("The category to remove does not exist", 404);
  }

  const result = await WallpaperModel.deleteMany({ category: categoryName });

  if (result.deletedCount === 0) {
    throw new ApiError("Failed to remove the category", 500);
  }

  const cacheKey = "categories";
  await redisClient.del(cacheKey);

  res.status(200).json(
    new ApiResponse(200, "Category removed successfully", {
      categoryName,
    })
  );
};

export {
  getAllCategoriesController,
  renameCategoryController,
  removeCategoryController,
};
