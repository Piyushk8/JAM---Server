import { Request, Response } from "express";
import { Users } from "../../db/schema";
import { db } from "../../db/init";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../lib/contants";
import { AuthRequest } from "../authMiddleware";
type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export const getuser = async (
  req: AuthRequest,
  res: Response<ApiResponse<Partial<typeof Users.$inferSelect>>>
) => {
  try {
    if (!req.user)
      return res.status(400).json({
        success: false,
        message: "user not authenticated",
      });
    const { userId, username } = req.user;
    const user = await db.query.Users.findFirst({
      where: eq(Users.id, userId),
    });
    if (!user)
      return res.status(404).json({
        success: false,
        message: "user not found",
      });

    return res.status(200).json({
      success: true,
      data: { username, id: userId },
      message: "found the user",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

export const userSignIn = async (
  req: Request,
  res: Response<ApiResponse<Partial<typeof Users.$inferSelect>>>
) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.json({
        success: false,
        message: "username or password not passed",
      });
    const user = await db.query.Users.findFirst({
      where: eq(Users.username, username),
    });
    if (!user) {
      return res.status(404).json({
        message: "username or password not provided",
        success: false,
      });
    }
    if (user.password != password)
      return res.status(404).json({
        message: "password invalid",
        success: false,
      });
    if (!JWT_SECRET) throw new Error("no jwt secret found");
    const token = jwt.sign({ id: 1, username, userId: user.id }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.log("signIn:error", error);
    res.status(404).json({
      message: "error logging in",
      success: false,
    });
  }
};

export const userSignUp = async (
  req: Request,
  res: Response<ApiResponse<typeof Users.$inferSelect>>
) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "username or password not passed",
      });
    }

    const userExists = await db.query.Users.findFirst({
      where: eq(Users.username, username),
    });

    if (userExists) {
      return res.status(409).json({
        success: false,
        message: "user already exists",
      });
    }

    const inserted = await db
      .insert(Users)
      .values({
        username,
        password,
      })
      .returning();

    if (!JWT_SECRET) throw new Error("no jwt secret found");
    const token = jwt.sign(
      { id: 1, username, userId: inserted[0].id },
      JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
    return res.status(201).json({
      success: true,
      data: inserted[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Unexpected error signing up",
    });
  }
};
