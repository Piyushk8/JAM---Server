import { Conversation } from "../../../ConversationRooms";
import { SocketType } from "../../../types/type";
import { IDeps, IO } from "../../SocketServer";

export const handleAcceptCall = (
  io: IO,
  socket: SocketType,
  { conversationsManager, roomManager }: IDeps
) => {
  socket.on(
    "call:accept",
    (
      data: { conversationId: string; targetUserId: string; from: string },
      cb: (res: {
        isConversationActive: boolean;
        conversation: Conversation | null;
      }) => void
    ) => {
      try {
        const { conversationId, targetUserId, from } = data;

        const conversation =
          conversationsManager.getConversation(conversationId);
        if (!conversation?.pending) return;
        // user that accepted the call
        const targetUserSocketId = roomManager.getUser(targetUserId)?.socketId;
        switch (conversation.status) {
          // call is yet to be started
          case "pending":
            conversation.members.push(targetUserId);
            conversation.pending = conversation.pending.filter(
              (u) => u !== targetUserId
            );
            const userThatInvitedSocketId = roomManager.getUser(from)?.socketId;
            socket.join(conversationId);
            if (!userThatInvitedSocketId)
              throw new Error("[call:accept]:no user socketId");
            conversation.status = "ongoing";
            io.to(userThatInvitedSocketId).emit("call-accepted-response", {
              targetUserId,
              conversationId,
              conversation,
            });

            cb({
              conversation,
              isConversationActive: conversation.status == "ongoing",
            });

          // joining an on going call
          case "ongoing":
            // Add the accepting user to members
            conversation.members.push(targetUserId);

            // Remove them from pending list
            conversation.pending = conversation.pending.filter(
              (u) => u !== targetUserId
            );

            socket.join(conversationId);
            // Notify everyone in conversation that it’s updated
            io.to(conversationId).emit("conversation-updated", {
              conversationId,
              joined: targetUserId,
              left: "",
            });
          case "ended":
        }
      } catch (error) {
        console.log("[call:accept]", error);
        cb({ conversation: null, isConversationActive: false });
      }
    }
  );
};
