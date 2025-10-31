import { SocketType, UserAvailabilityStatus } from "../../types/type";
import { IDeps, IO } from "../SocketServer";

export const handleUserAvailabilityChange = (
  io: IO,
  socket: SocketType,
  { roomManager }: IDeps
) => {
  socket.on("userStatusChange", (data: { status: UserAvailabilityStatus }) => {
    const user = roomManager.getUser(socket.data.userId);
    if (user) {
      user.availability = data.status;
    }
  });
};
