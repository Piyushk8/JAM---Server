import { randomUUID } from "crypto";
import { db } from "../ConversationRooms/db/init";
import { Rooms, RoomUsers, Users } from "../ConversationRooms/db/schema";
import { eq } from "drizzle-orm";
import { Room } from "livekit-server-sdk";

export const createUser = async (username: string, password: string) => {
  const [user] = await db
    .insert(Users)
    .values({ username, password })
    .returning();

  return user;
};
export const getUserFromID = async (userId:string) => {
  const user = await db
    .query.Users.findFirst({where:eq(Users.id, userId)})
  return user ?? null;
};

// Check if a room exists by id
export const checkRoomExists = async (
  roomId: string
): Promise<
  | { success: true; exists: boolean; room?: typeof Rooms.$inferSelect }
  | { success: false; message: string }
> => {
  try {
    const room = await db.query.Rooms.findFirst({
      where: (rooms, { eq }) => eq(rooms.id, roomId),
    });

    return {
      success: true,
      exists: !!room,
      room: room ?? undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: "Unknown error" };
  }
};
export const getRoom = async (
  roomId: string
): Promise<{
  success: boolean;
  room?: typeof Rooms.$inferSelect;
  message?: string;
}> => {
  try {
    const existing = await db.select().from(Rooms).where(eq(Rooms.id, roomId));

    if (existing.length > 0)
      return {
        success: true,
        room: existing[0],
      };
    else {
      return { success: false, message: "no room exists" };
    }
  } catch (error) {
    return {
      success: false,
      message: "[getRoom]:error getting room",
    };
  }
};

export const createRoom = async (
  roomName: string
): Promise<{
  success: boolean;
  room?: typeof Rooms.$inferInsert;
  message?: string;
}> => {
  try {
    const room = await db
      .insert(Rooms)
      .values({
        name: roomName,
        liveKitRoomName: `lv-${randomUUID()}`,
      })
      .returning();
    if (!room)
      return {
        success: false,
        message: "error creating rooom",
      };
    return {
      room: room[0],
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      message: "[helper]:error creating room",
    };
  }
};

// Join user to a room (with session)
export const joinRoom = async (
  userId: string,
  roomId: string
): Promise<{
  success: boolean;
  message?: string;
  roomUser?: typeof RoomUsers.$inferInsert;
}> => {
  const { success, room, message } = await getRoom(roomId);
  if (!success || !room) {
    return {
      success: false,
      message: "user to join doesnt exists",
    };
  }

  const sessionId = randomUUID();

  const [roomUser] = await db
    .insert(RoomUsers)
    .values({
      roomId: room.id,
      userId,
      sessionId,
      isConnected: true,
    })
    .returning();

  return {
    success: true,
    roomUser,
  };
};
