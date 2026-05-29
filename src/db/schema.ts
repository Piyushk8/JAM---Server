import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
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

export const notificationStatusEnum = pgEnum("notificationStatus", [
  "unread",
  "read",
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

export const RoomPlugins = pgTable(
  "room_plugins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => Rooms.id, { onDelete: "cascade" }),
    pluginId: text("plugin_id").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    configJson: jsonb("config_json")
      .$type<Record<string, unknown>>()
      .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("room_plugins_room_plugin_idx").on(
      table.roomId,
      table.pluginId
    ),
    index("room_plugins_room_idx").on(table.roomId),
  ]
);

export const PluginState = pgTable(
  "plugin_state",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => Rooms.id, { onDelete: "cascade" }),
    pluginId: text("plugin_id").notNull(),
    stateKey: text("state_key").notNull(),
    stateJson: jsonb("state_json")
      .$type<Record<string, unknown> | string | number | boolean | null>()
      .notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("plugin_state_room_plugin_key_idx").on(
      table.roomId,
      table.pluginId,
      table.stateKey
    ),
    index("plugin_state_room_idx").on(table.roomId),
  ]
);

export const Notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => Users.id, { onDelete: "cascade" }),
    roomId: uuid("room_id").references(() => Rooms.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => Users.id, { onDelete: "set null" }),
    actorName: text("actor_name"),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    status: notificationStatusEnum().notNull().default("unread"),
    actionSection: text("action_section"),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at").defaultNow(),
    readAt: timestamp("read_at"),
  },
  (table) => [
    index("notifications_recipient_status_idx").on(
      table.recipientId,
      table.status,
      table.createdAt
    ),
    index("notifications_room_idx").on(table.roomId),
  ]
);

export type roomTheme = (typeof roomThemeEnum.enumValues)[number];
