import { randomUUID } from "crypto";
import { Conversation } from "../../../ConversationRooms";
import { notificationService } from "../../../notifications/notificationService";
import { SocketType } from "../../../types/type";
import { IDeps, IO } from "../../SocketServer";

export const handleCallInvite = (
  io: IO,
  socket: SocketType,
  { roomManager, conversationsManager }: IDeps
) => {
  socket.on(
    "call:invite",
    (
      data: { conversationId?: string; targetUserId: string },
      callback: (res: { success: boolean; conversation: Conversation }) => void
    ) => {
      try {
        const { conversationId, targetUserId } = data;

        if (!targetUserId) {
          console.warn("[call:Invite] targetUserId missing");
          return;
        }
        const targetUserSocketId = roomManager.getUser(targetUserId)?.socketId;
        if (conversationId && targetUserSocketId) {
          const existingConversation =
            conversationsManager.getConversation(conversationId);

          if (existingConversation) {
            io.to(targetUserSocketId).emit("incoming-invite", {
              conversationId: existingConversation.conversationId,
              from: socket.data.userId,
              members: existingConversation.members,
            });
            void notificationService
              .create({
                recipientId: targetUserId,
                roomId: roomManager.getUser(socket.data.userId)?.roomId ?? null,
                actorId: socket.data.userId,
                actorName: socket.data.username,
                type: "call.invite",
                title: `${socket.data.username} invited you to a call`,
                body: "Open the invite to join the conversation.",
                actionSection: "chat",
                entityType: "conversation",
                entityId: existingConversation.conversationId,
                metadata: { members: existingConversation.members },
              })
              .catch((error) =>
                socket.data.log?.error(
                  { err: error },
                  "failed to create call invite notification"
                )
              );

            return;
          }
        }

        const newConversationId = randomUUID();
        const creator = socket.data.userId;
        const createdAt = Date.now();
        if (!targetUserSocketId) return;
        // tell target user
        io.to(targetUserSocketId).emit("incoming-invite", {
          conversationId: newConversationId,
          from: creator,
          members: [creator],
        });
        void notificationService
          .create({
            recipientId: targetUserId,
            roomId: roomManager.getUser(socket.data.userId)?.roomId ?? null,
            actorId: creator,
            actorName: socket.data.username,
            type: "call.invite",
            title: `${socket.data.username} invited you to a call`,
            body: "Open the invite to join the conversation.",
            actionSection: "chat",
            entityType: "conversation",
            entityId: newConversationId,
            metadata: { members: [creator] },
          })
          .catch((error) =>
            socket.data.log?.error(
              { err: error },
              "failed to create call invite notification"
            )
          );

        // join the socket to the new "room"
        socket.join(newConversationId);

        // add to conversation manager
        const conversation = conversationsManager.createConversation({
          conversationId: newConversationId,
          members: [creator],
          pending: [targetUserId],
          roomId: "", // if you have actual roomId, set it
          creator,
          createdAt,
          status: "pending",
        });

        console.log(
          "[call:Invite] new conversation created",
          conversationsManager.getConversation(newConversationId)
        );
        if (!conversation) throw new Error("error creating conversation");
        callback({ success: true, conversation });
      } catch (error) {
        console.error("[call:Invite] error:", error);
      }
    }
  );
};
