import { User } from "../types/type";
import { RoomRuntimeState } from "../Websocke/ws";

class RoomManager {
  private rooms: Map<string, RoomRuntimeState>;
  private users: Map<string, User>;
  private static instance: RoomManager;

  private constructor() {
    this.rooms = new Map();
    this.users = new Map();
  }

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  // Global User Management 

  public getUsersMap(): Map<string, User> {
    return this.users;
  }

  public getUser(userId: string): User | null {
    return this.users.get(userId) ?? null;
  }

  public setUser(userId: string, user: User): void {
    this.users.set(userId, user);
  }

  public deleteUser(userId: string): void {
    this.users.delete(userId);
  }

  // ---------- Room Management ----------

  public getRoomsMap(): Map<string, RoomRuntimeState> {
    return this.rooms;
  }

  public ensureRoom(roomId: string): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        users: new Map(),
        proximity: new Map(),
      });
    }
  }

  public addUserToRoom(roomId: string, user: User): void {
    console.log("adding user to room",roomId, user)
    this.ensureRoom(roomId);
    this.rooms.get(roomId)!.users.set(user.id, user);
}

public getUserFromRoom(roomId: string, userId: string): User | undefined {
    return this.rooms.get(roomId)?.users.get(userId);
}

public getRoomUsers(roomId: string): Map<string, User> {
    this.ensureRoom(roomId);
    return this.rooms.get(roomId)!.users;
}

public deleteUserFromRoom(userId: string, roomId: string): void {
    this.rooms.get(roomId)?.users.delete(userId);
    this.rooms.get(roomId)?.proximity.delete(userId);
}

// ---------- Proximity Management ----------

public setProximityMap(
    roomId: string,
    proximityMap: Map<string, Set<string>>
): void {
    this.ensureRoom(roomId);
    this.rooms.get(roomId)!.proximity = proximityMap;
}

  public getProximityMap(roomId: string): Map<string, Set<string>> | undefined {
    return this.rooms.get(roomId)?.proximity;
  }

  public getNearbyUsers(roomId: string, userId: string): Set<string> | undefined {
    return this.rooms.get(roomId)?.proximity.get(userId);
  }

  public setNearbyUsers(
    roomId: string,
    userId: string,
    nearbySet: Set<string>
  ): void {
    this.ensureRoom(roomId);
    this.rooms.get(roomId)!.proximity.set(userId, nearbySet);
  }
}

// Singleton export
const roomManager = RoomManager.getInstance();
export default roomManager;
