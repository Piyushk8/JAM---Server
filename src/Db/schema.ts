import {
  boolean,
  integer,
  pgEnum,
  PgEnumColumn,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const Users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow(),
});
export const roomUsers = pgTable("room_users", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => Rooms.id), // FK to rooms
  userId: integer("user_id").references(() => Users.id), // FK to users
  sessionId: text("session_id").notNull(),
  isConnected: boolean("is_connected").default(false),
  videoEnabled: boolean("video_enabled").default(true),
  audioEnabled: boolean("audio_enabled").default(true),
  lastActive: timestamp("last_active").defaultNow(),
});
export const videoQualityEnum = pgEnum("videoQuality", [
  "high",
  "low",
  "medium",
]);
const Rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("room_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  liveKitRoomName: text("livekit_room_id").notNull(),
  maxParticipants: integer("max_Participants").notNull().default(20),
  videoQuality: videoQualityEnum().default("medium"),
});
