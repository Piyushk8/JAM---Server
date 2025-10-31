// import { Application } from "express";
// import http, { type Server as HTTPServer } from "http";
// import { Server, Socket } from "socket.io";
// import {
//   AUDIO_FALLOFF_END,
//   calculateAudioLevel,
//   calculateDistance,
//   distance,
//   getUsersInProximity,
//   TILE_SIZE,
// } from "../lib/util";
// import {
//   ChatMessage,
//   ClientToServer,
//   JoinRoomResponse,
//   ProximityUser,
//   Room,
//   RoomSyncPayload,
//   ServerToClient,
//   SpriteNames,
//   User,
//   UserAvailabilityStatus,
// } from "../types/type";
// import cookie from "cookie";
// import { diffSets, SpatialGrid } from "../lib/spatialGrid";
// import { CELL_SIZE, FRONTEND_URL, TICK_RATE } from "../lib/contants";
// import roomManager, { AwayUsers } from "../RoomManager";
// import { Conversation, conversationsManager } from "../ConversationRooms";
// import { randomUUID } from "crypto";
// import {
//   checkRoomExists,
//   createRoom,
//   getUserFromID,
//   joinRoom,
// } from "../Helpers/user";
// import jwt from "jsonwebtoken";
// import { parseCookiesWithQs } from "./auth/cookieParser";
// // const PROXIMITY_THRESHOLD = 150;
// // const CHAT_RANGE = 200;
// // const MOVE_LIMIT_MS = 33; // ~30Hz throttling
// // const DEFAULT_SPAWN_TILE = { x: 22, y: 10 };
// // const GRACE_PERIOD = 5 * 60 * 1000;
// export type RoomRuntimeState = {
//   id: string;
//   users: Map<string, User>;
//   proximity: Map<string, Set<string>>;
// };

// export default class WebSocketService {
//   // public readonly io: Server;
//   // public readonly httpServer: HTTPServer;
//   // public readonly app: Application;
//   // private readonly spatial: SpatialGrid;
//   // private tickHandle?: NodeJS.Timeout;

//   constructor(app: Application) {
//     // this.app = app;
//     // this.httpServer = this.createHttpServer(app);
//     // this.io = this.createSocketServer();
//     // this.spatial = new SpatialGrid(CELL_SIZE);

//     // this.initializeEvents();
//     this.startTick();

//     // this.io.use((socket: Socket, next) => {
//     //   try {
//     //     const rawCookie = socket.handshake.headers.cookie;

//     //     if (!rawCookie) return next(new Error("No cookies found"));

//     //     const parsed = parseCookiesWithQs(rawCookie);

//     //     const { token } = parsed;
//     //     if (!token) throw new Error("No token in cookies");

//     //     const { userId, username } = jwt.verify(
//     //       token,
//     //       process.env.JWT_SECRET!
//     //     ) as { userId: string; username: string };
//     //     socket.data.userId = userId;
//     //     socket.data.username = username;
//     //     next();
//     //   } catch (err) {
//     //     console.error("Auth error:", err);
//     //     next(new Error("Authentication error"));
//     //   }
//     // });
//   }

//   // private createHttpServer(app: Application): HTTPServer {
//   //   return new http.Server(app);
//   // }

//   // private createSocketServer(): Server {
//   //   if (!FRONTEND_URL) {
//   //     console.warn("⚠️ FRONTEND_URL not set, falling back to localhost");
//   //   }
//   //   const allowedOrigins = ["http://localhost:5173", FRONTEND_URL];
//   //   return new Server<ClientToServer | ServerToClient>(this.httpServer, {
//   //     cors: {
//   //       origin: (origin, callback) => {
//   //         if (!origin || allowedOrigins.includes(origin)) {
//   //           callback(null, true);
//   //         } else {
//   //           callback(new Error("Not allowed by CORS"));
//   //         }
//   //       },
//   //       credentials: true,
//   //     },
//   //   });
//   // }
//   // private initializeEvents(): void {
//   //   this.io.on("connection", (socket) => {
//   //     console.log("User connected:", socket.id, socket.data.userId);
//   //     this.setupSocketHandlers(socket);
//   //   });
//   // }

