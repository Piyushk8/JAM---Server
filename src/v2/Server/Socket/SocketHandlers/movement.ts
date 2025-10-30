import { TypedServer, TypedSocket } from "@/domain/types/socket";
import { Deps } from "../HandlerRegistry";

export function handleMovement(
  io: TypedServer,
  socket: TypedSocket,
  { roomService, proximityService }: Deps
) {
  socket.on("user-move", (payload) => {
    const { userId, roomId, position } = payload;

    // update user's position
    // roomService.updateUserPosition(roomId, userId, position);

    // recompute proximity
    // const proximityMap = proximityService.updateProximity(
    //   roomId,
    //   roomService.(roomId)
    // );

    // broadcast new proximity info
    // io.to(roomId).emit('room-sync', proximityMap);
  });
}
