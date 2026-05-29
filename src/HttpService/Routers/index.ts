import { Router } from "express";
import { authMiddleware } from "../authMiddleware";
import { pluginHost } from "../../plugins/pluginHost";
import { userRouter } from "./userRouter";
import { notificationRouter } from "../../notifications/notificationRouter";

export const mainRouter = Router();

mainRouter.use("/user", userRouter);
mainRouter.use("/notifications", notificationRouter);
mainRouter.use("/plugins", authMiddleware, pluginHost.getRouter());
