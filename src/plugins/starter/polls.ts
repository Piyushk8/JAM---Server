import { randomUUID } from "crypto";
import type { JsonObject, JsonValue } from "../contracts";
import type { ServerRoomPlugin } from "../serverTypes";

type PollOption = {
  id: string;
  text: string;
  votes: string[];
};

type PollRecord = {
  id: string;
  question: string;
  status: "open" | "closed";
  createdBy: string;
  createdByName: string;
  createdAt: number;
  updatedAt: number;
  options: PollOption[];
};

type PollState = {
  poll: PollRecord | null;
};

type PollHistory = {
  polls: PollRecord[];
};

const defaultConfig = {
  maxOptions: 6,
  minOptions: 2,
  allowVoteChange: true,
  maxHistory: 10,
} satisfies JsonObject;

const emptyState: PollState = { poll: null };
const emptyHistory: PollHistory = { polls: [] };

const ensurePollState = (value: JsonValue): PollState => {
  if (value && typeof value === "object" && "poll" in value) {
    return value as PollState;
  }
  return emptyState;
};

const ensureHistory = (value: JsonValue): PollHistory => {
  if (value && typeof value === "object" && "polls" in value) {
    return value as PollHistory;
  }
  return emptyHistory;
};

export const pollsPlugin: ServerRoomPlugin = {
  manifest: {
    id: "polls",
    version: "1.0.0",
    displayName: "Poll Station",
    capabilities: ["panel", "interactable", "room-event"],
    defaultConfig,
    interactables: [
      {
        actionId: "open-panel",
        label: "Poll Station",
        description: "Run a live room poll.",
        icon: "bar-chart-3",
      },
    ],
    events: [
      { type: "poll.updated", description: "Live poll state changed." },
      { type: "poll.history", description: "Poll history changed." },
    ],
  },
  async handleAction(ctx, actionId, payload) {
    const config = ctx.getConfig<typeof defaultConfig>();
    const maxHistory = Number(config.maxHistory ?? 10);

    switch (actionId) {
      case "get-state":
        return ctx.getState("current", emptyState);

      case "get-history":
        return ctx.getState("history", emptyHistory);

      case "create-poll": {
        const submitted = (payload && typeof payload === "object" ? payload : {}) as {
          question?: string;
          options?: unknown[];
        };
        const question = submitted.question?.trim();
        const options = Array.isArray(submitted.options)
          ? submitted.options
              .map((option) => (typeof option === "string" ? option.trim() : ""))
              .filter(Boolean)
          : [];

        if (!question) throw new Error("Poll question is required");
        if (options.length < Number(config.minOptions ?? 2))
          throw new Error("At least two poll options are required");

        const nextPoll: PollState = {
          poll: {
            id: randomUUID(),
            question,
            status: "open",
            createdBy: ctx.userId,
            createdByName: ctx.username,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            options: options.slice(0, Number(config.maxOptions ?? 6)).map((text) => ({
              id: randomUUID(),
              text,
              votes: [],
            })),
          },
        };

        await ctx.setState("current", nextPoll as unknown as JsonValue);
        ctx.emitToRoom("poll.updated", nextPoll as unknown as JsonValue);
        return nextPoll as unknown as JsonValue;
      }

      case "vote": {
        const submitted = (payload && typeof payload === "object" ? payload : {}) as {
          optionId?: string;
        };
        if (!submitted.optionId) throw new Error("Poll option is required");

        const nextState = await ctx.patchState<PollState>(
          "current",
          emptyState,
          (current) => {
            const state = ensurePollState(current as unknown as JsonValue);
            if (!state.poll) throw new Error("No active poll found");
            if (state.poll.status !== "open") throw new Error("This poll is closed");

            const nextOptions = state.poll.options.map((option) => {
              const votes = config.allowVoteChange
                ? option.votes.filter((vote) => vote !== ctx.userId)
                : [...option.votes];
              if (option.id === submitted.optionId && !votes.includes(ctx.userId)) {
                votes.push(ctx.userId);
              }
              return { ...option, votes };
            });

            return {
              poll: { ...state.poll, updatedAt: Date.now(), options: nextOptions },
            };
          }
        );

        ctx.emitToRoom("poll.updated", nextState as unknown as JsonValue);
        return nextState as unknown as JsonValue;
      }

      case "close-poll": {
        // Move current poll to history, then close it
        const currentState = ensurePollState(
          await ctx.getState("current", emptyState)
        );

        if (currentState.poll && currentState.poll.status === "open") {
          const closedPoll: PollRecord = {
            ...currentState.poll,
            status: "closed",
            updatedAt: Date.now(),
          };

          // Add to history
          await ctx.patchState<PollHistory>(
            "history",
            emptyHistory,
            (current) => {
              const history = ensureHistory(current as unknown as JsonValue);
              return {
                polls: [closedPoll, ...history.polls].slice(0, maxHistory),
              };
            }
          );

          const nextState: PollState = { poll: closedPoll };
          await ctx.setState("current", nextState as unknown as JsonValue);
          ctx.emitToRoom("poll.updated", nextState as unknown as JsonValue);
          return nextState as unknown as JsonValue;
        }

        return currentState as unknown as JsonValue;
      }

      case "reset-poll": {
        const nextState = await ctx.patchState<PollState>(
          "current",
          emptyState,
          (current) => {
            const state = ensurePollState(current as unknown as JsonValue);
            if (!state.poll) return state;
            return {
              poll: {
                ...state.poll,
                status: "open",
                updatedAt: Date.now(),
                options: state.poll.options.map((option) => ({
                  ...option,
                  votes: [],
                })),
              },
            };
          }
        );

        ctx.emitToRoom("poll.updated", nextState as unknown as JsonValue);
        return nextState as unknown as JsonValue;
      }

      case "delete-poll": {
        await ctx.setState("current", emptyState as unknown as JsonValue);
        ctx.emitToRoom("poll.updated", emptyState as unknown as JsonValue);
        return emptyState as unknown as JsonValue;
      }

      case "clear-history": {
        await ctx.setState("history", emptyHistory as unknown as JsonValue);
        return emptyHistory as unknown as JsonValue;
      }

      default:
        throw new Error(`Unknown polls action: ${actionId}`);
    }
  },
};
