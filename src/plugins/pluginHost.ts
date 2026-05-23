import { Router } from "express";
import { and, eq } from "drizzle-orm";
import logger from "../lib/logger";
import { PluginState, RoomPlugins } from "../db/schema";
import { db } from "../db/init";
import roomManager from "../RoomManager/roomManager";
import type { ServerType, SocketType } from "../types/type";
import type {
  JsonObject,
  JsonValue,
  PluginActionRequest,
  PluginActionResponse,
  PluginEventEnvelope,
  RoomPluginConfig,
} from "./contracts";
import { getInstalledPluginById, getInstalledPluginManifests, installedPlugins, validateInstalledPlugins } from "./registry";
import type { PluginContext, PluginRouteHelpers } from "./serverTypes";

type RateLimitEntry = {
  count: number;
  windowStartedAt: number;
};

class PluginHost {
  private io: ServerType | null = null;
  private readonly router: Router;
  private readonly rateLimitWindowMs = 2_000;
  private readonly rateLimitCount = 12;
  private readonly rateLimitState = new Map<string, RateLimitEntry>();

  constructor() {
    validateInstalledPlugins();
    this.router = Router();
    this.mountRoutes();
  }

  public setIO(io: ServerType): void {
    this.io = io;
  }

  public getRouter(): Router {
    return this.router;
  }

  public registerSocketHandlers(socket: SocketType): void {
    socket.on(
      "plugin:dispatch",
      async (
        request: PluginActionRequest,
        cb: (response: PluginActionResponse) => void
      ) => {
        const response = await this.dispatch(socket, request);
        cb(response);
      }
    );
  }

  public async ensureRoomPlugins(roomId: string): Promise<void> {
    const existing = await db
      .select()
      .from(RoomPlugins)
      .where(eq(RoomPlugins.roomId, roomId));

    const existingIds = new Set(existing.map((row) => row.pluginId));
    const missing = installedPlugins.filter(
      (plugin) => !existingIds.has(plugin.manifest.id)
    );

    if (missing.length === 0) {
      return;
    }

    await db.insert(RoomPlugins).values(
      missing.map((plugin) => ({
        roomId,
        pluginId: plugin.manifest.id,
        enabled: true,
        configJson: plugin.manifest.defaultConfig,
      }))
    );
  }

  public async getActivePluginsForRoom(
    roomId: string
  ): Promise<RoomPluginConfig[]> {
    await this.ensureRoomPlugins(roomId);

    const rows = await db
      .select()
      .from(RoomPlugins)
      .where(eq(RoomPlugins.roomId, roomId));

    return rows
      .filter((row) => row.enabled)
      .map((row) => {
        const plugin = getInstalledPluginById(row.pluginId);
        if (!plugin) {
          return null;
        }

        return {
          pluginId: row.pluginId,
          enabled: row.enabled,
          config:
            (row.configJson as JsonObject | null) ??
            plugin.manifest.defaultConfig,
          manifest: plugin.manifest,
        } satisfies RoomPluginConfig;
      })
      .filter((row): row is RoomPluginConfig => Boolean(row));
  }

  public async onRoomJoin(socket: SocketType): Promise<void> {
    const user = roomManager.getUser(socket.data.userId);
    if (!user) {
      return;
    }

    const roomPlugins = await this.getActivePluginsForRoom(user.roomId);

    for (const roomPlugin of roomPlugins) {
      const plugin = getInstalledPluginById(roomPlugin.pluginId);
      if (!plugin?.onRoomJoin) {
        continue;
      }

      const ctx = this.buildContext(socket, user.roomId, roomPlugin);
      await plugin.onRoomJoin(ctx);
    }
  }

  public async onRoomLeave(socket: SocketType): Promise<void> {
    const user = roomManager.getUser(socket.data.userId);
    if (!user) {
      return;
    }

    const roomPlugins = await this.getActivePluginsForRoom(user.roomId);

    for (const roomPlugin of roomPlugins) {
      const plugin = getInstalledPluginById(roomPlugin.pluginId);
      if (!plugin?.onRoomLeave) {
        continue;
      }

      const ctx = this.buildContext(socket, user.roomId, roomPlugin);
      await plugin.onRoomLeave(ctx);
    }
  }

  public async getState<T extends JsonValue>(
    roomId: string,
    pluginId: string,
    key: string,
    fallback: T
  ): Promise<T> {
    const existing = await db.query.PluginState.findFirst({
      where: and(
        eq(PluginState.roomId, roomId),
        eq(PluginState.pluginId, pluginId),
        eq(PluginState.stateKey, key)
      ),
    });

    if (!existing?.stateJson) {
      return fallback;
    }

    return existing.stateJson as T;
  }

  public async setState(
    roomId: string,
    pluginId: string,
    key: string,
    value: JsonValue
  ): Promise<void> {
    const existing = await db.query.PluginState.findFirst({
      where: and(
        eq(PluginState.roomId, roomId),
        eq(PluginState.pluginId, pluginId),
        eq(PluginState.stateKey, key)
      ),
    });

    if (existing) {
      await db
        .update(PluginState)
        .set({
          stateJson: value as any,
          updatedAt: new Date(),
        })
        .where(eq(PluginState.id, existing.id));
      return;
    }

    await db.insert(PluginState).values({
      roomId,
      pluginId,
      stateKey: key,
      stateJson: value as any,
    });
  }

