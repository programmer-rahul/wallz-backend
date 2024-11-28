import { createClient } from "redis";

const redisClient = createClient();

redisClient.on("error", (err) => console.error("Redis Client Error", err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected successfully");
  } catch (error) {
    console.error("Error connecting to Redis:", error);
  }
};

// redis connection events
redisClient.on("ready", () => {
  console.log("Redis client is ready");
});

redisClient.on("error", (err) => {
  console.error("Redis client error:", err);
});

redisClient.on("end", () => {
  console.log("Redis connection closed");
});

export { redisClient, connectRedis };
