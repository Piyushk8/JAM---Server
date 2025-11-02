import { TICK_RATE } from "../../../lib/contants";
import { diffSets } from "../../../lib/spatialGrid";
import { calculateAudioLevel, calculateDistance } from "../../../lib/util";
import { AwayUsers, User } from "../../../types/type";
import { IDeps, IO, RoomRuntimeState } from "../../SocketServer";
import { GRACE_PERIOD, PROXIMITY_THRESHOLD } from "../../utility/constants";
import {
  mapUserToTileCoords,
  toPixels,
  toTileCoords,
} from "../../utility/utils";
import { cleanupUserDisconnection } from "../connection/handleDisconnect";

export const startTick = (
  io: IO,
  tickHandle: NodeJS.Timeout | null,
  deps: IDeps
): void => {
  const interval = 1000 / TICK_RATE;
  tickHandle = setInterval(() => tick(io, deps), interval);
};

export const stopTick = (tickHandle: NodeJS.Timeout | null): void => {
  if (tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
};

const tick = (io: IO, deps: IDeps): void => {
  const rooms = deps.roomManager.getRoomsMap();

  for (const [roomId, room] of rooms) {
    processRoomTick(io, roomId, room, deps);
  }

  const awayUsers = deps.roomManager.getAwayUsers();
  if (awayUsers) {
    processAwayUsers(io, awayUsers, deps);
  }
};

const emitRoomSync = (
  io: IO,
  user: User,
  nearbyUsers: User[],
  data: any
): void => {
  const { proximityChanges, audioLevels } = data;
  io.to(user.socketId).emit("room-sync", {
    ts: Date.now(),
    me: toTileCoords(user.x, user.y),
    players: nearbyUsers.map(mapUserToTileCoords.bind(this)),
    proximity: proximityChanges,
    audio: audioLevels,
  });
};

// ----------  PROCESSING HELPERS ---------
const processAwayUsers = (
  io: IO,
  awayUsers: Map<string, AwayUsers>,
  deps: IDeps
) => {
  if (!awayUsers) return;
  const { roomManager } = deps;

  awayUsers.forEach((userInfo, userId) => {
    if (Date.now() - userInfo.awaySince > GRACE_PERIOD) {
      const user = roomManager.getUser(userId);
      console.log("processing tick user -",user)
      if (user) {
        cleanupUserDisconnection(io, user, user.id, deps);
      }
      roomManager.awayUserDisconncted(userId);
    }
  });
};
const processRoomTick = (
  io: IO,
  roomId: string,
  room: RoomRuntimeState,
  deps: IDeps
): void => {
  const users = Array.from(room.users.values());

  for (const user of users) {
    processUserTick(io, roomId, user, deps);
  }
};

const processUserTick = (
  io: IO,
  roomId: string,
  user: User,
  deps: IDeps
): void => {
  const nearbyUsers = getNearbyUsersInRange(roomId, user, deps);
  const { roomManager } = deps;
  const players:User[] = Array.from(roomManager.getRoomUsers(roomId).values()); 
  const proximityData = calculateProximityChanges(
    roomId,
    user,
    nearbyUsers,
    deps
  );

  emitRoomSync(io, user, players, proximityData);
};

const getNearbyUsersInRange = (
  roomId: string,
  user: User,
  { roomManager, spatialGrid }: IDeps
): User[] => {
  const nearbyIds = spatialGrid.getNearby(roomId, user);
  const room = roomManager.getRoomUsers(roomId);

  return nearbyIds
    .map((id) => room?.get(id))
    .filter((other): other is User => {
      if (!other) return false;
      const distance = calculateDistance(user, other);
      return distance <= PROXIMITY_THRESHOLD;
    });
};

const calculateProximityChanges = (
  roomId: string,
  user: User,
  nearbyUsers: User[],
  { roomManager, spatialGrid }: IDeps
) => {
  const nextSet = new Set(nearbyUsers.map((u) => u.id));
  const prevSet =
    roomManager.getNearbyUsers(roomId, user.id) ?? new Set<string>();
  const proximityChanges = diffSets(prevSet, nextSet);

  roomManager.setNearbyUsers(roomId, user.id, nextSet);

  return {
    nearbyUsers,
    proximityChanges,
    audioLevels: calculateAudioLevels(user, nearbyUsers),
  };
};

const calculateAudioLevels = (user: User, nearbyUsers: User[]) => {
  return nearbyUsers.map((other) => {
    const distance = calculateDistance(user, other);
    return {
      id: other.id,
      level: calculateAudioLevel(distance),
    };
  });
};

export const updateUserPosition = (
  user: User,
  tileX: number,
  tileY: number,
  deps: IDeps
): void => {
  const { x, y } = toPixels(tileX, tileY);
  user.x = x;
  user.y = y;
  const { spatialGrid } = deps;
  // Ensure user exists in all necessary data structures
  ensureUserInDataStructures(user, deps);

  // Update spatial grid
  spatialGrid.addOrMove(user.roomId, user);
};

const ensureUserInDataStructures = (
  user: User,
  { roomManager }: IDeps
): void => {
  roomManager.setUser(user.id, user);
  roomManager.ensureRoom(user.roomId);
  const roomUsers = roomManager.getRoomUsers(user.roomId);
  roomUsers.set(user.id, user);
};
