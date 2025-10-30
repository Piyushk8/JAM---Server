// /adapters/runtime/InMemoryRoomRepo.ts

/***
 * 
    This file handles only in memory room checks 
 *  */ 
import {
  RoomRepository,
  RoomRuntimeState,
} from "../../../domain/types/RepoTypes";
import { User } from "../../../domain/types/types";

export class InMemoryRoomRepo implements RoomRepository {
  private rooms = new Map<string, RoomRuntimeState>();

  getRoomsMap() {
    return this.rooms;
  }

  ensureRoom(roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        users: new Map(),
        proximity: new Map(),
      });
    }
  }

  addUserToRoom(roomId: string, user: User) {
    this.ensureRoom(roomId);
    this.rooms.get(roomId)!.users.set(user.id, user);
  }

  getRoomUsers(roomId: string) {
    this.ensureRoom(roomId);
    return this.rooms.get(roomId)!.users;
  }

  deleteUserFromRoom(userId: string, roomId: string) {
    this.rooms.get(roomId)?.users.delete(userId);
    this.rooms.get(roomId)?.proximity.delete(userId);
  }
}
