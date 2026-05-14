import { z } from "zod";

export const CreateConversationBodySchema = z
  .object({
    title: z.string().trim().min(1).max(80).optional()
  })
  .default({});

export const ConversationParamsSchema = z.object({
  conversationId: z.string().uuid()
});

export const ListConversationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional()
});

export const ChatBodySchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().trim().min(1).max(2000)
});
