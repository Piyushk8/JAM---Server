import { SocketType } from "../../../types/type";
import { IDeps, IO } from "../../SocketServer";
import http from "http";

export const gracefulShutDown = (
  io: IO,
  httpServer: http.Server,
  {}: IDeps,
  stopTick: () => void
) => {
  console.log("Shutting down WebSocket service...");
  stopTick();
  io.close();
  httpServer.close();
};
