import type { JsonObject, JsonValue } from "../contracts";
import type { ServerRoomPlugin } from "../serverTypes";

type Track = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
};

type JukeboxState = {
  currentTrackId: string | null;
  isPlaying: boolean;
  volume: number;
  updatedBy: string | null;
  updatedByName: string | null;
  listeners: number;
};

const defaultConfig = {
  tracks: [
    { id: "focus", title: "Lo-fi Focus", subtitle: "Quiet beats for heads-down work", color: "#6366f1" },
    { id: "sunrise", title: "Morning Energy", subtitle: "Bright room opener", color: "#f59e0b" },
    { id: "retro", title: "Retro Sync", subtitle: "Playful synth office vibe", color: "#ec4899" },
    { id: "afterhours", title: "After Hours", subtitle: "Slow wind-down groove", color: "#8b5cf6" },
    { id: "nature", title: "Nature Ambient", subtitle: "Forest and rain sounds", color: "#10b981" },
  ],
  defaultVolume: 60,
} satisfies JsonObject;

const emptyState: JukeboxState = {
  currentTrackId: "focus",
  isPlaying: false,
  volume: 60,
  updatedBy: null,
  updatedByName: null,
  listeners: 0,
};

const ensureState = (value: JsonValue): JukeboxState => {
  if (
    value &&
    typeof value === "object" &&
    "currentTrackId" in value &&
    "isPlaying" in value
  ) {
    return value as JukeboxState;
  }
  return emptyState;
};

export const jukeboxPlugin: ServerRoomPlugin = {
  manifest: {
    id: "jukebox",
    version: "1.0.0",
    displayName: "Jukebox",
    capabilities: ["panel", "overlay", "room-event"],
    defaultConfig,
    interactables: [
      {
        actionId: "open-player",
        label: "Jukebox",
        description: "Set the room soundtrack.",
        icon: "music-2",
      },
    ],
    events: [
      { type: "jukebox.updated", description: "Room soundtrack changed." },
    ],
  },

  async onRoomJoin(ctx) {
    const config = ctx.getConfig<typeof defaultConfig>();
    const tracks = (config.tracks ?? defaultConfig.tracks) as Track[];
    await ctx.patchState<JukeboxState>(
      "player",
      { ...emptyState, volume: Number(config.defaultVolume ?? 60) },
      (current) => {
        const state = ensureState(current as unknown as JsonValue);
        return { ...state, listeners: Math.max(0, (state.listeners ?? 0) + 1) };
      }
    );
    // Emit updated state
    const state = ensureState(await ctx.getState("player", emptyState));
    ctx.emitToRoom("jukebox.updated", { ...state, tracks } as unknown as JsonValue);
  },

  async onRoomLeave(ctx) {
    const config = ctx.getConfig<typeof defaultConfig>();
    const tracks = (config.tracks ?? defaultConfig.tracks) as Track[];
    await ctx.patchState<JukeboxState>(
      "player",
      { ...emptyState, volume: Number(config.defaultVolume ?? 60) },
      (current) => {
        const state = ensureState(current as unknown as JsonValue);
        return { ...state, listeners: Math.max(0, (state.listeners ?? 0) - 1) };
      }
    );
    const state = ensureState(await ctx.getState("player", emptyState));
    ctx.emitToRoom("jukebox.updated", { ...state, tracks } as unknown as JsonValue);
  },

  async handleAction(ctx, actionId, payload) {
    const config = ctx.getConfig<typeof defaultConfig>();
    const tracks = (config.tracks ?? defaultConfig.tracks) as Track[];

    switch (actionId) {
      case "get-state": {
        const state = await ctx.getState("player", {
          ...emptyState,
          volume: Number(config.defaultVolume ?? 60),
        });
        return { ...ensureState(state), tracks };
      }
      case "set-track": {
        const submitted = (payload && typeof payload === "object" ? payload : {}) as {
          trackId?: string;
        };
        if (!submitted.trackId || !tracks.find((t) => t.id === submitted.trackId)) {
          throw new Error("Unknown room track");
        }

        const nextState = await ctx.patchState<JukeboxState>(
          "player",
          { ...emptyState, volume: Number(config.defaultVolume ?? 60) },
          (current) => ({
            ...ensureState(current as unknown as JsonValue),
            currentTrackId: submitted.trackId!,
            isPlaying: true,
            updatedBy: ctx.userId,
            updatedByName: ctx.username,
          })
        );

        const out = { ...nextState, tracks };
        ctx.emitToRoom("jukebox.updated", out as unknown as JsonValue);
        return out as unknown as JsonValue;
      }
      case "toggle-play": {
        const nextState = await ctx.patchState<JukeboxState>(
          "player",
          { ...emptyState, volume: Number(config.defaultVolume ?? 60) },
          (current) => {
            const state = ensureState(current as unknown as JsonValue);
            return {
              ...state,
              isPlaying: !state.isPlaying,
              updatedBy: ctx.userId,
              updatedByName: ctx.username,
            };
          }
        );

        const out = { ...nextState, tracks };
        ctx.emitToRoom("jukebox.updated", out as unknown as JsonValue);
        return out as unknown as JsonValue;
      }
      case "set-volume": {
        const submitted = (payload && typeof payload === "object" ? payload : {}) as {
          volume?: number;
        };
        const requestedVolume = typeof submitted.volume === "number" ? submitted.volume : 60;

        const nextState = await ctx.patchState<JukeboxState>(
          "player",
          { ...emptyState, volume: Number(config.defaultVolume ?? 60) },
          (current) => {
            const state = ensureState(current as unknown as JsonValue);
            return {
              ...state,
              volume: Math.max(0, Math.min(100, Math.round(requestedVolume))),
              updatedBy: ctx.userId,
              updatedByName: ctx.username,
            };
          }
        );

        const out = { ...nextState, tracks };
        ctx.emitToRoom("jukebox.updated", out as unknown as JsonValue);
        return out as unknown as JsonValue;
      }
      default:
        throw new Error(`Unknown jukebox action: ${actionId}`);
    }
  },
};
