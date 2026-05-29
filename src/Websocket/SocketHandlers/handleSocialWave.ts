import { randomUUID } from "crypto";
import { SocketType, WaveAckPayload, WaveEventPayload } from "../../types/type";
import { IDeps, IO } from "../SocketServer";

const rejectWave = (
  socket: SocketType,
  callback: ((res: WaveAckPayload) => void) | undefined,
  id: string,
  reason: string
) => {
  const ack = { id, delivered: false, reason };
  callback?.(ack);
  socket.emit("social:wave:ack", ack);
};
export const handleSocialWave = (
  io: IO,
  socket: SocketType,
  { roomManager }: IDeps
) => {
  socket.on(
    "social:wave",
    (
      data: WaveEventPayload,
      callback?: (res: WaveAckPayload) => void
    ): void => {
      const id = data?.id ?? randomUUID();
      const timestamp = data?.timestamp ?? data?.createdAt ?? Date.now();

      if (!data?.toUserId || !data?.roomId) {
        rejectWave(socket, callback, id, "missing_target_or_room");
        return;
      }
      console.log("Received wave event with data:", data);
      const sender = roomManager.getUser(socket.data.userId);
      const target = roomManager.getUser(data.toUserId);
      console.log("Sender:", sender);
      console.log("Target:", target);
      if (!sender || !target) {
        rejectWave(socket, callback, id, "user_not_found");
        return;
      }

      if (
        sender.id !== data.fromUserId ||
        sender.roomId !== data.roomId ||
        target.roomId !== data.roomId
      ) {
        rejectWave(socket, callback, id, "room_or_sender_mismatch");
        return;
      }

      if (!target.socketId) {
        rejectWave(socket, callback, id, "target_unavailable");
        return;
      }

      const payload: Required<WaveEventPayload> = {
        id,
        fromUserId: sender.id,
        fromUsername: sender.username,
        toUserId: target.id,
        toUsername: target.username,
        roomId: data.roomId,
        timestamp,
        createdAt: timestamp,
      };

      io.to(target.socketId).emit("social:wave:received", payload);

      const ack = { id, delivered: true };
      callback?.(ack);
      socket.emit("social:wave:ack", ack);
    }
  );
};
