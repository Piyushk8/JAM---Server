import { Router } from "express";
import { getuser, userSignIn, userSignUp } from "../Controllers/User";
import { authMiddleware } from "../authMiddleware";

export const userRouter = Router();
userRouter.post("/login", userSignIn);
userRouter.post("/signup", userSignUp);

userRouter.use(authMiddleware);
userRouter.get("/me", getuser);

