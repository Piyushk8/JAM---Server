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
  RoomThemesId,
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
import roomManager from "../RoomManager/roomManager";
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
import { startTick } from "./SocketHandlers/synchronization/tickLogic";
const PROXIMITY_THRESHOLD = 150;
const CHAT_RANGE = 200;
const MOVE_LIMIT_MS = 33; // ~30Hz throttling
const DEFAULT_SPAWN_TILE = { x: 22, y: 10 };
const GRACE_PERIOD = 5 * 60 * 1000;
export type RoomRuntimeState = {
  id: string;
  roomTheme?: roomTheme;
  users: Map<string, User>;
  proximity: Map<string, Set<string>>;
};
import http from "http";
import { roomTheme } from "../db/schema";
import logger from "../lib/logger";

export type IO = ServerType;
export interface IDeps {
  roomManager: typeof roomManager;
  conversationsManager: typeof conversationsManager;
  spatialGrid: SpatialGrid;
}

// Whiteboard storage - stores drawing elements per board
const boards: Record<string, any[]> = {};

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
  startTick(io, {
    roomManager,
    spatialGrid,
    conversationsManager,
  });
  io.on("connection", (socket: SocketType) => {
    const connectionId = crypto.randomUUID();
    socket.data.connectionId = connectionId;
    socket.data.log = logger.child({
      connectionId: socket.data.connectionId,
      transport: "socket",
    });
    socket.data.log.info(`socket connected ${socket.data.userId}`);
    registerHandlers(io, socket, {
      roomManager,
      spatialGrid,
      conversationsManager,
    });

    socket.on("whiteboard:join", ({ boardId }) => {
      socket.join(boardId);

      // Initialize board if it doesn't exist
      if (!boards[boardId]) {
        boards[boardId] = [];
      }

      // Send current board state to the joining client
      socket.emit("whiteboard:state", {
        boardId,
        elements: boards[boardId],
      });

    });

    socket.on("whiteboard:update", ({ boardId, elements }) => {
      if (!boardId || !elements) {
        console.warn(`[Whiteboard] Invalid update data from ${socket.id}`);
        return;
      }

      boards[boardId] = elements;

      // Broadcast to all OTHER users in the same board
      socket.to(boardId).emit("whiteboard:remote-update", {
        boardId,
        elements,
      });
    });

    // Leave a whiteboard room
    socket.on("whiteboard:leave", ({ boardId }) => {
      socket.leave(boardId);
    });

    // Clean up on disconnect
    socket.on("disconnect", () => {});
  });

  return io;
}
