import Redis from "ioredis";

let redisClient: Redis;
const redisUrl =
  process.env.REDIS_URL ||
  "redis://localhost:6379";

const connectRedis = async () => {
  try {
    redisClient = new Redis(redisUrl);
    console.log("Redis connected successfully");

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

    redisClient.on("error", (err) => console.error("Redis Client Error", err));
  } catch (error) {
    console.error("Error connecting to Redis:", error);
  }
};

export { redisClient, connectRedis };
