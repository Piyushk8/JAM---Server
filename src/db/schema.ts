import {
  boolean,
  index,
  integer,
  pgEnum,
  PgEnumColumn,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const Users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull().unique(),
    email: text("email"),
    password: text("password").notNull(),
    avatar: text("avatar"),
    createdAt: timestamp("created_at").defaultNow(),
    lastSeen: timestamp("last_seen").defaultNow(),
  },
  (table) => [uniqueIndex("username_idx").on(table.username)]
);

export const videoQualityEnum = pgEnum("videoQuality", [
  "high",
  "low",
  "medium",
]);
export const roomThemeEnum = pgEnum("roomTheme", [
  "basicoffice",
  "largeoffice",
]);

export const Rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("room_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  liveKitRoomName: text("livekit_room_id").notNull(),
  theme: roomThemeEnum().notNull(),
  maxParticipants: integer("max_Participants").notNull().default(20),
  videoQuality: videoQualityEnum().default("medium"),
});

export const RoomUsers = pgTable("room_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").references(() => Rooms.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => Users.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  isConnected: boolean("is_connected").default(false),
  videoEnabled: boolean("video_enabled").default(true),
  audioEnabled: boolean("audio_enabled").default(true),
  lastActive: timestamp("last_active").defaultNow(),
});

export type roomTheme = (typeof roomThemeEnum.enumValues)[number]