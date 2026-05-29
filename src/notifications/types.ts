export type NotificationActionSection =
  | "notifications"
  | "chat"
  | "plugins"
  | "team"
  | "rooms"
  | "events";

export type NotificationRecord = {
  id: string;
  recipientId: string;
  roomId: string | null;
  actorId: string | null;
  actorName: string | null;
  type: string;
  title: string;
  body: string | null;
  status: "unread" | "read";
  actionSection: NotificationActionSection | null;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date | null;
  readAt: Date | null;
};

export type CreateNotificationInput = {
  recipientId: string;
  roomId?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  type: string;
  title: string;
  body?: string | null;
  actionSection?: NotificationActionSection | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};
