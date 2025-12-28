import { Server, Socket } from "socket.io";
import { Conversation } from "../ConversationRooms";
import { roomTheme } from "../db/schema";

export interface userData {
  id: string;
  username: string;
  x: number;
  y: number;
  socketId: string;
}

export type UserAvailabilityStatus = "idle" | "busy" | "away";

export type SpriteNames = "Ash" | "Lucy" | "Nancy" | "Adam";
export const Sprites: SpriteNames[] = ["Ash", "Lucy", "Nancy", "Adam"];
export interface User {
  id: string;
  availability: UserAvailabilityStatus;
  username: string;
  x: number;
  y: number;
  renderX?: number;
  renderY?: number;
  socketId: string;
  roomId: string;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  sprite: SpriteNames;
}

export interface AwayUsers {
  userId: string;
  roomId: string;
  awaySince: number;
}

export type RoomThemes = "office 1" | "larger office 1" | "larger office 2";

export const RoomThemesId = {
  "office 1": 1,
  "larger office 1": 2,
  "larger office 2": 3,
} as const;

export type RoomThemesId = (typeof RoomThemesId)[keyof typeof RoomThemesId];

export const RoomThemesName = Object.fromEntries(
  Object.entries(RoomThemesId).map(([key, value]) => [value, key])
) as Record<RoomThemesId, keyof typeof RoomThemesId>;

export interface Room {
  id: string;
  users: Map<string, User>;
  roomThemeId: RoomThemesId;
}
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  type: "text" | "emoji";
  timestamp: number;
  roomId: string;
  x: number;
  y: number;
  distance?: number;
}
export interface ProximityUser extends User {
  distance: number;
}

export type RoomSyncPayload = {
  ts: number;
  me: { x: number; y: number };
  players: Array<{
    id: string;
    x: number;
    y: number;
    username: string;
  }>;
  proximity: {
    entered: string[];
    left: string[];
  };
  audio: Array<{ id: string; level: number }>;
};

export type ConversationUpdatePayload = {
  conversationId: string;
  joined: string;
  left: string;
};

export type ServerToClient = {
  "whiteboard:state": (data: { boardId: string; elements: any[] }) => void;
  "whiteboard:remote-update": (data: {
    boardId: string;
    elements: any[];
  }) => void;
  "room-users": (users: User[]) => void;
  "user-joined": (user: User) => void;
  "user-left": (userId: string) => void;
  "room-sync": (payload: RoomSyncPayload) => void;
  "user-media-state-changed": (data: {
    userId: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
  }) => void;
  "message-received": (msg: ChatMessage) => void;
  "message-sent": (msg: ChatMessage) => void;
  "incoming-invite": (data: {
    conversationId: string;
    from: string;
    members: string[];
  }) => void;
  "conversation-updated": (data: ConversationUpdatePayload) => void;
  "call-declined": (data: {
    conversationId: string;
    userDeclined: string;
  }) => void;
  "call-accepted-response": (data: {
    conversationId: string;
    targetUserId: string;
    conversation?: any;
  }) => void;

  "chat:message": (chatMessage: ChatMessage) => void;
  "chat:startTyping": (data: TypingUser) => void;
  "chat:stopTyping": ({ userId }: { userId: string }) => void;
};

export interface JoinRoomResponse {
  user: {
    userName: string;
    userId: string;
    sprite: SpriteNames;
    availability: UserAvailabilityStatus;
  };
  room: {
    roomId: string;
    roomTheme: roomTheme;
  };
}

export type ClientToServer = {
  "whiteboard:join": (data: { boardId: string }) => void;
  "whiteboard:leave": (data: { boardId: string }) => void;
  "whiteboard:update": (data: { boardId: string; elements: any[] }) => void;
  "join-room": (
    data: {
      roomId?: string;
      roomName?: string;
      sprite: SpriteNames;
      roomTheme?: roomTheme;
    },
    cb: (res: { success: boolean; data: JoinRoomResponse|null }) => void
  ) => Promise<void>;
  "reconnect:room": (
    data: { roomId: string },
    cb: (res: { success: boolean; data?: JoinRoomResponse }) => void
  ) => Promise<void>;

  "user-move": (data: { x: number; y: number }) => void;
  "media-state-changed": (data: {
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
  }) => void;
  "send-message": (data: { message: string; type: "text" | "emoji" }) => void;
  "typing-start": () => void;
  "typing-stop": () => void;
  userStatusChange: (data: { status: UserAvailabilityStatus }) => void;
  "call:invite": (
    { targetUserId }: { targetUserId: string },
    callback: (res: { success: boolean; conversation: Conversation }) => void
  ) => void;
  "call:accept": (
    {
      conversationId,
      targetUserId,
      from,
    }: {
      conversationId: string;
      from: string;
      targetUserId: string;
    },
    cb: (res: {
      isConversationActive: boolean;
      conversation: Conversation | null;
    }) => void
  ) => void;
  "call:decline": ({
    conversationId,
    userDeclined,
    userThatInvited,
  }: {
    conversationId: string;
    userDeclined: string;
    userThatInvited: string;
  }) => void;

  "leave-conversation": ({
    conversationId,
  }: {
    conversationId: string;
  }) => void;
  "chat:message": (chatMessage: ChatMessage) => void;
  "chat:startTyping": (data: TypingUser) => void;
  "chat:stopTyping": ({ userId }: { userId: string }) => void;
};

export interface TypingUser {
  userId: string;
  username: string;
  roomId: string;
  x: number;
  y: number;
}

interface SocketData {
  userId: string;
  userName: string;
}
export type SocketType = Socket<
  ClientToServer,
  ServerToClient,
  Record<string, never>,
  SocketData
>;
export type ServerType = Server<
  ClientToServer,
  ServerToClient,
  Record<string, never>,
  SocketData
>;
