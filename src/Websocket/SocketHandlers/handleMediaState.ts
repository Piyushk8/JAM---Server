import { SocketType } from "../../types/type";
import { IDeps, IO } from "../SocketServer";

export const handleMediaStateChange = (
  io: IO,
  socket: SocketType,
  { roomManager }: IDeps
) => {
  socket.on(
    "media-state-changed",
    (data: { isAudioEnabled: boolean; isVideoEnabled: boolean }): void => {
      const { isAudioEnabled, isVideoEnabled } = data;
      const user = roomManager.getUser(socket.id);
      console.log("media state", user);
      if (!user) return;

      user.isAudioEnabled = isAudioEnabled;
      user.isVideoEnabled = isVideoEnabled;

      socket.to(user.roomId).emit("user-media-state-changed", {
        userId: socket.id,
        isAudioEnabled,
        isVideoEnabled,
      });
    }
  );
};
