import { randomUUID } from "crypto";
import type { JsonObject, JsonValue } from "../contracts";
import type { ServerRoomPlugin } from "../serverTypes";

type StickyNote = {
  id: string;
  text: string;
  color: string;
  pinEmoji: string;
  authorId: string;
  authorName: string;
  updatedAt: number;
};

type StickyNotesState = {
  notes: StickyNote[];
};

const defaultConfig = {
  maxNotes: 32,
  maxNoteLength: 280,
  noteColors: ["#fef08a", "#bfdbfe", "#fecaca", "#bbf7d0", "#fde68a", "#e9d5ff"],
  pinEmojis: ["📌", "💡", "⭐", "🔥", "💬", "❓"],
} satisfies JsonObject;

const emptyBoard: StickyNotesState = { notes: [] };

const ensureBoard = (value: JsonValue): StickyNotesState => {
  if (value && typeof value === "object" && "notes" in value) {
    return value as StickyNotesState;
  }
  return emptyBoard;
};

export const stickyNotesPlugin: ServerRoomPlugin = {
  manifest: {
    id: "sticky-notes",
    version: "1.0.0",
    displayName: "Sticky Notes",
    capabilities: ["panel", "interactable", "room-event"],
    defaultConfig,
    interactables: [
      {
        actionId: "open-board",
        label: "Notes Wall",
        description: "Capture ideas with shared sticky notes.",
        icon: "sticky-note",
      },
    ],
    events: [
      { type: "notes.updated", description: "Sticky notes board changed." },
    ],
  },
  async handleAction(ctx, actionId, payload) {
    const config = ctx.getConfig<typeof defaultConfig>();
    const maxLen = Number(config.maxNoteLength ?? 280);

    switch (actionId) {
      case "get-board":
        return ctx.getState("board", emptyBoard);

      case "add-note": {
        const submitted = (payload && typeof payload === "object" ? payload : {}) as {
          text?: string;
          color?: string;
          pinEmoji?: string;
        };
        let text = submitted.text?.trim() ?? "";
        if (!text) throw new Error("Note text is required");
        if (text.length > maxLen) text = text.slice(0, maxLen);

        const nextBoard = await ctx.patchState<StickyNotesState>(
          "board",
          emptyBoard,
          (current) => {
            const board = ensureBoard(current as unknown as JsonValue);
            if (board.notes.length >= Number(config.maxNotes ?? 32)) {
              throw new Error("This board is full");
            }

            const color =
              typeof submitted.color === "string" &&
              (config.noteColors as string[]).includes(submitted.color)
                ? submitted.color
                : (config.noteColors?.[0] as string) ?? "#fef08a";

            const pinEmoji =
              typeof submitted.pinEmoji === "string" &&
              (config.pinEmojis as string[]).includes(submitted.pinEmoji)
                ? submitted.pinEmoji
                : "📌";

            return {
              notes: [
                {
                  id: randomUUID(),
                  text,
                  color,
                  pinEmoji,
                  authorId: ctx.userId,
                  authorName: ctx.username,
                  updatedAt: Date.now(),
                },
                ...board.notes,
              ],
            };
          }
        );

        ctx.emitToRoom("notes.updated", nextBoard as unknown as JsonValue);
        return nextBoard as unknown as JsonValue;
      }

      case "update-note": {
        const submitted = (payload && typeof payload === "object" ? payload : {}) as {
          id?: string;
          text?: string;
          color?: string;
          pinEmoji?: string;
        };
        if (!submitted.id) throw new Error("Note id is required");

        const nextBoard = await ctx.patchState<StickyNotesState>(
          "board",
          emptyBoard,
          (current) => {
            const board = ensureBoard(current as unknown as JsonValue);
            return {
              notes: board.notes.map((note) => {
                if (note.id !== submitted.id) return note;
                let newText = note.text;
                if (typeof submitted.text === "string" && submitted.text.trim()) {
                  newText = submitted.text.trim().slice(0, maxLen);
                }
                return {
                  ...note,
                  text: newText,
                  color: typeof submitted.color === "string" && submitted.color ? submitted.color : note.color,
                  pinEmoji: typeof submitted.pinEmoji === "string" && submitted.pinEmoji ? submitted.pinEmoji : note.pinEmoji,
                  updatedAt: Date.now(),
                };
              }),
            };
          }
        );

        ctx.emitToRoom("notes.updated", nextBoard as unknown as JsonValue);
        return nextBoard as unknown as JsonValue;
      }

      case "delete-note": {
        const submitted = (payload && typeof payload === "object" ? payload : {}) as { id?: string };
        if (!submitted.id) throw new Error("Note id is required");

        const nextBoard = await ctx.patchState<StickyNotesState>(
          "board",
          emptyBoard,
          (current) => {
            const board = ensureBoard(current as unknown as JsonValue);
            return { notes: board.notes.filter((note) => note.id !== submitted.id) };
          }
        );

        ctx.emitToRoom("notes.updated", nextBoard as unknown as JsonValue);
        return nextBoard as unknown as JsonValue;
      }

      default:
        throw new Error(`Unknown sticky-notes action: ${actionId}`);
    }
  },
};
