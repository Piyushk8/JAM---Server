import { randomUUID } from "crypto";
import type { JsonObject, JsonValue } from "../contracts";
import type { ServerRoomPlugin } from "../serverTypes";

type ReactionTrending = {
  counts: Record<string, number>;
  windowStart: number;
};

const defaultConfig = {
  allowedReactions: [
    { id: "spark", emoji: "✨", label: "Spark" },
    { id: "fire", emoji: "🔥", label: "Fire" },
    { id: "clap", emoji: "👏", label: "Applause" },
    { id: "rocket", emoji: "🚀", label: "Launch" },
    { id: "party", emoji: "🎉", label: "Celebrate" },
    { id: "hand", emoji: "✋", label: "Raised hand" },
    { id: "heart", emoji: "❤️", label: "Love" },
    { id: "mindblown", emoji: "🤯", label: "Mind blown" },
  ],
} satisfies JsonObject;

const TRENDING_WINDOW_MS = 60_000;

const emptyTrending: ReactionTrending = { counts: {}, windowStart: Date.now() };

const ensureTrending = (value: JsonValue): ReactionTrending => {
  if (value && typeof value === "object" && "counts" in value) {
    const t = value as ReactionTrending;
    if (Date.now() - t.windowStart > TRENDING_WINDOW_MS) {
      return { counts: {}, windowStart: Date.now() };
    }
    return t;
  }
  return { counts: {}, windowStart: Date.now() };
};

export const reactionsPlugin: ServerRoomPlugin = {
  manifest: {
    id: "reactions",
    version: "1.0.0",
    displayName: "Reactions",
    capabilities: ["panel", "overlay", "interactable", "room-event"],
    defaultConfig,
    interactables: [
      {
        actionId: "open-tray",
        label: "Reaction Bar",
        description: "Launch a quick room reaction.",
        icon: "smile-plus",
      },
    ],
    events: [
      {
        type: "reaction.sent",
        description: "Broadcast a room reaction.",
      },
      {
        type: "reaction.burst",
        description: "Burst of rapid reactions.",
      },
    ],
  },
  async handleAction(ctx, actionId, payload) {
    const config = ctx.getConfig<typeof defaultConfig>();

    switch (actionId) {
      case "get-state": {
        const trending = ensureTrending(
          await ctx.getState("trending", emptyTrending)
        );
        return { ...config, trending: trending.counts };
      }
      case "send-reaction": {
        const submitted =
          payload && typeof payload === "object" && !Array.isArray(payload)
            ? (payload as Record<string, unknown>)
            : {};
        const emoji =
          typeof submitted.emoji === "string" && submitted.emoji.trim()
            ? submitted.emoji.trim()
            : null;
        const label =
          typeof submitted.label === "string" && submitted.label.trim()
            ? submitted.label.trim()
            : "Reaction";
        const burst = submitted.burst === true;

        if (!emoji) {
          throw new Error("Reaction emoji is required");
        }

        const burstCount = burst ? 5 : 1;

        // Update trending counts
        const updatedTrending = await ctx.patchState<ReactionTrending>(
          "trending",
          emptyTrending,
          (current) => {
            const trending = ensureTrending(current as unknown as JsonValue);
            const key = emoji;
            trending.counts[key] = (trending.counts[key] ?? 0) + burstCount;
            return trending;
          }
        );

        const reactionEvent = {
          id: randomUUID(),
          emoji,
          label,
          senderId: ctx.userId,
          senderName: ctx.username,
          burst,
          burstCount,
          trending: (updatedTrending as ReactionTrending).counts,
        };

        const eventType = burst ? "reaction.burst" : "reaction.sent";
        ctx.emitToRoom(eventType, reactionEvent);
        return reactionEvent;
      }
      case "get-trending": {
        const trending = ensureTrending(
          await ctx.getState("trending", emptyTrending)
        );
        return trending.counts;
      }
      default:
        throw new Error(`Unknown reactions action: ${actionId}`);
    }
  },
};
