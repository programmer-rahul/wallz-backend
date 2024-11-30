import { Router } from "express";
import upload from "../middlewares/multer-middleware";
import {
  addBulkWallpapersController,
  addWallpaperDownloadCountController,
  addWallpaperViewCountController,
  deleteWallpaperByIdController,
  getWallpapersByCategoryController,
} from "../controllers/wallpaper-controller";
import asyncHandler from "../utils/asyncHandler";

const wallpaperRouter = Router();

wallpaperRouter
  .route("/add-wallpaper-bulk")
  .post(upload.array("wallpapers"), asyncHandler(addBulkWallpapersController));

wallpaperRouter
  .route("/get-wallpaper/:category")
  .get(asyncHandler(getWallpapersByCategoryController));

wallpaperRouter
  .route("/inc-view-count")
  .put(asyncHandler(addWallpaperViewCountController));

wallpaperRouter
  .route("/inc-download-count")
  .put(asyncHandler(addWallpaperDownloadCountController));

wallpaperRouter
  .route("/delete-wallpaper/:id")
  .delete(asyncHandler(deleteWallpaperByIdController));

export { wallpaperRouter };
