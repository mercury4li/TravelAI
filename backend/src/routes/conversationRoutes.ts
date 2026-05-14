import { Router } from "express";
import type { getConfig } from "../config.js";
import type { InMemoryConversationRepositoryContract } from "../modules/conversation/conversationRepository.js";
import type { AnonymousSessionService } from "../modules/session/anonymousSessionService.js";
import {
  ConversationParamsSchema,
  CreateConversationBodySchema,
  ListConversationsQuerySchema
} from "../schemas/apiSchemas.js";
import { notFound } from "../shared/apiError.js";
import { ensureSession } from "./sessionHelpers.js";

type Config = ReturnType<typeof getConfig>;

export default function conversationRoutes({
  config,
  conversationRepository,
  sessionService
}: {
  config: Config;
  conversationRepository: InMemoryConversationRepositoryContract;
  sessionService: AnonymousSessionService;
}) {
  const router = Router();

  router.post("/", (req, res) => {
    const session = ensureSession(req, res, config, sessionService);
    const body = CreateConversationBodySchema.parse(req.body);
    const conversation = conversationRepository.createConversation({
      anonymousUserId: session.anonymousUserId,
      title: body.title
    });

    res.status(201).json({
      conversationId: conversation.id,
      title: conversation.title,
      status: conversation.status,
      createdAt: conversation.createdAt
    });
  });

  router.get("/", (req, res) => {
    const session = ensureSession(req, res, config, sessionService);
    const query = ListConversationsQuerySchema.parse(req.query);
    const conversations = conversationRepository.listConversations(session.anonymousUserId, query.limit);

    res.json({
      items: conversations.map((conversation) => ({
        conversationId: conversation.id,
        title: conversation.title,
        status: conversation.status,
        lastMessage: conversation.messages.at(-1)?.content ?? null,
        updatedAt: conversation.updatedAt
      })),
      nextCursor: null
    });
  });

  router.get("/:conversationId", (req, res) => {
    const session = ensureSession(req, res, config, sessionService);
    const params = ConversationParamsSchema.parse(req.params);
    const conversation = conversationRepository.findConversation(params.conversationId);

    if (!conversation || conversation.anonymousUserId !== session.anonymousUserId || conversation.status === "archived") {
      throw notFound("conversation not found");
    }

    res.json({
      conversationId: conversation.id,
      title: conversation.title,
      status: conversation.status,
      messages: conversation.messages,
      latestIntent: conversation.latestIntent ?? null,
      latestCards: conversation.latestCards,
      queryTime: conversation.queryTime,
      sourceSummary: conversation.sourceSummary
    });
  });

  router.delete("/:conversationId", (req, res) => {
    const session = ensureSession(req, res, config, sessionService);
    const params = ConversationParamsSchema.parse(req.params);
    const archived = conversationRepository.archiveConversation(params.conversationId, session.anonymousUserId);

    if (!archived) {
      throw notFound("conversation not found");
    }

    res.json({ ok: true });
  });

  return router;
}
