import { getUserFromID } from "../../../Helpers/user";
import { JoinRoomResponse, SocketType, User } from "../../../types/type";
import { IDeps, IO } from "../../SocketServer";
import { tryReconnection } from "./tryReconnection";

export const handleReconnection = (io: IO, socket: SocketType, deps: IDeps) => {
  socket.on(
    "reconnect:room",
    async (
      data: { roomId: string },
      cb: (result: {
        success: boolean;
        data?: JoinRoomResponse;
        error?: string;
      }) => void
    ) => {
      try {
        const userId = socket.data.userId;
        if (!userId) throw new Error("User ID missing from socket data");

        const authUser = await getUserFromID(userId);
        if (!authUser) throw new Error("Authenticated user not found");

        const { id, username } = authUser;
        let User: User | null = null;
        const roomId = data.roomId;

        if (!roomId) {
          throw new Error("Room ID is required for reconnection");
        }

        User =
          tryReconnection(authUser.id, socket.id, deps.roomManager) || null;
        if (!User) {
          throw new Error("Failed to reconnect user");
        }

        cb({
          success: true,
          data: {
            user: {
              userId,
              userName: username,
              availability: User.availability,
              sprite: User.sprite,
            },
            room: { roomId },
          },
        });
      } catch (error: any) {
        console.error("Reconnection error:", error.message);
        cb({
          success: false,
          error:
            error.message || "An unknown error occurred during reconnection",
        });
      }
    }
  );
};
