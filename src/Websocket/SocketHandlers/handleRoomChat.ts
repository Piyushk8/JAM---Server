import { ChatMessage, SocketType, TypingUser } from "../../types/type";
import { chatMessageService } from "../../chat/chatMessageService";
import { IDeps, IO } from "../SocketServer";

const MAX_MESSAGE_LENGTH = 1000;

const getNearbyRecipientIds = (
  message: ChatMessage,
  senderId: string,
  deps: IDeps
) => {
  const proximityIds = deps.roomManager.getNearbyUsers(message.roomId, senderId);
  const allowedIds = new Set(proximityIds ?? []);
  const requestedIds = message.recipientIds?.length
    ? message.recipientIds
    : Array.from(allowedIds);

  return requestedIds.filter((id) => id !== senderId && allowedIds.has(id));
};

const emitToUsers = (
  io: IO,
  roomId: string,
  userIds: string[],
  message: ChatMessage,
  deps: IDeps
) => {
  const roomUsers = deps.roomManager.getRoomUsers(roomId);

  userIds.forEach((userId) => {
    const recipient = roomUsers.get(userId);
    if (recipient?.socketId) {
      io.to(recipient.socketId).emit("chat:message", message);
    }
  });
};

const getRoomRecipientIds = (
  roomId: string,
  senderId: string,
  deps: IDeps
) =>
  Array.from(deps.roomManager.getRoomUsers(roomId).keys()).filter(
    (userId) => userId !== senderId
  );

export const handleRoomChat = (io: IO, socket: SocketType, deps: IDeps) => {
  socket.on("chat:history", async (data) => {
    const sender = deps.roomManager.getUser(socket.data.userId);
    if (!sender || sender.roomId !== data.roomId) return;

    try {
      const history = await chatMessageService.listVisibleForUser(
        sender.roomId,
        sender.id
      );
      socket.emit("chat:history", history);
    } catch (error) {
      socket.data.log?.error({ err: error }, "failed to load chat history");
    }
  });

  socket.on("chat:message", async (message) => {
    const sender = deps.roomManager.getUser(socket.data.userId);
    const text = message.message.trim().slice(0, MAX_MESSAGE_LENGTH);

    if (!sender || !text || sender.roomId !== message.roomId) {
      return;
    }

    const normalizedMessage: ChatMessage = {
      ...message,
      userId: sender.id,
      username: sender.username,
      message: text,
      roomId: sender.roomId,
      timestamp: message.timestamp || Date.now(),
      scope: message.scope ?? "room",
    };

    let recipientIds: string[] = [];

    try {
      if (normalizedMessage.scope === "direct" && normalizedMessage.toUserId) {
        const target = deps.roomManager.getUserFromRoom(
          sender.roomId,
          normalizedMessage.toUserId
        );
        if (!target) return;

        recipientIds = [normalizedMessage.toUserId];
        await chatMessageService.create(normalizedMessage);
        emitToUsers(io, sender.roomId, recipientIds, normalizedMessage, deps);
        return;
      }

      if (normalizedMessage.scope === "nearby") {
        recipientIds = getNearbyRecipientIds(normalizedMessage, sender.id, deps);
        normalizedMessage.recipientIds = recipientIds;
        await chatMessageService.create(normalizedMessage);
        emitToUsers(io, sender.roomId, recipientIds, normalizedMessage, deps);
        return;
      }

      recipientIds = getRoomRecipientIds(sender.roomId, sender.id, deps);
      await chatMessageService.create(normalizedMessage);
      socket.to(sender.roomId).emit("chat:message", normalizedMessage);
    } catch (error) {
      socket.data.log?.error(
        { err: error, messageId: normalizedMessage.id },
        "failed to process chat message"
      );
    }
  });

  socket.on("chat:startTyping", (data: TypingUser) => {
    const sender = deps.roomManager.getUser(socket.data.userId);
    if (!sender || sender.roomId !== data.roomId) return;

    const normalizedTyping: TypingUser = {
      ...data,
      userId: sender.id,
      username: sender.username,
      roomId: sender.roomId,
      scope: data.scope ?? "room",
    };

    if (normalizedTyping.scope === "nearby") {
      emitTypingToUsers(io, normalizedTyping, deps);
      return;
    }

    socket.to(sender.roomId).emit("chat:startTyping", normalizedTyping);
  });

  socket.on("chat:stopTyping", (data) => {
    const sender = deps.roomManager.getUser(socket.data.userId);
    if (!sender) return;

    const payload = { userId: sender.id, scope: data.scope };

    if (data.scope === "nearby") {
      const nearbyIds = deps.roomManager.getNearbyUsers(sender.roomId, sender.id);
      emitStopTypingToUsers(io, sender.roomId, Array.from(nearbyIds ?? []), payload, deps);
      return;
    }

    socket.to(sender.roomId).emit("chat:stopTyping", payload);
  });
};

const emitTypingToUsers = (io: IO, typing: TypingUser, deps: IDeps) => {
  const senderId = typing.userId;
  const nearbyIds = deps.roomManager.getNearbyUsers(typing.roomId, senderId);
  emitTypingPayloadToUsers(
    io,
    typing.roomId,
    Array.from(nearbyIds ?? []).filter((id) => id !== senderId),
    typing,
    deps
  );
};

const emitTypingPayloadToUsers = (
  io: IO,
  roomId: string,
  userIds: string[],
  typing: TypingUser,
  deps: IDeps
) => {
  const roomUsers = deps.roomManager.getRoomUsers(roomId);

  userIds.forEach((userId) => {
    const recipient = roomUsers.get(userId);
    if (recipient?.socketId) {
      io.to(recipient.socketId).emit("chat:startTyping", typing);
    }
  });
};

const emitStopTypingToUsers = (
  io: IO,
  roomId: string,
  userIds: string[],
  payload: { userId: string; scope?: "room" | "nearby" },
  deps: IDeps
) => {
  const roomUsers = deps.roomManager.getRoomUsers(roomId);

  userIds.forEach((userId) => {
    const recipient = roomUsers.get(userId);
    if (recipient?.socketId) {
      io.to(recipient.socketId).emit("chat:stopTyping", payload);
    }
  });
};
