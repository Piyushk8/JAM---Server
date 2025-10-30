import { Server, Socket } from "socket.io";
import {
  ChatMessage,
  Conversation,
  ConversationUpdatePayload,
  JoinRoomResponse,
  RoomSyncPayload,
  SpriteNames,
  User,
  UserAvailabilityStatus,
} from "./types";

export type ClientToServerEvents = {
  "join-room": (
    data: { roomId?: string; roomName?: string; sprite: SpriteNames },
    cb: (res: { success: boolean; data?: JoinRoomResponse }) => void
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
  // "send-message": (data: { message: string; type: "text" | "emoji" }) => void;
  "typing-start": () => void;
  "typing-stop": () => void;
  "call:invite": (
    { targetUserId }: { targetUserId: string },
    callback: (res: { success: boolean; conversation: Conversation }) => void
  ) => void;
  userStatusChange: (data: { status: UserAvailabilityStatus }) => void;
  "call:accept": (
    {
      conversationId,
      targetUserId,
      from,
    }: {
      conversationId: string;
      targetUserId: string;
      from: string;
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
  "chat:startTyping": ({
    userId,
    username,
  }: {
    userId: string;
    username: string;
  }) => void;
  "chat:stopTyping": ({ userId }: { userId: string }) => void;
};
export type ServerToClientEvents = {
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
  "chat:startTyping": ({
    userId,
    username,
  }: {
    userId: string;
    username: string;
  }) => void;
  "chat:stopTyping": ({ userId }: { userId: string }) => void;
};

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  username: string;
  sprite: SpriteNames;
}

export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
