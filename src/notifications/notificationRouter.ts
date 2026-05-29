import { Router } from "express";
import { authMiddleware, type AuthRequest } from "../HttpService/authMiddleware";
import { notificationService } from "./notificationService";

export const notificationRouter = Router();

notificationRouter.use(authMiddleware);

notificationRouter.get("/", async (req: AuthRequest, res) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const notifications = await notificationService.listForUser(req.user.userId);
  return res.json({ success: true, data: notifications });
});

notificationRouter.post("/:notificationId/read", async (req: AuthRequest, res) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const ok = await notificationService.markReadAndDelete(
    req.user.userId,
    req.params.notificationId
  );

  if (!ok) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }

  return res.json({ success: true });
});
