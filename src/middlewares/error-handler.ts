import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("inside error",err);

  if (err instanceof ApiError) {
    const { errors, message, statusCode = 500 } = err;
    res
      .status(statusCode)
      .json(new ApiResponse(statusCode, message, null, false, errors));
  } else {
    res
      .status(500)
      .json(
        new ApiResponse(500, "Internal Server Error", null, false, [
          err.message,
        ])
      );
  }
};

export default errorHandler;
