import { SocketType, User } from "../../types/type";
import { IDeps, IO } from "../SocketServer";
import { MOVE_LIMIT_MS } from "../utility/constants";
import { toPixels } from "../utility/utils";

export const handleUserMove = (io: IO, socket: SocketType, deps: IDeps) => {
  const { roomManager } = deps;
  socket.on("user-move", (data: { x: number; y: number }): void => {
    // Throttling logic moved to a separate method
    if (!shouldProcessMove(socket)) return;

    const user = roomManager.getUser(socket.data.userId);
    if (!user) return;

    updateUserMovement(user, data.x, data.y, deps);
  });
};

const shouldProcessMove = (socket: SocketType): boolean => {
  const now = Date.now();
  // Store lastMoveAt on socket object for per-client throttling
  const lastMoveAt = (socket as any).lastMoveAt || 0;

  if (now - lastMoveAt < MOVE_LIMIT_MS) return false;

  (socket as any).lastMoveAt = now;
  return true;
};

const updateUserMovement = (
  user: User,
  tileX: number,
  tileY: number,
  deps: IDeps
): void => {
  const { roomManager, spatialGrid } = deps;
  const pixelPosition = toPixels(tileX, tileY);
  user.x = pixelPosition.x;
  user.y = pixelPosition.y;

  const roomUsers = roomManager.getRoomUsers(user.roomId);
  if (roomUsers) {
    roomUsers.set(user.id, user);
  }

  spatialGrid.addOrMove(user.roomId, user);
};
