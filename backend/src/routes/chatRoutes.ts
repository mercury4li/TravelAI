import { Router } from "express";
import type { getConfig } from "../config.js";
import type { ChatService } from "../modules/chat/chatService.js";
import type { AnonymousSessionService } from "../modules/session/anonymousSessionService.js";
import { ChatBodySchema } from "../schemas/apiSchemas.js";
import { ensureSession } from "./sessionHelpers.js";

type Config = ReturnType<typeof getConfig>;

export default function chatRoutes({
  config,
  chatService,
  sessionService
}: {
  config: Config;
  chatService: ChatService;
  sessionService: AnonymousSessionService;
}) {
  const router = Router();

  router.post("/", async (req, res) => {
    const session = ensureSession(req, res, config, sessionService);
    const body = ChatBodySchema.parse(req.body);
    const response = await chatService.sendMessage({
      anonymousUserId: session.anonymousUserId,
      conversationId: body.conversationId,
      content: body.content
    });

    res.json(response);
  });

  return router;
}
