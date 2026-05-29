import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/init";
import { Notifications } from "../db/schema";
import roomManager from "../RoomManager/roomManager";
import type { ServerType } from "../types/type";
import type { CreateNotificationInput, NotificationRecord } from "./types";

const toRecord = (row: typeof Notifications.$inferSelect): NotificationRecord => ({
  ...row,
  actionSection: row.actionSection as NotificationRecord["actionSection"],
  metadata: row.metadata ?? {},
});

class NotificationService {
  private io: ServerType | null = null;

  public setIO(io: ServerType): void {
    this.io = io;
  }

  public async listForUser(userId: string): Promise<NotificationRecord[]> {
    const rows = await db
      .select()
      .from(Notifications)
      .where(
        and(
          eq(Notifications.recipientId, userId),
          eq(Notifications.status, "unread")
        )
      )
      .orderBy(desc(Notifications.createdAt))
      .limit(50);

    return rows.map(toRecord);
  }

  public async create(input: CreateNotificationInput): Promise<NotificationRecord> {
    const [row] = await db
      .insert(Notifications)
      .values({
        recipientId: input.recipientId,
        roomId: input.roomId ?? null,
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? null,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        actionSection: input.actionSection ?? "notifications",
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? {},
      })
      .returning();

    const notification = toRecord(row);
    this.emitToUser(notification.recipientId, notification);
    return notification;
  }

  public async createForUsers(
    recipientIds: string[],
    input: Omit<CreateNotificationInput, "recipientId">
  ): Promise<NotificationRecord[]> {
    const uniqueRecipientIds = [...new Set(recipientIds)].filter(
      (id) => id && id !== input.actorId
    );

    if (uniqueRecipientIds.length === 0) {
      return [];
    }

    const rows = await db
      .insert(Notifications)
      .values(
        uniqueRecipientIds.map((recipientId) => ({
          recipientId,
          roomId: input.roomId ?? null,
          actorId: input.actorId ?? null,
          actorName: input.actorName ?? null,
          type: input.type,
          title: input.title,
          body: input.body ?? null,
          actionSection: input.actionSection ?? "notifications",
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
          metadata: input.metadata ?? {},
        }))
      )
      .returning();

    const notifications = rows.map(toRecord);
    notifications.forEach((notification) =>
      this.emitToUser(notification.recipientId, notification)
    );
    return notifications;
  }

  public async createForRoom(
    roomId: string,
    input: Omit<CreateNotificationInput, "recipientId" | "roomId">
  ): Promise<NotificationRecord[]> {
    const users = Array.from(roomManager.getRoomUsers(roomId).values());
    return this.createForUsers(
      users.map((user) => user.id),
      { ...input, roomId }
    );
  }

  public async markReadAndDelete(
    userId: string,
    notificationId: string
  ): Promise<boolean> {
    const [existing] = await db
      .update(Notifications)
      .set({ status: "read", readAt: new Date() })
      .where(
        and(
          eq(Notifications.id, notificationId),
          eq(Notifications.recipientId, userId)
        )
      )
      .returning();

    if (!existing) {
      return false;
    }

    await db
      .delete(Notifications)
      .where(
        and(
          eq(Notifications.id, notificationId),
          eq(Notifications.recipientId, userId)
        )
      );

    return true;
  }

  private emitToUser(userId: string, notification: NotificationRecord): void {
    if (!this.io) {
      return;
    }

    const target = roomManager.getUser(userId);
    if (!target?.socketId) {
      return;
    }

    this.io.to(target.socketId).emit("notification:new", notification);
  }
}

export const notificationService = new NotificationService();
