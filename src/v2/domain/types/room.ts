import { User } from "./types";

export type RoomRuntimeState = {
  id: string;
  users: Map<string, User>;
  proximity: Map<string, Set<string>>;
};

export type AwayUsers = { userId: string; roomId: string; awaySince: number };
