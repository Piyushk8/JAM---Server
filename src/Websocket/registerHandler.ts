import { SocketType } from "../types/type";
import { handleAcceptCall } from "./SocketHandlers/callHandlers/handleCallAccept";
import { handleDeclineCall } from "./SocketHandlers/callHandlers/handleCallDecline";
import { handleCallInvite } from "./SocketHandlers/callHandlers/handleCallInvite";
import { handleDisconnect } from "./SocketHandlers/connection/handleDisconnect";
import { handleReconnection } from "./SocketHandlers/connection/handleReconnection";
import { handleJoinRoom } from "./SocketHandlers/handleJoinRoom";
import { handleMediaStateChange } from "./SocketHandlers/handleMediaState";
import { handleRoomChat } from "./SocketHandlers/handleRoomChat";
import { handleSocialWave } from "./SocketHandlers/handleSocialWave";
import { handleUserMove } from "./SocketHandlers/handleUserMove";
import { handleUserAvailabilityChange } from "./SocketHandlers/handleUserStatusChange";
import { IDeps, IO } from "./SocketServer";
import { pluginHost } from "../plugins/pluginHost";

export const registerHandlers = (io: IO, socket: SocketType, deps: IDeps) => {
  handleJoinRoom(io, socket, deps);
  handleMediaStateChange(io, socket, deps);
  handleRoomChat(io, socket, deps);
  handleSocialWave(io, socket, deps);
  handleUserMove(io, socket, deps);
  handleUserAvailabilityChange(io, socket, deps);
  pluginHost.registerSocketHandlers(socket);
  handleReconnection(io, socket, deps);
  handleDisconnect(io, socket, deps);

  // call
  handleDeclineCall(io, socket, deps);
  handleAcceptCall(io, socket, deps);
  handleCallInvite(io, socket, deps);
};
