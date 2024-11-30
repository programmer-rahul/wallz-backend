import express from "express";
import DBConnect from "./src/config/db-connection";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { wallpaperRouter } from "./src/routes/wallpaper-route";
import { categoryRouter } from "./src/routes/category-route";
import { connectCloudinary } from "./src/config/cloudinary";
import { connectRedis, redisClient } from "./src/config/redis";
import errorHandler from "./src/middlewares/error-handler";

dotenv.config({ path: ".env" });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later.",
  })
);

// Routes
app.use("/wallpaper", wallpaperRouter);
app.use("/category", categoryRouter);
app.get("/health", (_, res) => {
  res.status(200).json({ status: "UP", timestamp: Date.now() });
});

// Error handling middleware
app.use(errorHandler);

DBConnect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}!`);
    });
    connectRedis();
    connectCloudinary();
  })
  .catch((err) => {
    console.log("Database connection error: ", err);
  });

// Shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await redisClient.quit();
  process.exit(0);
});
