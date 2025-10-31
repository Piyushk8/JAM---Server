import { SocketType } from "../types/type";
import { handleAcceptCall } from "./SocketHandlers/callHandlers/handleCallAccept";
import { handleDeclineCall } from "./SocketHandlers/callHandlers/handleCallDecline";
import { handleCallInvite } from "./SocketHandlers/callHandlers/handleCallInvite";
import handleDisconnect from "./SocketHandlers/connection/handleConnection";
import { handleReconnection } from "./SocketHandlers/connection/handleReconnection";
import { handleJoinRoom } from "./SocketHandlers/handleJoinRoom";
import { handleMediaStateChange } from "./SocketHandlers/handleMediaState";
import { handleUserMove } from "./SocketHandlers/handleUserMove";
import { handleUserAvailabilityChange } from "./SocketHandlers/handleUserStatusChange";
import { startTick } from "./SocketHandlers/synchronization/tickLogic";
import { IDeps, IO } from "./SocketServer";

export const registerHandlers = (io: IO, socket: SocketType, deps: IDeps) => {
  let tickHandle: NodeJS.Timeout | null = null;

  handleDisconnect(io, socket, deps);
  handleJoinRoom(io, socket, deps);
  handleReconnection(io, socket, deps);
  handleMediaStateChange(io, socket, deps);
  handleUserMove(io, socket, deps);
  handleUserAvailabilityChange(io, socket, deps);

  // call
  handleDeclineCall(io, socket, deps);
  handleAcceptCall(io, socket, deps);
  handleCallInvite(io, socket, deps);

  startTick(io,tickHandle, deps);
  // Cleanup method for graceful shutdown
};
