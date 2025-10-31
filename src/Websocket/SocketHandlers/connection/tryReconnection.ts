import { IDeps } from "../../SocketServer";

export const tryReconnection = (
  userId: string,
  socketId: string,
  roomManager: IDeps["roomManager"]
) => {
  const user = roomManager.getUser(userId);
  if (!user) return false; // no previous user state

  const awayInfo = roomManager.getAwayUser(userId);
  if (!awayInfo) return false; // user wasn’t marked away

  // Re-associate user with new socket
  user.socketId = socketId;
  user.availability = "idle";
  roomManager.removeAwayUser(userId);
  return user;
};