//   private setupSocketHandlers(
//     socket: Socket<ClientToServer, ServerToClient>
//   ): void {
//     //! socket.on("join-room", (data, callback) =>
//     //   this.handleJoinRoom(socket, data, callback)
//     // );
//     //! socket.on("reconnect:room", (data, cb) =>
//     //   this.handleReconnection(socket, data, cb)
//     // );
//     //! socket.on("user-move", (data) => this.handleUserMove(socket, data));
//     //! socket.on("media-state-changed", (data) =>
//     //   this.handleMediaStateChange(socket, data)
//     // );
//     // !socket.on("userStatusChange", (data) =>
//     //   this.handleUserAvailabilityChange(socket, data)
//     // );
//     //! socket.on("call:invite", this.handleCallInvite.bind(this, socket));
//     //! socket.on("call:accept", (data, cb) =>
//     //   this.handleAcceptCall(socket, data, cb)
//     // );
//     //! socket.on("call:decline", (data) => this.handleDeclineCall(socket, data));
//     //! socket.on("disconnect", () => this.handleDisconnect(socket));
//     // socket.on("chat:message", (msg) => {
//     //   const sender = roomManager.getUser(msg.userId);
//     //   if (!sender) return;
//     //   // Find all users in same room & nearby
//     //   const nearbyUsers = Array.from(
//     //     roomManager.getRoomUsers(msg.roomId).values()
//     //   );
//     //   const nearby = nearbyUsers?.filter(
//     //     (u) => u.roomId === sender.roomId && distance(u, sender) < 300
//     //   );

//     //   // Send only to nearby users
//     //   nearby.forEach((u) => {
//     //     if (u.id === sender.id) return; // don't send back to sender
//     //     this.io.to(u.socketId).emit("chat:message", {
//     //       ...msg,
//     //       distance: distance(sender, u),
//     //     });
//     //   });
//     // });

//     // socket.on("chat:startTyping", (data) => {
//     //   const sender = roomManager.getUser(data.userId);
//     //   if (!sender) return;

//     //   function distance(a: User, b: User) {
//     //     const dx = a.x - b.x;
//     //     const dy = a.y - b.y;
//     //     return Math.sqrt(dx * dx + dy * dy);
//     //   }

//     //   const nearbyUsers = Array.from(
//     //     roomManager.getRoomUsers(sender.roomId).values()
//     //   ).filter((u) => distance(u, sender) < 300 && u.id !== sender.id);

//     //   nearbyUsers.forEach((u) => {
//     //     this.io.to(u.socketId).emit("chat:typing", {
//     //       userId: sender.id,
//     //       username: sender.username,
//     //       roomId: sender.roomId,
//     //       x: sender.x,
//     //       y: sender.y,
//     //     });
//     //   });
//     // });

//     // socket.on("chat:stopTyping", (data) => {
//     //   const sender = roomManager.getUser(data.userId);
//     //   if (!sender?.roomId) return;

//     //   const nearbyUsers = Array.from(
//     //     roomManager.getRoomUsers(sender?.roomId).values()
//     //   ).filter((u) => distance(u, sender) < 300 && u.id !== sender.id);

//     //   nearbyUsers.forEach((u) => {
//     //     this.io.to(u.socketId).emit("chat:stopTyping", { userId: sender.id });
//     //   });
//     // });
//   }

//   private startTick(): void {
//     const interval = 1000 / TICK_RATE;
//     this.tickHandle = setInterval(() => this.tick(), interval);
//   }

//   private stopTick(): void {
//     if (this.tickHandle) {
//       clearInterval(this.tickHandle);
//       this.tickHandle = undefined;
//     }
//   }

//   private tick(): void {
//     const rooms = roomManager.getRoomsMap();

//     for (const [roomId, room] of rooms) {
//       this.processRoomTick(roomId, room);
//     }

//     const awayUsers = roomManager.getAwayUsers();
//     if (awayUsers) {
//       this.processAwayUsers(awayUsers);
//     }
//   }

