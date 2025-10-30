// src/server/socket/socketServer.ts
import { Server } from "socket.io";
import http from "http";
import { registerHandlers } from "./HandlerRegistry";
import { proximityService, roomService } from "../..";
import { authMiddleware } from "./auth/authMiddleware";

export function createSocketServer(httpServer: http.Server): Server {
  // if (!FRONTEND_URL) {
  //    console.warn("⚠️ FRONTEND_URL not set, falling back to localhost");
  //  }
  const allowedOrigins = ["http://localhost:5173"];
  const io = new Server(httpServer, {
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
  io.on("connection", (socket) => {
    console.log(`[WS] New connection ${socket.id}`);

    registerHandlers(io, socket, {
      roomService,
      proximityService,
    });
  });

  return io;
}
