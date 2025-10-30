// src/server/socket/handlerRegistry.ts
import { Server, Socket } from "socket.io";
import { handleConnection } from "./SocketHandlers/connectionHandler";
import { handleMovement } from "./SocketHandlers/movement";
import { RoomService } from "@/services/RoomServices";
import { ProximityService } from "@/services/ProximityServices";

export interface Deps {
  roomService: RoomService;
  proximityService: ProximityService;
}

export function registerHandlers(io: Server, socket: Socket, deps: Deps) {
  handleConnection(io, socket, deps);
  handleMovement(io, socket, deps);
  //   handleChat(io, socket, deps);
  //   handleDisconnect(io, socket, deps);
}
