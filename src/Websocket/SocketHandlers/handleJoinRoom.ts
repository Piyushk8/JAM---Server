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
  socket.on("join-room", async (data, cb) => {
    socket.data.log.info(
      { event: "join-room", payload: data },
      "Join room requested",
    );

    try {
      const userId = socket.data.userId;

      if (!userId) {
        socket.data.log.warn("Socket has no userId");
        throw new Error("Unauthenticated socket");
      }

      const authUser = await getUserFromID(userId);

      if (!authUser) {
        socket.data.log.warn({ userId }, "Auth user not found");
        throw new Error("Auth user not found");
      }

      const { username } = authUser;

      socket.data.log.debug(
        { userId, username },
        "User authenticated for join-room",
      );

      let user: User;
      let roomTheme: roomTheme;
      let roomId: string;

      if (data.roomId && !data.roomName) {
        socket.data.log.info({ roomId: data.roomId }, "Joining existing room");

        user = await joinExistingRoom(
          socket,
          data.roomId,
          userId,
          username,
          data.sprite,
          deps,
        );

        roomId = data.roomId;
        roomTheme = deps.roomManager.getRoomTheme(roomId)!;
      } else if (data.roomName && !data.roomId) {
        socket.data.log.info(
          { roomName: data.roomName, roomTheme: data.roomTheme },
          "Creating new room",
        );

        const result = await createAndJoinRoom(
          socket,
          data.roomName,
          data.roomTheme!,
          userId,
          username,
          data.sprite,
          deps,
        );

        user = result.user;
        roomId = result.room.roomId;
        roomTheme = deps.roomManager.getRoomTheme(roomId)!;
      } else {
        socket.data.log.warn({ payload: data }, "Invalid join-room payload");
        throw new Error("Provide either roomId or roomName, not both");
      }

      if (!roomId || !roomTheme) {
        socket.data.log.error(
          { roomId, roomTheme },
          "Room created/joined but missing data",
        );
        throw new Error("Room or theme missing after join");
      }

      socket.data.log.info({ userId, roomId }, "User joined room successfully");

      cb({
        success: true,
        data: {
          user: {
            userId,
            userName: username,
            availability: user.availability,
            sprite: user.sprite,
          },
          room: { roomId, roomTheme },
        },
      });
    } catch (error) {
      socket.data.log.error(
        {
          err: error,
          payload: data,
          userId: socket.data.userId,
        },
        "join-room failed",
      );

      cb({ success: false, data: null });
    }
  });
};

// utility
const joinExistingRoom = async (
  socket: SocketType,
  roomId: string,
  userId: string,
  username: string,
  sprite: SpriteNames,
  deps: IDeps,
) => {
  socket.data.log.debug({ roomId }, "Checking if room exists");
  const { roomManager, spatialGrid } = deps;

  const roomExists = await checkRoomExists(roomId);
  if (!roomExists.success || !roomExists.exists) {
    socket.data.log.warn({ roomId }, "Room does not exist");
    throw new Error("Room does not exist");
  }

  const reconnectingUser = tryReconnection(userId, socket.id, roomManager);
  if (reconnectingUser) {
    socket.data.log.info({ roomId, userId }, "User reconnected to room");
    socket.join(roomId);
    socket.emit("room-users", getRoomUsersInTileCoords(roomId, roomManager));
    return reconnectingUser;
  }

  socket.data.log.info({ roomId, userId }, "New user joining room");
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
  deps: IDeps,
) => {
  const { success, room } = await createRoom(roomName, roomTheme);
  if (!success || !room?.id) {
    socket.data.log.error({ room }, "Room creation failed");
    throw new Error("Error creating room");
  }

  socket.data.log.info({ roomId: room.id }, "Room created");
  const user = createUser(userId, username, room.id, socket.id, sprite);

  addUserToRoom(socket, room.id, user, deps);
  deps.roomManager.setRoomTheme(room.id, roomTheme);
  socket.join(room.id);
  socket.emit(
    "room-users",
    getRoomUsersInTileCoords(room.id, deps.roomManager),
  );
  socket.to(room.id).emit("user-joined", { ...user, ...DEFAULT_SPAWN_TILE });

  return { user, room: { roomId: room.id, roomTheme: room.theme } };
};
