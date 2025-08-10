import { Application } from "express";
import http, { type Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import {
  AUDIO_FALLOFF_END,
  calculateAudioLevel,
  calculateDistance,
  getUsersInProximity,
  TILE_SIZE,
} from "../lib/util";
import {
  ChatMessage,
  ClientToServer,
  ProximityUser,
  Room,
  RoomSyncPayload,
  ServerToClient,
  User,
} from "../types/type";
import { diffSets, SpatialGrid } from "../lib/spatialGrid";
import { CELL_SIZE, TICK_RATE } from "../lib/contants";
import roomManager from "../RoomManager";
// const rooms = new Map<string, Room>();
// const users = new Map<string, User>();
const PROXIMITY_THRESHOLD = 150; // Distance for chat/video connection
const CHAT_RANGE = 200; // Distance for seeing chat messages

export type RoomRuntimeState = {
  id: string;
  users: Map<string, User>;
  // last proximity set per user
  proximity: Map<string, Set<string>>;
};

export default class webSocketService {
  public io: Server;
  public httpServer: HTTPServer;
  public app: Application;
  public spatial: SpatialGrid;
  private tickHandle?: ReturnType<typeof setTimeout>;

  constructor(app: Application) {
    this.app = app;
    this.httpServer = new http.Server(app);
    this.io = new Server<ClientToServer | ServerToClient>(this.httpServer, {
      cors: {
        origin: "http://localhost:5173",
        credentials: true,
      },
    });
    this.spatial = new SpatialGrid(CELL_SIZE);
    this.initializeEvents();
    this.startTick();
  }

  private startTick() {
    const interval = 1000 / TICK_RATE;
    this.tickHandle = setInterval(() => this.tick(), interval);
  }

  private stopTick() {
    if (this.tickHandle) clearInterval(this.tickHandle);
  }

  private tick() {
    for (const [roomId, room] of roomManager.getRoomsMap()) {
      const users = Array.from(room.users.values());
      for (const me of users) {
        const nearbyIds = this.spatial.getNearby(roomId, me);
        const nearbyUsers = nearbyIds
          .map((id) => room.users.get(id)!)
          .filter(Boolean);
        const inRange: User[] = [];
        for (const other of nearbyUsers) {
          const d = calculateDistance(me, other);
          if (d <= PROXIMITY_THRESHOLD) inRange.push(other);
        }
        const nextSet = new Set(inRange.map((u) => u.id));
        const prevSet =
          roomManager.getNearbyUsers(roomId, me.id) ?? new Set<string>();
        const { entered, left } = diffSets(prevSet, nextSet);
        roomManager.setNearbyUsers(roomId, me.id, nextSet);

        this.io.to(me.socketId).emit("room-sync", {
          ts: Date.now(),
          me: this.toTileCoords(me.x, me.y),
          players: nearbyUsers.map((u) => {
            const tileCoords = this.toTileCoords(u.x, u.y);
            return {
              id: u.id,
              x: tileCoords.x,
              y: tileCoords.y,
              username: u.username,
            };
          }),
          proximity: { entered, left },
          audio: inRange.map((u) => {
            const d = calculateDistance(me, u);
            return { id: u.id, level: calculateAudioLevel(d) };
          }),
        });
      }
    }
  }

  private toPixels(tileX: number, tileY: number) {
    return { x: tileX * TILE_SIZE, y: tileY * TILE_SIZE };
  }

  private toTileCoords(xPx: number, yPx: number) {
    return { x: Math.floor(xPx / TILE_SIZE), y: Math.floor(yPx / TILE_SIZE) };
  }

  /**
   * Centralized update that:
   * - stores user in RoomManager (global map + room map)
   * - converts tiles -> pixels
   * - updates SpatialGrid
   */
  private applyUserPositionFromTiles(user: User, tileX: number, tileY: number) {
    const { x, y } = this.toPixels(tileX, tileY);
    user.x = x;
    user.y = y;

    // Ensure in RoomManager
    roomManager.setUser(user.id, user);
    roomManager.ensureRoom(user.roomId);
    const roomUsers = roomManager.getRoomUsers(user.roomId);
    roomUsers.set(user.id, user);

    // Single, authoritative spatial update
    this.spatial.addOrMove(user.roomId, user);
  }

  private initializeEvents() {
    this.io.on(
      "connection",
      (socket: Socket<ClientToServer, ServerToClient>) => {
        console.log("User connected:", socket.id);

        // User joins a room
        socket.on(
          "join-room",
          async (data: { roomId: string; username: string }, callback) => {
            try {
              const { roomId, username } = data;
              console.log(
                "before join",
                roomManager.getRoomsMap(),
                roomManager.getUsersMap()
              );
              const userId = socket.id;
              console.log("jooining", userId, roomId);

              roomManager.ensureRoom(roomId);

              const pixelX = 22 * TILE_SIZE;
              const pixelY = 10 * TILE_SIZE;

              // 1. Add to user store
              const user: User = {
                id: userId,
                username,
                x: pixelX,
                y: pixelY,
                socketId: socket.id,
                roomId,
                isAudioEnabled: false,
                isVideoEnabled: false,
              };

              roomManager.addUserToRoom(roomId, user);
              roomManager.setNearbyUsers(roomId, userId, new Set());
              roomManager.setUser(userId, user);

              socket.join(roomId);

              this.spatial.addOrMove(roomId, user);

              // converting users pixel positions to tiled coordinates
              const roomUsers = Array.from(
                roomManager.getRoomUsers(roomId).values()
              ).map((user) => {
                const tileX = Math.floor(user.x / TILE_SIZE);
                const tileY = Math.floor(user.y / TILE_SIZE);

                return {
                  ...user,
                  x: tileX,
                  y: tileY,
                };
              });
              console.log("roomUsers", roomUsers);
              socket.emit("room-users", roomUsers);

              // making the pixels to tile coordinates again
              socket.to(roomId).emit("user-joined", { ...user, x: 22, y: 10 });
              console.log(
                "after",
                roomManager.getRoomsMap(),
                roomManager.getUsersMap()
              );

              callback({ success: true });
            } catch (error) {
              callback({ success: false });
            }
          }
        );
        // Handle user movement with audio level updates
        // no broadcasts onlu updates
        let lastMoveAt = 0;
        const MOVE_LIMIT_MS = 33; // ~30Hz from this client

        socket.on("user-move", (data: { x: number; y: number }) => {
          const now = Date.now();
          if (now - lastMoveAt < MOVE_LIMIT_MS) return; // throttle
          lastMoveAt = now;

          const userId = socket.id;
          const user = roomManager.getUser(userId);
          if (!user) return;

          const pixelPosition = this.toPixels(data.x, data.y);
          user.x = pixelPosition.x;
          user.y = pixelPosition.y;

          const room = roomManager.getRoomUsers(user.roomId)!;
          room.set(userId, user);

          // spatial grid update
          this.spatial.addOrMove(user.roomId, user);
        });

        // Handle WebRTC signaling

        //   // Handle media state changes
        socket.on(
          "media-state-changed",
          (data: { isAudioEnabled: boolean; isVideoEnabled: boolean }) => {
            const { isAudioEnabled, isVideoEnabled } = data;
            const userId = socket.id;

            const user = roomManager.getUser(userId);
            if (!user) return;

            user.isAudioEnabled = isAudioEnabled;
            user.isVideoEnabled = isVideoEnabled;

            socket.to(user.roomId).emit("user-media-state-changed", {
              userId,
              isAudioEnabled,
              isVideoEnabled,
            });
          }
        );

        // Chat functionality (keeping existing code)
        //   socket.on("send-message", (data: { message: string; type?: string }) => {
        //     const { message, type = "text" } = data;
        //     const userId = socket.id;

        //     if (users.has(userId)) {
        //       const user = users.get(userId)!;
        //       const room = rooms.get(user.roomId)!;
        //       const roomUsers = Array.from(room.users.values());

        //       const chatMessage: ChatMessage = {
        //         id: Date.now().toString(),
        //         userId,
        //         username: user.username,
        //         message,
        //         type: type as "text" | "emoji",
        //         timestamp: new Date().toISOString(),
        //         x: user.x,
        //         y: user.y,
        //       };

        //       // Send message to users within chat range
        //       roomUsers.forEach((roomUser) => {
        //         if (roomUser.id !== userId) {
        //           const distance = calculateDistance(user, roomUser);
        //           if (distance <= CHAT_RANGE) {
        //             this.io.to(roomUser.socketId).emit("message-received", {
        //               ...chatMessage,
        //               distance,
        //             });
        //           }
        //         }
        //       });

        //       // Send back to sender
        //       socket.emit("message-sent", chatMessage);
        //     }
        //   });

        //   // Typing indicators
        //   socket.on("typing-start", () => {
        //     const userId = socket.id;
        //     if (users.has(userId)) {
        //       const user = users.get(userId)!;
        //       const room = rooms.get(user.roomId)!;
        //       const roomUsers = Array.from(room.users.values());

        //       roomUsers.forEach((roomUser) => {
        //         if (roomUser.id !== userId) {
        //           const distance = calculateDistance(user, roomUser);
        //           if (distance <= CHAT_RANGE) {
        //             this.io.to(roomUser.socketId).emit("user-typing", {
        //               userId,
        //               username: user.username,
        //               isTyping: true,
        //             });
        //           }
        //         }
        //       });
        //     }
        //   });

        //   socket.on("typing-stop", () => {
        //     const userId = socket.id;
        //     if (users.has(userId)) {
        //       const user = users.get(userId)!;
        //       const room = rooms.get(user.roomId)!;
        //       const roomUsers = Array.from(room.users.values());

        //       roomUsers.forEach((roomUser) => {
        //         if (roomUser.id !== userId) {
        //           const distance = calculateDistance(user, roomUser);
        //           if (distance <= CHAT_RANGE) {
        //             this.io.to(roomUser.socketId).emit("user-typing", {
        //               userId,
        //               username: user.username,
        //               isTyping: false,
        //             });
        //           }
        //         }
        //       });
        //     }
        //   });

        //@ts-ignore
        socket.on("test", (data) => {
          console.log("data", data);
        });
        // Handle disconnect
        socket.on("disconnect", () => {
          const user = roomManager.getUser(socket.id);
          console.log("doconnected", socket.id, user);
          if (!user) return;

          const roomId = user.roomId;
          roomManager.deleteUserFromRoom(socket.id, roomId);
          this.spatial.remove(roomId, user.id);

          socket.to(roomId).emit("user-left", user.id);

          if (roomManager.getRoomUsers(roomId).size === 0) {
            roomManager.getRoomsMap().delete(roomId);
          }
          roomManager.deleteUser(socket.id);
        });
      }
    );
  }

  public listen(port: number) {
    this.httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }
}
