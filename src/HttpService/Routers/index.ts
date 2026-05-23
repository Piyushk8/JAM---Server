import { Router } from "express";
import { authMiddleware } from "../authMiddleware";
import { pluginHost } from "../../plugins/pluginHost";
import { userRouter } from "./userRouter";

export const mainRouter = Router();

mainRouter.use("/user", userRouter);
mainRouter.use("/plugins", authMiddleware, pluginHost.getRouter());
