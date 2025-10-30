import { AwayUsers, RoomRuntimeState } from "./room";
import { User } from "./types";

export interface RoomRepository {
  getRoomsMap(): Map<string, RoomRuntimeState>;
  ensureRoom(roomId: string): void;
  addUserToRoom(roomId: string, user: User): void;
  getRoomUsers(roomId: string): Map<string, User>;
  deleteUserFromRoom(userId: string, roomId: string): void;
}

export interface UserRepository {
  getUser(userId: string): User | null;
  setUser(userId: string, user: User): void;
  deleteUser(userId: string): void;
}

export interface ProximityRepository {
  setProximityMap(roomId: string, map: Map<string, Set<string>>): void;
  getNearbyUsers(roomId: string, userId: string): Set<string> | undefined;
}

export interface AwayUserRepository {
  setAwayUser(roomId: string, userId: string): void;
  removeAwayUser(userId: string): void;
  getAwayUser(userId: string): AwayUsers | undefined;
}