//   private emitRoomSync(user: User, nearbyUsers: User[], data: any): void {
//     const { proximityChanges, audioLevels } = data;
//     this.io.to(user.socketId).emit("room-sync", {
//       ts: Date.now(),
//       me: this.toTileCoords(user.x, user.y),
//       players: nearbyUsers.map(this.mapUserToTileCoords.bind(this)),
//       proximity: proximityChanges,
//       audio: audioLevels,
//     });
//   }

//   // ----------  PROCESSING HELPERS ---------
//   private processAwayUsers(awayUsers: Map<string, AwayUsers>) {
//     if (!awayUsers) return;

//     awayUsers.forEach((userInfo, userId) => {
//       if (Date.now() - userInfo.awaySince > GRACE_PERIOD) {
//         const user = roomManager.getUser(userId);
//         if (user) {
//           this.cleanupUserDisconnection(user);
//         }
//         roomManager.awayUserDisconncted(userId);
//       }
//     });
//   }
//   private processRoomTick(roomId: string, room: RoomRuntimeState): void {
//     const users = Array.from(room.users.values());

//     for (const user of users) {
//       this.processUserTick(roomId, user);
//     }
//   }

//   private processUserTick(roomId: string, user: User): void {
//     const nearbyUsers = this.getNearbyUsersInRange(roomId, user);
//     const players = Array.from(roomManager.getRoomUsers(roomId).values());
//     const proximityData = this.calculateProximityChanges(
//       roomId,
//       user,
//       nearbyUsers
//     );

//     this.emitRoomSync(user, players, proximityData);
//   }

//   private getNearbyUsersInRange(roomId: string, user: User): User[] {
//     const nearbyIds = this.spatial.getNearby(roomId, user);
//     const room = roomManager.getRoomUsers(roomId);

//     return nearbyIds
//       .map((id) => room?.get(id))
//       .filter((other): other is User => {
//         if (!other) return false;
//         const distance = calculateDistance(user, other);
//         return distance <= PROXIMITY_THRESHOLD;
//       });
//   }

//   private calculateProximityChanges(
//     roomId: string,
//     user: User,
//     nearbyUsers: User[]
//   ) {
//     const nextSet = new Set(nearbyUsers.map((u) => u.id));
//     const prevSet =
//       roomManager.getNearbyUsers(roomId, user.id) ?? new Set<string>();
//     const proximityChanges = diffSets(prevSet, nextSet);

//     roomManager.setNearbyUsers(roomId, user.id, nextSet);

//     return {
//       nearbyUsers,
//       proximityChanges,
//       audioLevels: this.calculateAudioLevels(user, nearbyUsers),
//     };
//   }

//   // private calculateAudioLevels(user: User, nearbyUsers: User[]) {
//   //   return nearbyUsers.map((other) => {
//   //     const distance = calculateDistance(user, other);
//   //     return {
//   //       id: other.id,
//   //       level: calculateAudioLevel(distance),
//   //     };
//   //   });
//   // }

//   // private mapUserToTileCoords(user: User): Partial<User> {
//   //   const tileCoords = this.toTileCoords(user.x, user.y);
//   //   return {
//   //     id: user.id,
//   //     x: tileCoords.x,
//   //     y: tileCoords.y,
//   //     availability: user.availability,
//   //     username: user.username,
//   //   };
//   // }

//   // private toPixels(tileX: number, tileY: number): { x: number; y: number } {
//   //   return {
//   //     x: tileX * TILE_SIZE,
//   //     y: tileY * TILE_SIZE,
//   //   };
//   // }

//   // private toTileCoords(xPx: number, yPx: number): { x: number; y: number } {
//   //   return {
//   //     x: Math.floor(xPx / TILE_SIZE),
//   //     y: Math.floor(yPx / TILE_SIZE),
//   //   };
//   // }

//   private updateUserPosition(user: User, tileX: number, tileY: number): void {
//     const { x, y } = this.toPixels(tileX, tileY);
//     user.x = x;
//     user.y = y;

//     // Ensure user exists in all necessary data structures
//     this.ensureUserInDataStructures(user);

//     // Update spatial grid
//     this.spatial.addOrMove(user.roomId, user);
//   }

//   private ensureUserInDataStructures(user: User): void {
//     roomManager.setUser(user.id, user);
//     roomManager.ensureRoom(user.roomId);
//     const roomUsers = roomManager.getRoomUsers(user.roomId);
//     roomUsers.set(user.id, user);
//   }

