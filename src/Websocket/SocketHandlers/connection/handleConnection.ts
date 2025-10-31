import { Socket } from "socket.io";
import { ClientToServer, ServerToClient, SocketType } from "../../../types/type";
import { IDeps, IO } from "../../SocketServer";

export default function handleDisconnect(
  io: IO,
  socket: SocketType,
  deps: IDeps
) {
  socket.on("disconnect", (reason) => {
    console.log("User disconnected", socket.id,socket.data.userId);
  });
}
