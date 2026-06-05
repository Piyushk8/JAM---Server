import { desc, eq } from "drizzle-orm";
import { db } from "../db/init";
import { ChatMessages } from "../db/schema";
import type { ChatMessage } from "../types/type";

const HISTORY_LIMIT = 120;

const toMessage = (row: typeof ChatMessages.$inferSelect): ChatMessage => ({
  id: row.id,
  userId: row.senderId,
  username: row.senderName,
  message: row.body,
  type: row.messageType === "emoji" ? "emoji" : "text",
  timestamp: row.createdAt?.getTime() ?? Date.now(),
  roomId: row.roomId,
  x: row.x,
  y: row.y,
  scope: row.scope,
  toUserId: row.recipientId ?? undefined,
  recipientIds: row.recipientIds,
});

const isVisibleToUser = (message: ChatMessage, userId: string) => {
  if (message.scope === "direct") {
    return message.userId === userId || message.toUserId === userId;
  }

  if (message.scope === "nearby") {
    return message.userId === userId || message.recipientIds?.includes(userId);
  }

  return true;
};

class ChatMessageService {
  public async create(message: ChatMessage): Promise<ChatMessage> {
    await db
      .insert(ChatMessages)
      .values({
        id: message.id,
        roomId: message.roomId,
        senderId: message.userId,
        senderName: message.username,
        recipientId: message.scope === "direct" ? message.toUserId ?? null : null,
        recipientIds: message.recipientIds ?? [],
        scope: message.scope ?? "room",
        messageType: message.type,
        body: message.message,
        x: Math.round(message.x),
        y: Math.round(message.y),
        createdAt: new Date(message.timestamp),
      })
      .onConflictDoNothing();

    return message;
  }

  public async listVisibleForUser(
    roomId: string,
    userId: string
  ): Promise<ChatMessage[]> {
    const rows = await db
      .select()
      .from(ChatMessages)
      .where(eq(ChatMessages.roomId, roomId))
      .orderBy(desc(ChatMessages.createdAt))
      .limit(HISTORY_LIMIT);

    return rows
      .map(toMessage)
      .filter((message) => isVisibleToUser(message, userId))
      .reverse();
  }
}

export const chatMessageService = new ChatMessageService();