//   //  --------------  JOIN ROOM LOGIC ---------

//   // private async joinExistingRoom(
//   //   socket: Socket<ClientToServer, ServerToClient>,
//   //   roomId: string,
//   //   userId: string,
//   //   username: string,
//   //   sprite: SpriteNames
//   // ) {
//   //   const roomExists = await checkRoomExists(roomId);
//   //   if (!roomExists.success || !roomExists.exists)
//   //     throw new Error("Room does not exist");

//   //   const reconnectingUser = this.tryReconnection(userId, socket.id);
//   //   if (reconnectingUser) {
//   //     socket.join(roomId);
//   //     socket.emit("room-users", this.getRoomUsersInTileCoords(roomId));
//   //     return reconnectingUser;
//   //   }

//   //   const user = this.createUser(userId, username, roomId, socket.id, sprite);
//   //   this.addUserToRoom(socket, roomId, user);
//   //   socket.to(roomId).emit("user-joined", { ...user, ...DEFAULT_SPAWN_TILE });
//   //   return user;
//   // }

//   // private async createAndJoinRoom(
//   //   socket: Socket<ClientToServer, ServerToClient>,
//   //   roomName: string,
//   //   userId: string,
//   //   username: string,
//   //   sprite: SpriteNames
//   // ) {
//   //   const { success, room } = await createRoom(roomName);
//   //   if (!success || !room?.id) throw new Error("Error creating room");

//   //   const user = this.createUser(userId, username, room.id, socket.id, sprite);

//   //   this.addUserToRoom(socket, room.id, user);

//   //   socket.join(room.id);
//   //   socket.emit("room-users", this.getRoomUsersInTileCoords(room.id));
//   //   socket.to(room.id).emit("user-joined", { ...user, ...DEFAULT_SPAWN_TILE });

//   //   return { user, roomId: room.id };
//   // }

//   // private async handleJoinRoom(
//   //   socket: Socket<ClientToServer, ServerToClient>,
//   //   data: { roomId?: string; roomName?: string; sprite: SpriteNames },
//   //   callback: (result: { success: boolean; data?: JoinRoomResponse }) => void
//   // ) {
//   //   try {
//   //     const userId = socket.data.userId;
//   //     const authUser = await getUserFromID(userId);
//   //     if (!authUser) throw new Error("Auth user not found");

//   //     const { id, username } = authUser;
//   //     let user: User;
//   //     let roomId: string;

//   //     if (data.roomId && !data.roomName) {
//   //       user = await this.joinExistingRoom(
//   //         socket,
//   //         data.roomId,
//   //         userId,
//   //         username,
//   //         data.sprite
//   //       );
//   //       roomId = data.roomId;
//   //     } else if (data.roomName && !data.roomId) {
//   //       console.log("before", data.sprite);
//   //       const result = await this.createAndJoinRoom(
//   //         socket,
//   //         data.roomName,
//   //         userId,
//   //         username,
//   //         data.sprite
//   //       );
//   //       console.log("after", result.user);
//   //       user = result.user;
//   //       roomId = result.roomId;
//   //     } else {
//   //       throw new Error("Provide either roomId or roomName, not both");
//   //     }
//   //     callback({
//   //       success: true,
//   //       data: {
//   //         user: {
//   //           userId,
//   //           userName: username,
//   //           availability: user.availability,
//   //           sprite: user.sprite,
//   //         },
//   //         room: { roomId },
//   //       },
//   //     });
//   //   } catch (error) {
//   //     console.error("Error in join-room:", error);
//   //     callback({ success: false });
//   //   }
//   // }

//   // private async handleReconnection(
//   //   socket: Socket<ClientToServer, ServerToClient>,
//   //   data: { roomId: string },
//   //   cb: (result: {
//   //     success: boolean;
//   //     data?: JoinRoomResponse;
//   //     error?: string;
//   //   }) => void
//   // ) {
//   //   try {
//   //     const userId = socket.data.userId;
//   //     if (!userId) throw new Error("User ID missing from socket data");

