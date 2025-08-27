import { randomUUID } from "crypto";
import { db } from "../db/init";
import { Rooms, RoomUsers, Users } from "../db/schema";
import { eq } from "drizzle-orm";

// Create new user
export const createUser = async (username: string,password:string) => {
  const [user] = await db.insert(Users).values({ username,password }).returning();

  return user;
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
// Create a new room (or fetch if exists by name)
export const getOrCreateRoom = async (roomName: string) => {
  const existing = await db
    .select()
    .from(Rooms)
    .where(eq(Rooms.name, roomName));

  if (existing.length > 0) return existing[0];

  const [room] = await db
    .insert(Rooms)
    .values({
      name: roomName,
      liveKitRoomName: `lk_${randomUUID()}`,
    })
    .returning();

  return room;
};

// Join user to a room (with session)
export const joinRoom = async (userId: string, roomName: string) => {
  const room = await getOrCreateRoom(roomName);
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
    room,
    sessionId,
    roomUser,
  };
};
