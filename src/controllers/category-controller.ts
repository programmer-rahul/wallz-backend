import { Request, Response } from "express";

interface TCategory {
  name: string;
  previewUrl: string;
}

const ALLCategories: TCategory[] = [
  {
    name: "Nature",
    previewUrl:
      "https://res.cloudinary.com/dubmozsyq/image/upload/v1732549461/m1xuy1aolrc6b5bd5pzx.jpg",
  },
  {
    name: "Architecture",
    previewUrl:
      "https://res.cloudinary.com/dubmozsyq/image/upload/v1732550569/reukbmqapdzuc7fgnmzo.jpg",
  },
  {
    name: "Abstract",
    previewUrl:
      "https://res.cloudinary.com/dubmozsyq/image/upload/v1732549461/m1xuy1aolrc6b5bd5pzx.jpg",
  },
  {
    name: "Space",
    previewUrl:
      "https://res.cloudinary.com/dubmozsyq/image/upload/v1732550569/reukbmqapdzuc7fgnmzo.jpg",
  },
  {
    name: "Technology",
    previewUrl:
      "https://res.cloudinary.com/dubmozsyq/image/upload/v1732549461/m1xuy1aolrc6b5bd5pzx.jpg",
  },
  {
    name: "Art",
    previewUrl:
      "https://res.cloudinary.com/dubmozsyq/image/upload/v1732550569/reukbmqapdzuc7fgnmzo.jpg",
  },
  {
    name: "Animals",
    previewUrl:
      "https://res.cloudinary.com/dubmozsyq/image/upload/v1732549461/m1xuy1aolrc6b5bd5pzx.jpg",
  },
];

const getAllCategoriesController = async (_req: Request, res: Response) => {
  try {
    // Return the results with pagination info
    res.status(200).json({
      allCategories: ALLCategories,
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching categories" });
  }
};

export { getAllCategoriesController };
