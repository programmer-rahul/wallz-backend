import { Request, Response, NextFunction, RequestHandler } from "express";

const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

export default asyncHandler;
