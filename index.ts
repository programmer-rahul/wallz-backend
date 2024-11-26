import express from "express";
import DBConnect from "./src/config/db-connection";
import dotenv from "dotenv";
import cors from "cors";
import { wallpaperRouter } from "./src/routes/wallpaper-route";
import { categoryRouter } from "./src/routes/category-route";

dotenv.config({
  path: ".env",
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

// routes
app.use("/wallpaper", wallpaperRouter);
app.use("/category", categoryRouter);

DBConnect()
  .then(() =>
    app.listen(PORT, () => {
      "Server is running!";
    })
  )
  .catch((err) => {
    console.log("Database connection error :- ", err);
  });
