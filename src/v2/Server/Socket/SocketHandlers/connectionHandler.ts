import { TypedServer, TypedSocket } from "@/domain/types/socket";
import { Deps } from "../HandlerRegistry";

export function handleConnection(
  io: TypedServer,
  socket: TypedSocket,
  { roomService }: Deps
) {
  socket.on("join-room", ({ user, roomId }) => {
    // roomService.addUserToRoom(roomId, user);
    socket.join(roomId);
    io.to(roomId).emit("user-joined", { user });
  });
}

export function handleDisconnect(
  io: TypedServer,
  socket: TypedSocket,
  { roomService }: Deps
) {
  socket.on("disconnect", () => {
    // optional: you can track socket.id → userId mapping
    console.log(`[WS] ${socket.id} disconnected`);
  });
}
