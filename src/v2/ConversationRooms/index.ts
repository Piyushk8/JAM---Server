import { UUID } from "crypto";

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
class ConversationsManager {
  private conversations: Map<string, Conversation>;
  private static instance: ConversationsManager;
  constructor() {
    this.conversations = new Map();
  }

  public static getInstance() {
    if (!ConversationsManager.instance) {
      const instance = new ConversationsManager();
      ConversationsManager.instance = instance;
    }
    return ConversationsManager.instance;
  }

  public getConversation(conversationId: string) {
    return this.conversations.get(conversationId);
  }
  public deleteConversation(conversationId: string) {
    return this.conversations.delete(conversationId);
  }
  public createConversation({
    members,
    roomId,
    conversationId,
    creator,
    pending,
    createdAt,
    status,
  }: {
    pending: string[];
    members: string[];
    roomId: string;
    conversationId: UUID;
    creator: string;
    createdAt: number;
    status: "ongoing" | "pending" | "ended";
  }) {
    try {
      const conversation: Conversation = {
        members,
        roomId,
        creator,
        conversationId,
        pending,
        createdAt,
        status,
      };
      this.conversations.set(conversationId, conversation);
      return conversation
    } catch (error) {
      return;
    }
  }
}

export const conversationsManager = ConversationsManager.getInstance();
