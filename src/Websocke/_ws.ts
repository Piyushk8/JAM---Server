// import { Application } from "express";
// import http, { type Server as HTTPServer } from "http";
// import { Server, Socket } from "socket.io";
// import {
//   AUDIO_FALLOFF_END,
//   calculateAudioLevel,
//   calculateDistance,
//   getUsersInProximity,
// } from "../lib/util";
// import {
//   ChatMessage,
//   ClientToServer,
//   ProximityUser,
//   Room,
//   RoomSyncPayload,
//   ServerToClient,
//   User,
// } from "../types/type";
// import { diffSets, SpatialGrid } from "../lib/spatialGrid";
// import { CELL_SIZE, TICK_RATE } from "../lib/contants";
// // const rooms = new Map<string, Room>();
// // const users = new Map<string, User>();
// const PROXIMITY_THRESHOLD = 150; // Distance for chat/video connection
// const CHAT_RANGE = 200; // Distance for seeing chat messages

// export type RoomRuntimeState = {
//   id: string;
//   users: Map<string, User>;
//   // last proximity set per user
//   proximity: Map<string, Set<string>>;
// };

// export default class webSocketService {
//   public io: Server;
//   public httpServer: HTTPServer;
//   public app: Application;
//   private rooms: Map<string, RoomRuntimeState>;
//   private users: Map<string, User>;
//   public spatial: SpatialGrid;
//   private tickHandle?: ReturnType<typeof setTimeout>;

//   constructor(app: Application) {
//     this.app = app;
//     this.rooms = new Map();
//     this.users = new Map();
//     this.httpServer = new http.Server(app);
//     this.io = new Server<ClientToServer | ServerToClient>(this.httpServer, {
//       cors: {
//         origin: "http://localhost:5173",
//         credentials: true,
//       },
//     });
//     this.spatial = new SpatialGrid(CELL_SIZE);
//     this.initializeEvents();
//     this.startTick();
//   }

//   private startTick() {
//     const interval = 1000 / TICK_RATE;
//     this.tickHandle = setInterval(() => this.tick(), interval);
//   }
  
//   private stopTick() {
//     if (this.tickHandle) clearInterval(this.tickHandle);
//   }

//   private tick() {
//     console.log("tickstrat")
//     for (const [roomId, room] of this.rooms) {
//       console.log("tick for room room")
//       const users = Array.from(room.users.values());

//       // Build & send batched positions per user (filtered to proximity)
//       // Also compute proximity graph & send enter/leave diffs.
//       for (const me of users) {
//         // The spatial grid gives nearby candidates cheaply; we still
//         // filter by actual distance for correctness.
//         console.log("tick send",me)
//         const nearbyIds = this.spatial.getNearby(roomId, me);
//         const nearbyUsers = nearbyIds
//           .map((id) => room.users.get(id)!)
//           .filter(Boolean);

//         const inRange: User[] = [];
//         for (const other of nearbyUsers) {
//           const d = calculateDistance(me, other);
//           if (d <= PROXIMITY_THRESHOLD) inRange.push(other);
//         }

//         const nextSet = new Set(inRange.map((u) => u.id));
//         const prevSet = room.proximity.get(me.id) ?? new Set<string>();
//         const { entered, left } = diffSets(prevSet, nextSet);

//         // Save
//         room.proximity.set(me.id, nextSet);

//         // Send one batched message with both positions + diff
//         this.io.to(me.socketId).emit("room-sync", {
//           ts: Date.now(),
//           me: { x: me.x, y: me.y },
//           players: nearbyUsers.map((u) => ({
//             id: u.id,
//             x: u.x,
//             y: u.y,
//             username: u.username,
//           })),
//           proximity: {
//             entered,
//             left,
//           },
//           audio: inRange.map((u) => {
//             const d = calculateDistance(me, u);
//             return {
//               id: u.id,
//               level: calculateAudioLevel(d),
//             };
//           }),
//         });
//       }
//     }
//   }

//   private ensureRoom(roomId: string) {
//     if (!this.rooms.has(roomId)) {
//       this.rooms.set(roomId, {
//         id: roomId,
//         users: new Map<string, User>(),
//         proximity: new Map<string, Set<string>>(),
//       });
//     }
//   }

//   private initializeEvents() {
//     this.io.on(
//       "connection",
//       (socket: Socket<ClientToServer, ServerToClient>) => {
//         console.log("User connected:", socket.id);

//         // User joins a room
//         socket.on(
//           "join-room",
//           (data: { roomId: string; username: string }, callback) => {
//             console.log(data, callback);
//             try {
//               const { roomId, username } = data;
//               const userId = socket.id;
//               console.log("jooining", userId, roomId);

//               this.ensureRoom(roomId);
//               const room = this.rooms.get(roomId)!;

//               const user: User = {
//                 id: userId,
//                 username,
//                 x: Math.random() * 800,
//                 y: Math.random() * 600,
//                 socketId: socket.id,
//                 roomId,
//                 isAudioEnabled: false,
//                 isVideoEnabled: false,
//               };

//               room.users.set(userId, user);
//               room.proximity.set(userId, new Set());
//               this.users.set(userId, user);

//               socket.join(roomId);

//               // spatial grid
//               this.spatial.addOrMove(roomId, user);

//               // initial snapshot (no need to blast everyone)
//               const roomUsers = Array.from(room.users.values());
//               socket.emit("room-users", roomUsers);