//   //     const authUser = await getUserFromID(userId);
//   //     if (!authUser) throw new Error("Authenticated user not found");

//   //     const { id, username } = authUser;
//   //     let User: User | null = null;
//   //     const roomId = data.roomId;

//   //     if (!roomId) {
//   //       throw new Error("Room ID is required for reconnection");
//   //     }

//   //     User = this.tryReconnection(authUser.id, socket.id) || null;
//   //     if (!User) {
//   //       throw new Error("Failed to reconnect user");
//   //     }

//   //     cb({
//   //       success: true,
//   //       data: {
//   //         user: {
//   //           userId,
//   //           userName: username,
//   //           availability: User.availability,
//   //           sprite: User.sprite,
//   //         },
//   //         room: { roomId },
//   //       },
//   //     });
//   //   } catch (error: any) {
//   //     console.error("Reconnection error:", error.message);
//   //     cb({
//   //       success: false,
//   //       error: error.message || "An unknown error occurred during reconnection",
//   //     });
//   //   }
//   // }

//   // private tryReconnection(userId: string, socketId: string) {
//   //   const user = roomManager.getUser(userId);
//   //   if (!user) return false; // no previous user state

//   //   const awayInfo = roomManager.getAwayUser(userId);
//   //   if (!awayInfo) return false; // user wasn’t marked away

//   //   // Re-associate user with new socket
//   //   user.socketId = socketId;
//   //   user.availability = "idle";
//   //   roomManager.removeAwayUser(userId);
//   //   return user;
//   // }


//   // ---------------- shifted in utils
//   // private createUser(
//   //   userId: string,
//   //   username: string,
//   //   roomId: string,
//   //   socketId: string,
//   //   sprite: SpriteNames
//   // ): User {
//   //   const spawnPosition = this.toPixels(
//   //     DEFAULT_SPAWN_TILE.x,
//   //     DEFAULT_SPAWN_TILE.y
//   //   );
//   //   return {
//   //     id: userId,
//   //     availability: "idle",
//   //     sprite: sprite,
//   //     username,
//   //     x: spawnPosition.x,
//   //     y: spawnPosition.y,
//   //     socketId,
//   //     roomId,
//   //     isAudioEnabled: false,
//   //     isVideoEnabled: false,
//   //   };
//   // }

//   // private addUserToRoom(socket: Socket, roomId: string, user: User): void {
//   //   roomManager.ensureRoom(roomId);
//   //   roomManager.addUserToRoom(roomId, user);
//   //   roomManager.setNearbyUsers(roomId, user.id, new Set());
//   //   roomManager.setUser(user.id, user);

//   //   socket.join(roomId);
//   //   this.spatial.addOrMove(roomId, user);
//   // }

//   // private getRoomUsersInTileCoords(roomId: string) {
//   //   return Array.from(roomManager.getRoomUsers(roomId).values()).map(
//   //     (user) => ({
//   //       ...user,
//   //       ...this.toTileCoords(user.x, user.y),
//   //     })
//   //   );
//   // }

//   // ------------  USER STATUS HANDLERS -------

//   // private handleUserMove(
//   //   socket: Socket<ClientToServer, ServerToClient>,
//   //   data: { x: number; y: number }
//   // ): void {
//   //   // Throttling logic moved to a separate method
//   //   if (!this.shouldProcessMove(socket)) return;

//   //   const user = roomManager.getUser(socket.data.userId);
//   //   if (!user) return;

//   //   this.updateUserMovement(user, data.x, data.y);
//   // }

//   // private shouldProcessMove(socket: Socket): boolean {
//   //   const now = Date.now();
//   //   // Store lastMoveAt on socket object for per-client throttling
//   //   const lastMoveAt = (socket as any).lastMoveAt || 0;

//   //   if (now - lastMoveAt < MOVE_LIMIT_MS) return false;

//   //   (socket as any).lastMoveAt = now;
//   //   return true;
//   // }

//   // private updateUserMovement(user: User, tileX: number, tileY: number): void {
//   //   const pixelPosition = this.toPixels(tileX, tileY);
//   //   user.x = pixelPosition.x;
//   //   user.y = pixelPosition.y;

