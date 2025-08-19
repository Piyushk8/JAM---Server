import { UUID } from "crypto";

interface Conversation {
  roomId: string;
  members: string[];
  pending: string[];
  // type:"audio"| "video",
  conversationId: string;
  creator: string;
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
  }: {
    pending: string[];
    members: string[];
    roomId: string;
    conversationId: UUID;
    creator: string;
  }) {
    try {
      const conversation: Conversation = {
        members,
        roomId,
        creator,
        conversationId,
        pending,
      };
      this.conversations.set(conversationId, conversation);
    } catch (error) {
        return 
    }
  }
}

export const conversationsManager = ConversationsManager.getInstance();