//               // notify others
//               socket.to(roomId).emit("user-joined", user);

//               callback({
//                 success: true,
//               });
//             } catch (error) {
//               callback({
//                 success: false,
//               });
//             }
//           }
//         );
//         // Handle user movement with audio level updates
//         // no broadcasts onlu updates
//         let lastMoveAt = 0;
//         const MOVE_LIMIT_MS = 33; // ~30Hz from this client

//         socket.on("user-move", (data: { x: number; y: number }) => {
//           const now = Date.now();
//           if (now - lastMoveAt < MOVE_LIMIT_MS) return; // throttle
//           lastMoveAt = now;

//           const userId = socket.id;
//           const user = this.users.get(userId);
//           if (!user) return;

//           user.x = data.x;
//           user.y = data.y;

//           const room = this.rooms.get(user.roomId)!;
//           room.users.set(userId, user);

//           // spatial grid update
//           this.spatial.addOrMove(user.roomId, user);
//         });

//         // Handle WebRTC signaling

//         //   // Handle media state changes
//         socket.on(
//           "media-state-changed",
//           (data: { isAudioEnabled: boolean; isVideoEnabled: boolean }) => {
//             console.log("here");
//             const { isAudioEnabled, isVideoEnabled } = data;
//             const userId = socket.id;

//             if (this.users.has(userId)) {
//               const user = this.users.get(userId)!;
//               const room = this.rooms.get(user.roomId)!;

//               user.isAudioEnabled = isAudioEnabled;
//               user.isVideoEnabled = isVideoEnabled;

//               this.users.set(userId, user);
//               room.users.set(userId, user);
//                 console.log("emitted media change",userId, user.roomId)
//               // Notify others in room
//               socket.to(user.roomId).emit("user-media-state-changed", {
//                 userId,
//                 isAudioEnabled,
//                 isVideoEnabled,
//               });
//             }
//           }
//         );

//         // Chat functionality (keeping existing code)
//         //   socket.on("send-message", (data: { message: string; type?: string }) => {
//         //     const { message, type = "text" } = data;
//         //     const userId = socket.id;

//         //     if (users.has(userId)) {
//         //       const user = users.get(userId)!;
//         //       const room = rooms.get(user.roomId)!;
//         //       const roomUsers = Array.from(room.users.values());

//         //       const chatMessage: ChatMessage = {
//         //         id: Date.now().toString(),
//         //         userId,
//         //         username: user.username,
//         //         message,
//         //         type: type as "text" | "emoji",
//         //         timestamp: new Date().toISOString(),
//         //         x: user.x,
//         //         y: user.y,
//         //       };

//         //       // Send message to users within chat range
//         //       roomUsers.forEach((roomUser) => {
//         //         if (roomUser.id !== userId) {
//         //           const distance = calculateDistance(user, roomUser);
//         //           if (distance <= CHAT_RANGE) {
//         //             this.io.to(roomUser.socketId).emit("message-received", {
//         //               ...chatMessage,
//         //               distance,
//         //             });
//         //           }
//         //         }
//         //       });

//         //       // Send back to sender
//         //       socket.emit("message-sent", chatMessage);
//         //     }
//         //   });

//         //   // Typing indicators
//         //   socket.on("typing-start", () => {
//         //     const userId = socket.id;
//         //     if (users.has(userId)) {
//         //       const user = users.get(userId)!;
//         //       const room = rooms.get(user.roomId)!;
//         //       const roomUsers = Array.from(room.users.values());

//         //       roomUsers.forEach((roomUser) => {
//         //         if (roomUser.id !== userId) {
//         //           const distance = calculateDistance(user, roomUser);
//         //           if (distance <= CHAT_RANGE) {
//         //             this.io.to(roomUser.socketId).emit("user-typing", {
//         //               userId,
//         //               username: user.username,
//         //               isTyping: true,
//         //             });
//         //           }
//         //         }
//         //       });
//         //     }
//         //   });

//         //   socket.on("typing-stop", () => {
//         //     const userId = socket.id;
//         //     if (users.has(userId)) {
//         //       const user = users.get(userId)!;
//         //       const room = rooms.get(user.roomId)!;
//         //       const roomUsers = Array.from(room.users.values());

//         //       roomUsers.forEach((roomUser) => {
//         //         if (roomUser.id !== userId) {
//         //           const distance = calculateDistance(user, roomUser);
//         //           if (distance <= CHAT_RANGE) {
//         //             this.io.to(roomUser.socketId).emit("user-typing", {
//         //               userId,
//         //               username: user.username,
//         //               isTyping: false,
//         //             });
//         //           }
//         //         }
//         //       });
//         //     }
//         //   });

//         // Handle disconnect
//         socket.on("disconnect", () => {
//           const user = this.users.get(socket.id);
//           if (!user) return;

//           const room = this.rooms.get(user.roomId);
//           if (room) {
//             room.users.delete(user.id);
//             room.proximity.delete(user.id);
//             this.spatial.remove(user.roomId, user.id);

//             socket.to(user.roomId).emit("user-left", user.id);

//             // cleanup room if empty
//             if (room.users.size === 0) this.rooms.delete(user.roomId);
//           }
//           this.users.delete(user.id);
//         });
//       }
//     );
//   }

//   public listen(port: number) {
//     this.httpServer.listen(port, () => {
//       console.log(`Server running on port ${port}`);
//     });
//   }
// }
