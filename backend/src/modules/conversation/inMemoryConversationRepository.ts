import { createId } from "../../shared/ids.js";
import { nowIso } from "../../shared/time.js";
import { notFound } from "../../shared/apiError.js";
import type {
  AnonymousUser,
  Conversation,
  ConversationMessage,
  CreateConversationInput,
  InMemoryConversationRepositoryContract
} from "./conversationRepository.js";

export class InMemoryConversationRepository implements InMemoryConversationRepositoryContract {
  private readonly anonymousUsers = new Map<string, AnonymousUser>();
  private readonly conversations = new Map<string, Conversation>();

  findAnonymousUser(userId: string) {
    return this.anonymousUsers.get(userId);
  }

  createAnonymousUser() {
    const time = nowIso();
    const user: AnonymousUser = {
      id: createId(),
      createdAt: time,
      lastSeenAt: time
    };

    this.anonymousUsers.set(user.id, user);
    return user;
  }

  touchAnonymousUser(userId: string) {
    const user = this.anonymousUsers.get(userId);
    if (!user) return undefined;

    user.lastSeenAt = nowIso();
    return user;
  }

  createConversation(input: CreateConversationInput) {
    const time = nowIso();
    const conversation: Conversation = {
      id: createId(),
      anonymousUserId: input.anonymousUserId,
      title: input.title ?? "新的订票会话",
      status: "active",
      createdAt: time,
      updatedAt: time,
      messages: [],
      latestCards: []
    };

    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  listConversations(anonymousUserId: string, limit: number) {
    return [...this.conversations.values()]
      .filter((conversation) => conversation.anonymousUserId === anonymousUserId && conversation.status !== "archived")
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);
  }

  findConversation(conversationId: string) {
    return this.conversations.get(conversationId);
  }

  archiveConversation(conversationId: string, anonymousUserId: string) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || conversation.anonymousUserId !== anonymousUserId) {
      return false;
    }

    conversation.status = "archived";
    conversation.updatedAt = nowIso();
    return true;
  }

  appendMessage(conversationId: string, message: Omit<ConversationMessage, "id" | "createdAt">) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw notFound("conversation not found");
    }

    const nextMessage: ConversationMessage = {
      ...message,
      id: createId(),
      createdAt: nowIso()
    };

    conversation.messages.push(nextMessage);
    conversation.updatedAt = nextMessage.createdAt;
    return nextMessage;
  }

  updateConversationState(
    conversationId: string,
    state: Pick<Conversation, "latestIntent" | "latestCards"> & {
      queryTime?: string;
      sourceSummary?: string;
      title?: string;
    }
  ) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw notFound("conversation not found");
    }

    conversation.latestIntent = state.latestIntent;
    conversation.latestCards = state.latestCards;
    conversation.queryTime = state.queryTime;
    conversation.sourceSummary = state.sourceSummary;
    conversation.title = state.title ?? conversation.title;
    conversation.updatedAt = nowIso();
    return conversation;
  }
}
