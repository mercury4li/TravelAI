import type { BookingIntent, FlightCard, MessageRole } from "../../schemas/domainSchemas.js";

export type ConversationStatus = "active" | "archived";

export interface AnonymousUser {
  id: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  quickReplies?: string[];
}

export interface Conversation {
  id: string;
  anonymousUserId: string;
  title: string;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
  latestIntent?: BookingIntent;
  latestCards: FlightCard[];
  queryTime?: string;
  sourceSummary?: string;
}

export interface CreateConversationInput {
  anonymousUserId: string;
  title?: string;
}

export interface InMemoryConversationRepositoryContract {
  findAnonymousUser(userId: string): AnonymousUser | undefined;
  createAnonymousUser(): AnonymousUser;
  touchAnonymousUser(userId: string): AnonymousUser | undefined;
  createConversation(input: CreateConversationInput): Conversation;
  listConversations(anonymousUserId: string, limit: number): Conversation[];
  findConversation(conversationId: string): Conversation | undefined;
  archiveConversation(conversationId: string, anonymousUserId: string): boolean;
  appendMessage(
    conversationId: string,
    message: Omit<ConversationMessage, "id" | "createdAt">
  ): ConversationMessage;
  updateConversationState(
    conversationId: string,
    state: Pick<Conversation, "latestIntent" | "latestCards"> & {
      queryTime?: string;
      sourceSummary?: string;
      title?: string;
    }
  ): Conversation;
}
