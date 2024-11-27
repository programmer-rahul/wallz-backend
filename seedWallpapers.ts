import mongoose from "mongoose";
import WallpaperModel from "./src/models/wallpaper-schema"; // Adjust the path if needed

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URL as string;
mongoose
  .connect(mongoUri, {})
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Define two static image URLs
const imageUrls = [
  "https://res.cloudinary.com/dubmozsyq/image/upload/v1732549461/m1xuy1aolrc6b5bd5pzx.jpg",
  "https://res.cloudinary.com/dubmozsyq/image/upload/v1732550569/reukbmqapdzuc7fgnmzo.jpg",
];

// Define categories
const categories = [
  "Nature",
  "Architecture",
  "Animals",
  "Abstract",
  "Space",
  "Technology",
  "Art",
];

// Function to generate sample wallpapers
const generateSampleWallpapers = () => {
  const wallpapers: {
    url: string;
    category: string;
    id: string;
    name: string;
  }[] = [];

  categories.forEach((category) => {
    console.log(`Generating wallpapers for category: ${category}`); // For debugging

    for (let i = 0; i < 20; i++) {
      wallpapers.push({
        name: `${category}_${i + 1}`,
        url: imageUrls[i % 2], // Alternate between the two URLs
        category,
        id: `${category}_${i + 1}`, // Unique ID for each wallpaper
      });
    }
  });

  return wallpapers;
};

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Remove any existing wallpapers to start fresh
    await WallpaperModel.deleteMany({});

    // Generate and insert the sample wallpapers
    const sampleWallpapers = generateSampleWallpapers();
    console.log("Inserting wallpapers into database...");

    await WallpaperModel.insertMany(sampleWallpapers);

    console.log("Database seeded with sample wallpapers");
    mongoose.disconnect();
  } catch (error) {
    console.error("Error seeding database:", error);
    mongoose.disconnect();
  }
};

seedDatabase();
