import { Router } from "express";
import {
  getAllCategoriesController,
  removeCategoryController,
  renameCategoryController,
} from "../controllers/category-controller";
import asyncHandler from "../utils/asyncHandler";

const categoryRouter = Router();

categoryRouter
  .route("/get-categories")
  .get(asyncHandler(getAllCategoriesController));

categoryRouter
  .route("/rename-category")
  .put(asyncHandler(renameCategoryController));

categoryRouter
  .route("/remove-category")
  .delete(asyncHandler(removeCategoryController));

export { categoryRouter };