//   //   const roomUsers = roomManager.getRoomUsers(user.roomId);
//   //   if (roomUsers) {
//   //     roomUsers.set(user.id, user);
//   //   }

//   //   this.spatial.addOrMove(user.roomId, user);
//   // }

//   // private handleMediaStateChange(
//   //   socket: Socket<ClientToServer, ServerToClient>,
//   //   data: { isAudioEnabled: boolean; isVideoEnabled: boolean }
//   // ): void {
//   //   const { isAudioEnabled, isVideoEnabled } = data;
//   //   const user = roomManager.getUser(socket.id);
//   //   console.log("media state", user);
//   //   if (!user) return;

//   //   user.isAudioEnabled = isAudioEnabled;
//   //   user.isVideoEnabled = isVideoEnabled;

//   //   socket.to(user.roomId).emit("user-media-state-changed", {
//   //     userId: socket.id,
//   //     isAudioEnabled,
//   //     isVideoEnabled,
//   //   });
//   // }

//   // private handleUserAvailabilityChange(
//   //   socket: Socket,
//   //   data: { status: UserAvailabilityStatus }
//   // ) {
//   //   const user = roomManager.getUser(socket.data.userId);
//   //   if (user) {
//   //     user.availability = data.status;
//   //   }
//   // }

//   // -----------  CONVERSATION FLOW LOGIC ---------
//   // private handleCallInvite(
//   //   socket: Socket,
//   //   data: { conversationId?: string; targetUserId: string },
//   //   callback: (res: { success: boolean; conversation: Conversation }) => void
//   // ) {
//   //   try {
//   //     const { conversationId, targetUserId } = data;

//   //     if (!targetUserId) {
//   //       console.warn("[call:Invite] targetUserId missing");
//   //       return;
//   //     }
//   //     const targetUserSocketId = roomManager.getUser(targetUserId)?.socketId;
//   //     if (conversationId && targetUserSocketId) {
//   //       const existingConversation =
//   //         conversationsManager.getConversation(conversationId);

//   //       if (existingConversation) {
//   //         this.io.to(targetUserSocketId).emit("incoming-invite", {
//   //           conversationId: existingConversation.conversationId,
//   //           from: socket.data.userId,
//   //           members: existingConversation.members,
//   //         });

//   //         return;
//   //       }
//   //     }

//   //     const newConversationId = randomUUID();
//   //     const creator = socket.data.userId;
//   //     const createdAt = Date.now();
//   //     if (!targetUserSocketId) return;
//   //     // tell target user
//   //     this.io.to(targetUserSocketId).emit("incoming-invite", {
//   //       conversationId: newConversationId,
//   //       from: creator,
//   //       members: [creator],
//   //     });

//   //     // join the socket to the new "room"
//   //     socket.join(newConversationId);

//   //     // add to conversation manager
//   //     const conversation = conversationsManager.createConversation({
//   //       conversationId: newConversationId,
//   //       members: [creator],
//   //       pending: [targetUserId],
//   //       roomId: "", // if you have actual roomId, set it
//   //       creator,
//   //       createdAt,
//   //       status: "pending",
//   //     });

//   //     console.log(
//   //       "[call:Invite] new conversation created",
//   //       conversationsManager.getConversation(newConversationId)
//   //     );
//   //     if (!conversation) throw new Error("error creating conversation");
//   //     callback({ success: true, conversation });
//   //   } catch (error) {
//   //     console.error("[call:Invite] error:", error);
//   //   }
//   // }
//   // private handleAcceptCall(
//   //   socket: Socket,
//   //   data: { conversationId: string; targetUserId: string; from: string },
//   //   cb: (res: {
//   //     isConversationActive: boolean;
//   //     conversation: Conversation | null;
//   //   }) => void
//   // ) {
//   //   try {
//   //     const { conversationId, targetUserId, from } = data;

