import { SpatialGrid } from "../../lib/spatialGrid";
import { TILE_SIZE } from "../../lib/util";
import { SocketType, SpriteNames, User } from "../../types/type";
import { IDeps } from "../SocketServer";
import { DEFAULT_SPAWN_TILE } from "./constants";

export const createUser = (
  userId: string,
  username: string,
  roomId: string,
  socketId: string,
  sprite: SpriteNames
): User => {
  const spawnPosition = toPixels(DEFAULT_SPAWN_TILE.x, DEFAULT_SPAWN_TILE.y);
  return {
    id: userId,
    availability: "idle",
    sprite: sprite,
    username,
    x: spawnPosition.x,
    y: spawnPosition.y,
    socketId,
    roomId,
    isAudioEnabled: false,
    isVideoEnabled: false,
  };
};

export const addUserToRoom = (
  socket: SocketType,
  roomId: string,
  user: User,
  { roomManager, spatialGrid }: IDeps
): void => {
  roomManager.ensureRoom(roomId);
  roomManager.addUserToRoom(roomId, user);
  roomManager.setNearbyUsers(roomId, user.id, new Set());
  roomManager.setUser(user.id, user);

  socket.join(roomId);
  spatialGrid.addOrMove(roomId, user);
};

export const mapUserToTileCoords = (user: User): User => {
  const tileCoords = toTileCoords(user.x, user.y);
  return {
    socketId: user.socketId,
    sprite: user.sprite,
    roomId: user.roomId,
    id: user.id,
    x: tileCoords.x,
    y: tileCoords.y,
    availability: user.availability,
    username: user.username,
  };
};
// export const mapUserToTileCoords = (user: User): Partial<User> => {
//   const tileCoords = toTileCoords(user.x, user.y);
//   return {
//     id: user.id,
//     x: tileCoords.x,
//     y: tileCoords.y,
//     availability: user.availability,
//     username: user.username,
//   };
// };

export const toPixels = (
  tileX: number,
  tileY: number
): { x: number; y: number } => {
  return {
    x: tileX * TILE_SIZE,
    y: tileY * TILE_SIZE,
  };
};

export const toTileCoords = (
  xPx: number,
  yPx: number
): { x: number; y: number } => {
  return {
    x: Math.floor(xPx / TILE_SIZE),
    y: Math.floor(yPx / TILE_SIZE),
  };
};

export const getRoomUsersInTileCoords = (
  roomId: string,
  roomManager: IDeps["roomManager"],
) => {
  return (Array.from(roomManager.getRoomUsers(roomId).values()) as User[]).map(
    (user) => ({
      ...user,
      ...toTileCoords(user.x, user.y),
    })
  );
};
