import { Router } from "express";
import { userSignIn, userSignUp } from "../Controllers/User";

export const userRouter = Router()

userRouter.post("/login",userSignIn)
userRouter.post("/signup",userSignUp)