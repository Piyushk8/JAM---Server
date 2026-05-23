import type { Router } from "express";
import type { Logger } from "pino";
import type { SocketType, ServerType, UserRole } from "../types/type";
import type {
  JsonObject,
  JsonValue,
  PluginManifest,
  RoomPluginConfig,
} from "./contracts";

export interface PluginContext {
  io: ServerType;
  socket: SocketType;
  roomId: string;
  userId: string;
  username: string;
  userRole: UserRole;
  roomPlugin: RoomPluginConfig;
  logger: Logger;
  getConfig<T extends JsonObject = JsonObject>(): T;
  getState<T extends JsonValue>(key: string, fallback: T): Promise<T>;
  setState(key: string, value: JsonValue): Promise<void>;
  patchState<T extends JsonObject>(
    key: string,
    fallback: T,
    updater: (current: T) => T
  ): Promise<T>;
  emitToRoom(eventType: string, payload?: JsonValue): void;
  emitToUser(userId: string, eventType: string, payload?: JsonValue): void;
}

export interface PluginRouteHelpers {
  getState<T extends JsonValue>(
    roomId: string,
    pluginId: string,
    key: string,
    fallback: T
  ): Promise<T>;
  setState(roomId: string, pluginId: string, key: string, value: JsonValue): Promise<void>;
  emitToRoom(
    roomId: string,
    pluginId: string,
    eventType: string,
    payload?: JsonValue
  ): void;
}

export interface ServerRoomPlugin {
  manifest: PluginManifest;
  registerRoutes?: (router: Router, helpers: PluginRouteHelpers) => void;
  handleAction?: (
    ctx: PluginContext,
    actionId: string,
    payload?: JsonValue
  ) => Promise<JsonValue> | JsonValue;
  onRoomJoin?: (ctx: PluginContext) => Promise<void> | void;
  onRoomLeave?: (ctx: PluginContext) => Promise<void> | void;
}
