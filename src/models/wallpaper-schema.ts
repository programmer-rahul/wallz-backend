import mongoose from "mongoose";

const wallpaperSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    category: { type: String, required: true },
    id: { type: String, required: true },
    viewCount: { type: Number, required: true },
    downloadCount: { type: Number, required: true },
  },
  { timestamps: true }
);
wallpaperSchema.index({ category: 1 });

const WallpaperModel = mongoose.model("Wallpaper", wallpaperSchema);

export default WallpaperModel;
