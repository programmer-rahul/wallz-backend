import { Router } from "express";
import { getAllCategoriesController } from "../controllers/category-controller";

const categoryRouter = Router();

categoryRouter.route("/get-categories").get(getAllCategoriesController);

export { categoryRouter };
