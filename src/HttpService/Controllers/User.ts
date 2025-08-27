import { Request, Response } from "express";
import { Users } from "../../db/schema";
import { db } from "../../db/init";
import { eq } from "drizzle-orm";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
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
    console.log(username, password, typeof password);
    const user = await db.query.Users.findFirst({
      where: eq(Users.username, username),
    });
    console.log("signin ", user);
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

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
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