  public emitToRoom(
    roomId: string,
    pluginId: string,
    eventType: string,
    payload?: JsonValue
  ): void {
    if (!this.io) {
      return;
    }

    const event: PluginEventEnvelope = {
      pluginId,
      eventType,
      roomId,
      payload,
      ts: Date.now(),
    };

    this.io.to(roomId).emit("plugin:event", event);
  }

  private mountRoutes(): void {
    this.router.get("/", (_req, res) => {
      res.json({
        success: true,
        data: getInstalledPluginManifests(),
      });
    });

    const routeHelpers: PluginRouteHelpers = {
      getState: (roomId, pluginId, key, fallback) =>
        this.getState(roomId, pluginId, key, fallback),
      setState: (roomId, pluginId, key, value) =>
        this.setState(roomId, pluginId, key, value),
      emitToRoom: (roomId, pluginId, eventType, payload) =>
        this.emitToRoom(roomId, pluginId, eventType, payload),
    };

    installedPlugins.forEach((plugin) => {
      if (!plugin.registerRoutes) {
        return;
      }

      const pluginRouter = Router();
      plugin.registerRoutes(pluginRouter, routeHelpers);
      this.router.use(`/${plugin.manifest.id}`, pluginRouter);
    });
  }

  private async dispatch(
    socket: SocketType,
    request: PluginActionRequest
  ): Promise<PluginActionResponse> {
    if (!request?.pluginId || !request?.actionId) {
      return {
        ok: false,
        error: "pluginId and actionId are required",
      };
    }

    const user = roomManager.getUser(socket.data.userId);
    if (!user) {
      return {
        ok: false,
        error: "User is not connected to a room",
      };
    }

    const roomPlugins = await this.getActivePluginsForRoom(user.roomId);
    const roomPlugin = roomPlugins.find(
      (plugin) => plugin.pluginId === request.pluginId
    );

    if (!roomPlugin) {
      return {
        ok: false,
        error: "This plugin is not enabled for the room",
      };
    }

    const plugin = getInstalledPluginById(request.pluginId);
    if (!plugin?.handleAction) {
      return {
        ok: false,
        error: "Plugin action handler is unavailable",
      };
    }

    if (!this.consumeRateLimit(user.roomId, request.pluginId, request.actionId)) {
      return {
        ok: false,
        error: "Too many plugin actions. Please slow down.",
      };
    }

    try {
      const ctx = this.buildContext(socket, user.roomId, roomPlugin);
      const data = await plugin.handleAction(ctx, request.actionId, request.payload);
      return {
        ok: true,
        data,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Plugin action failed";

      socket.data.log?.error(
        { err: error, pluginId: request.pluginId, actionId: request.actionId },
        "plugin action failed"
      );

      return {
        ok: false,
        error: message,
      };
    }
  }

  private buildContext(
    socket: SocketType,
    roomId: string,
    roomPlugin: RoomPluginConfig
  ): PluginContext {
    if (!this.io) {
      throw new Error("Plugin host is not attached to socket server");
    }

    const loggerInstance =
      socket.data.log?.child({
        pluginId: roomPlugin.pluginId,
        roomId,
      }) ??
      logger.child({
        pluginId: roomPlugin.pluginId,
        roomId,
      });

    return {
      io: this.io,
      socket,
      roomId,
      userId: socket.data.userId,
      username: socket.data.username ?? "Guest",
      userRole: roomManager.getUser(socket.data.userId)?.role ?? "member",
      roomPlugin,
      logger: loggerInstance,
      getConfig: <T extends JsonObject>() => roomPlugin.config as T,
      getState: <T extends JsonValue>(key: string, fallback: T) =>
        this.getState(roomId, roomPlugin.pluginId, key, fallback),
      setState: (key: string, value: JsonValue) =>
        this.setState(roomId, roomPlugin.pluginId, key, value),
      patchState: async <T extends JsonObject>(
        key: string,
        fallback: T,
        updater: (current: T) => T
      ) => {
        const current = await this.getState(roomId, roomPlugin.pluginId, key, fallback);
        const next = updater(current as T);
        await this.setState(roomId, roomPlugin.pluginId, key, next);
        return next;
      },
      emitToRoom: (eventType: string, payload?: JsonValue) =>
        this.emitToRoom(roomId, roomPlugin.pluginId, eventType, payload),
      emitToUser: (userId: string, eventType: string, payload?: JsonValue) => {
        const targetUser = roomManager.getUser(userId);
        if (!targetUser || targetUser.roomId !== roomId || !this.io) {
          return;
        }

        this.io.to(targetUser.socketId).emit("plugin:event", {
          pluginId: roomPlugin.pluginId,
          eventType,
          roomId,
          payload,
          ts: Date.now(),
        });
      },
    };
  }

  private consumeRateLimit(
    roomId: string,
    pluginId: string,
    actionId: string
  ): boolean {
    const key = `${roomId}:${pluginId}:${actionId}`;
    const now = Date.now();
    const current = this.rateLimitState.get(key);

    if (!current || now - current.windowStartedAt > this.rateLimitWindowMs) {
      this.rateLimitState.set(key, {
        count: 1,
        windowStartedAt: now,
      });
      return true;
    }

    if (current.count >= this.rateLimitCount) {
      return false;
    }

    current.count += 1;
    this.rateLimitState.set(key, current);
    return true;
  }
}

export const pluginHost = new PluginHost();
