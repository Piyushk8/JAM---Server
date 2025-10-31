import {
  AUDIO_FALLOFF_END,
  calculateAudioLevel,
  calculateDistance,
  distance,
  getUsersInProximity,
  TILE_SIZE,
} from "../lib/util";
import {
  ChatMessage,
  ClientToServer,
  JoinRoomResponse,
  ProximityUser,
  Room,
  RoomSyncPayload,
  ServerToClient,
  ServerType,
  SocketType,
  SpriteNames,
  User,
  UserAvailabilityStatus,
} from "../types/type";
import cookie from "cookie";
import { diffSets, SpatialGrid } from "../lib/spatialGrid";
import { CELL_SIZE, FRONTEND_URL, TICK_RATE } from "../lib/contants";
import roomManager, { AwayUsers } from "../RoomManager";
import { Conversation, conversationsManager } from "../ConversationRooms";
import { randomUUID } from "crypto";
import {
  checkRoomExists,
  createRoom,
  getUserFromID,
  joinRoom,
} from "../Helpers/user";
import jwt from "jsonwebtoken";
import { parseCookiesWithQs } from "./auth/cookieParser";
import authMiddleware from "./auth/authMiddleware";
import { registerHandlers } from "./registerHandler";
import { DefaultEventsMap, Server } from "socket.io";
const PROXIMITY_THRESHOLD = 150;
const CHAT_RANGE = 200;
const MOVE_LIMIT_MS = 33; // ~30Hz throttling
const DEFAULT_SPAWN_TILE = { x: 22, y: 10 };
const GRACE_PERIOD = 5 * 60 * 1000;
export type RoomRuntimeState = {
  id: string;
  users: Map<string, User>;
  proximity: Map<string, Set<string>>;
};
import http from "http";

export type IO = ServerType;
export interface IDeps {
  roomManager: typeof roomManager;
  conversationsManager: typeof conversationsManager;
  spatialGrid: SpatialGrid;
}
export default function createSocketServer(http: http.Server) {
  if (!FRONTEND_URL) {
    console.warn("⚠️ FRONTEND_URL not set, falling back to localhost");
  }
  const allowedOrigins = ["http://localhost:5173", FRONTEND_URL];

  const io: ServerType = new Server(http, {
    cors: {
      origin: (origin, callback) => {
        
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    },
  });

  io.use(authMiddleware);

  const spatialGrid = new SpatialGrid(CELL_SIZE);
  io.on("connection", (socket: SocketType) => {
    console.log("User connected:", socket.id, socket.data.userId);

    registerHandlers(io, socket, {
      roomManager,
      spatialGrid,
      conversationsManager,
    });
  });

  return io;
}
