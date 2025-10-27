import { NextFunction, Request, Response } from "express";
import { JWT_SECRET } from "../lib/contants";
import jwt from "jsonwebtoken";
export interface AuthRequest extends Request {
  user?: { userId: string; username: string };
}
export type JSONPAYLOAD = {
  userId: string;
  username: string;
};
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.token; 
  if (!token) {
    return res.status(401).json({ message: "No token, unauthorized" });
  }

  try {
    if (!JWT_SECRET) throw new Error("[auth:mid] - no jwt token");
    const decoded = jwt.verify(token, JWT_SECRET) as JSONPAYLOAD;
    req.user = decoded; 
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
