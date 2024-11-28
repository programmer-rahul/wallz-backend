import { Router } from "express";
import upload from "../middlewares/multer-middleware";
import {
  addBulkWallpapersController,
  addWallpaperController,
  getWallpapersByCategoryController,
} from "../controllers/wallpaper-controller";

const wallpaperRouter = Router();

wallpaperRouter
  .route("/add-wallpaper")
  .post(upload.single("wallpaperImage"), addWallpaperController);

wallpaperRouter
  .route("/add-wallpaper-bulk")
  .post(upload.array("wallpapers"), addBulkWallpapersController);

wallpaperRouter
  .route("/get-wallpaper/:category")
  .get(getWallpapersByCategoryController);

export { wallpaperRouter };
