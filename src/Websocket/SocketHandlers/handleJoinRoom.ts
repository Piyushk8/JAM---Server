import { roomTheme } from "../../db/schema";
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
      data: {
        roomId?: string;
        roomName?: string;
        sprite: SpriteNames;
        roomTheme?: roomTheme;
      },
      cb: (res: { success: boolean; data: JoinRoomResponse | null }) => void
    ) => {
      try {
        const userId = socket.data.userId;
        const authUser = await getUserFromID(userId);
        if (!authUser) throw new Error("Auth user not found");
        const { username } = authUser;
        let user: User;
        let roomTheme: roomTheme;
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
          roomTheme = deps.roomManager.getRoomTheme(roomId)!;
        } else if (data.roomName && !data.roomId) {
          const result = await createAndJoinRoom(
            socket,
            data.roomName,
            data.roomTheme!,
            userId,
            username,
            data.sprite,
            deps
          );
          user = result.user;
          roomId = result.room.roomId;
          roomTheme = deps.roomManager.getRoomTheme(roomId)!;
        } else {
          throw new Error("Provide either roomId or roomName, not both");
        }

        if (!roomId || !roomTheme)
          throw new Error(
            `${!roomTheme ? "no room theme provided" : ""} ${
              !roomId ? "no room Id provided" : ""
            }`
          );
        cb({
          success: true,
          data: {
            user: {
              userId,
              userName: username,
              availability: user.availability,
              sprite: user.sprite,
            },
            room: { roomId, roomTheme } as {
              roomId: string;
              roomTheme: roomTheme;
            },
          },
        });
      } catch (error) {
        console.error("Error in join-room:", error);
        cb({ success: false, data: null });
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
  roomTheme: roomTheme,
  userId: string,
  username: string,
  sprite: SpriteNames,
  deps: IDeps
) => {
  const { success, room } = await createRoom(roomName, roomTheme);
  if (!success || !room?.id) throw new Error("Error creating room");

  const user = createUser(userId, username, room.id, socket.id, sprite);

  addUserToRoom(socket, room.id, user, deps);
  deps.roomManager.setRoomTheme(room.id, roomTheme);

  socket.join(room.id);
  socket.emit(
    "room-users",
    getRoomUsersInTileCoords(room.id, deps.roomManager)
  );
  socket.to(room.id).emit("user-joined", { ...user, ...DEFAULT_SPAWN_TILE });

  return { user, room: { roomId: room.id, roomTheme: room.theme } };
};
