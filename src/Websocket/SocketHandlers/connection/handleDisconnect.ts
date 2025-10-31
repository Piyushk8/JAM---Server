import { SocketType, User } from "../../../types/type";
import { IDeps, IO } from "../../SocketServer";

export const handleDisconnect = (io: IO, socket: SocketType, deps: IDeps) => {
  socket.on("disconnect", (): void => {
    const { roomManager } = deps;
    const user = roomManager.getUser(socket.data.userId);
    console.log("User disconnected:", socket.data.userId, user);
    if (!user) return;
    roomManager.setAwayUser(user.roomId, user.id);
    cleanupUserDisconnection(io, user, user.id, deps);
  });
};

export const cleanupUserDisconnection = (
  io: IO,
  user: User,
  userId: User["id"],
  { spatialGrid, roomManager }: IDeps
): void => {
  const roomId = user.roomId;

  roomManager.deleteUserFromRoom(user.id, roomId);
  spatialGrid.remove(roomId, user.id);

  io.to(roomId).emit("user-left", user.id);

  // Clean up empty room
  if (roomManager.getRoomUsers(roomId).size === 0) {
    roomManager.getRoomsMap().delete(roomId);
  }

  roomManager.deleteUser(user.id);
};
