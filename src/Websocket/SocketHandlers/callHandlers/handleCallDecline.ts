import { SocketType } from "../../../types/type";
import { IDeps, IO } from "../../SocketServer";

export const handleDeclineCall = (
  io: IO,
  socket: SocketType,
  { conversationsManager, roomManager }: IDeps
) => {
  socket.on(
    "call:decline",
    (data: {
      conversationId: string;
      userDeclined: string;
      userThatInvited: string;
    }) => {
      try {
        const { conversationId, userDeclined, userThatInvited } = data;
        const conversation =
          conversationsManager.getConversation(conversationId);
        if (!conversation?.pending) return;

        let left = [];
        // Add the accepting user to members
        // left = [userDeclined];

        // Remove them from pending list
        conversation.pending = conversation.pending.filter(
          (u) => u !== userDeclined
        );

        const userThatInvitedSocketId =
          roomManager.getUser(userThatInvited)?.socketId;
        if (!userThatInvitedSocketId)
          throw new Error("[call:decline]- no userThatInvitedSocketId");
        // Notify everyone in conversation that it’s updated
        io.to(userThatInvitedSocketId).emit("call-declined", {
          conversationId,
          // from: userDeclined,.
          userDeclined: userDeclined,
        });
      } catch (error) {
        console.log(error);
      }
    }
  );
};
