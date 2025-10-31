import { checkRoomExists, createRoom, getUserFromID } from "../../Helpers/user";
import {
  JoinRoomResponse,
  SocketType,
  SpriteNames,
  User,
} from "../../types/type";
import { IDeps, IO } from "../SocketServer";
import { DEFAULT_SPAWN_TILE } from "../utility/constants";
import {
  addUserToRoom,
  createUser,
  getRoomUsersInTileCoords,
} from "../utility/utils";
import { tryReconnection } from "./connection/tryReconnection";

export const handleJoinRoom = (io: IO, socket: SocketType, deps: IDeps) => {
  socket.on(
    "join-room",
    async (
      data: { roomId?: string; roomName?: string; sprite: SpriteNames },
      callback: (result: { success: boolean; data?: JoinRoomResponse }) => void
    ) => {
      try {
        const userId = socket.data.userId;
        const authUser = await getUserFromID(userId);
        if (!authUser) throw new Error("Auth user not found");

        const { id, username } = authUser;
        let user: User;
        let roomId: string;

        if (data.roomId && !data.roomName) {
          user = await joinExistingRoom(
            socket,
            data.roomId,
            userId,
            username,
            data.sprite,
            deps
          );
          roomId = data.roomId;
        } else if (data.roomName && !data.roomId) {
          console.log("before", data.sprite);
          const result = await createAndJoinRoom(
            socket,
            data.roomName,
            userId,
            username,
            data.sprite,
            deps
          );
          console.log("after", result.user);
          user = result.user;
          roomId = result.roomId;
        } else {
          throw new Error("Provide either roomId or roomName, not both");
        }
        callback({
          success: true,
          data: {
            user: {
              userId,
              userName: username,
              availability: user.availability,
              sprite: user.sprite,
            },
            room: { roomId },
          },
        });
      } catch (error) {
        console.error("Error in join-room:", error);
        callback({ success: false });
      }
    }
  );
};

// utility
const joinExistingRoom = async (
  socket: SocketType,
  roomId: string,
  userId: string,
  username: string,
  sprite: SpriteNames,
  deps: IDeps
) => {
  const { roomManager, spatialGrid } = deps;
  const roomExists = await checkRoomExists(roomId);
  if (!roomExists.success || !roomExists.exists)
    throw new Error("Room does not exist");

  const reconnectingUser = tryReconnection(userId, socket.id, roomManager);
  if (reconnectingUser) {
    socket.join(roomId);
    socket.emit("room-users", getRoomUsersInTileCoords(roomId, roomManager));
    return reconnectingUser;
  }

  const user = createUser(userId, username, roomId, socket.id, sprite);
  addUserToRoom(socket, roomId, user, deps);
  socket.to(roomId).emit("user-joined", { ...user, ...DEFAULT_SPAWN_TILE });
  return user;
};

const createAndJoinRoom = async (
  socket: SocketType,
  roomName: string,
  userId: string,
  username: string,
  sprite: SpriteNames,
  deps: IDeps
) => {
  const { success, room } = await createRoom(roomName);
  if (!success || !room?.id) throw new Error("Error creating room");

  const user = createUser(userId, username, room.id, socket.id, sprite);

  addUserToRoom(socket, room.id, user, deps);

  socket.join(room.id);
  socket.emit(
    "room-users",
    getRoomUsersInTileCoords(room.id, deps.roomManager)
  );
  socket.to(room.id).emit("user-joined", { ...user, ...DEFAULT_SPAWN_TILE });

  return { user, roomId: room.id };
};