//   //     const conversation = conversationsManager.getConversation(conversationId);
//   //     if (!conversation?.pending) return;
//   //     // user that accepted the call
//   //     const targetUserSocketId = roomManager.getUser(targetUserId)?.socketId;
//   //     switch (conversation.status) {
//   //       // call is yet to be started
//   //       case "pending":
//   //         conversation.members.push(targetUserId);
//   //         conversation.pending = conversation.pending.filter(
//   //           (u) => u !== targetUserId
//   //         );
//   //         const userThatInvitedSocketId = roomManager.getUser(from)?.socketId;
//   //         socket.join(conversationId);
//   //         if (!userThatInvitedSocketId)
//   //           throw new Error("[call:accept]:no user socketId");
//   //         conversation.status = "ongoing";
//   //         this.io.to(userThatInvitedSocketId).emit("call-accepted-response", {
//   //           targetUserId,
//   //           conversationId,
//   //           conversation,
//   //         });

//   //         cb({
//   //           conversation,
//   //           isConversationActive: conversation.status == "ongoing",
//   //         });

//   //       // joining an on going call
//   //       case "ongoing":
//   //         // Add the accepting user to members
//   //         conversation.members.push(targetUserId);

//   //         // Remove them from pending list
//   //         conversation.pending = conversation.pending.filter(
//   //           (u) => u !== targetUserId
//   //         );

//   //         socket.join(conversationId);
//   //         // Notify everyone in conversation that it’s updated
//   //         this.io.to(conversationId).emit("conversation-updated", {
//   //           conversationId,
//   //           joined: [targetUserId],
//   //         });
//   //       case "ended":
//   //     }
//   //   } catch (error) {
//   //     console.log("[call:accept]", error);
//   //     cb({ conversation: null, isConversationActive: false });
//   //   }
//   // }
//   // private handleDeclineCall(
//   //   socket: Socket,
//   //   data: {
//   //     conversationId: string;
//   //     userDeclined: string;
//   //     userThatInvited: string;
//   //   }
//   // ) {
//   //   try {
//   //     const { conversationId, userDeclined, userThatInvited } = data;
//   //     const conversation = conversationsManager.getConversation(conversationId);
//   //     if (!conversation?.pending) return;

//   //     let left = [];
//   //     // Add the accepting user to members
//   //     // left = [userDeclined];

//   //     // Remove them from pending list
//   //     conversation.pending = conversation.pending.filter(
//   //       (u) => u !== userDeclined
//   //     );

//   //     const userThatInvitedSocketId =
//   //       roomManager.getUser(userThatInvited)?.socketId;
//   //     if (!userThatInvitedSocketId)
//   //       throw new Error("[call:decline]- no userThatInvitedSocketId");
//   //     // Notify everyone in conversation that it’s updated
//   //     this.io.to(userThatInvitedSocketId).emit("call-declined", {
//   //       conversationId,
//   //       from: userDeclined,
//   //     });
//   //   } catch (error) {
//   //     console.log(error);
//   //   }
//   // }

//   /// ------------------     CLEAN UP LOGIC   ---
//   // private handleDisconnect(
//   //   socket: Socket<ClientToServer, ServerToClient>
//   // ): void {
//   //   const user = roomManager.getUser(socket.data.userId);
//   //   console.log("User disconnected:", socket.data.userId, user);
//   //   if (!user) return;
//   //   roomManager.setAwayUser(user.roomId, user.id);
//   //   // this.cleanupUserDisconnection(user, user.id);
//   // }

//   // private cleanupUserDisconnection(user: User): void {
//   //   const roomId = user.roomId;

//   //   roomManager.deleteUserFromRoom(user.id, roomId);
//   //   this.spatial.remove(roomId, user.id);

//   //   this.io.to(roomId).emit("user-left", user.id);

//   //   // Clean up empty room
//   //   if (roomManager.getRoomUsers(roomId).size === 0) {
//   //     roomManager.getRoomsMap().delete(roomId);
//   //   }

//   //   roomManager.deleteUser(user.id);
//   // }

//   // public listen(port: number): void {
//   //   this.httpServer.listen(port, "0.0.0.0", () => {
//   //     // Test database connection on startup
//   //     console.log(`WebSocket server running on port ${port}`);
//   //   });
//   // }

//   // // Cleanup method for graceful shutdown
//   // public shutdown(): void {
//   //   console.log("Shutting down WebSocket service...");
//   //   this.stopTick();
//   //   this.io.close();
//   //   this.httpServer.close();
//   // }
// }
