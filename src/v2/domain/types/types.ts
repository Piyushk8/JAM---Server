import { Socket } from "socket.io";

export interface Conversation {
  roomId: string;
  members: string[];
  pending: string[];
  // type:"audio"| "video",
  conversationId: string;
  creator: string;
  createdAt: number;
  status: "ongoing" | "pending" | "ended";
}
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

export interface Room {
  id: string;
  users: Map<string, User>;
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


export interface JoinRoomResponse {
  user: {
    userName: string;
    userId: string;
    sprite: SpriteNames;
    availability: UserAvailabilityStatus;
  };
  room: {
    roomId: string;
  };
}



export interface TypingUser {
  userId: string;
  username: string;
  roomId: string;
  x: number;
  y: number;
}
