import cookieParser from "cookie-parser";
import express from "express";
import { ChatService } from "./modules/chat/chatService.js";
import { InMemoryConversationRepository } from "./modules/conversation/inMemoryConversationRepository.js";
import { AnonymousSessionService } from "./modules/session/anonymousSessionService.js";
import { TicketSearchService } from "./modules/tickets/ticketSearchService.js";
import { MockProvider } from "./modules/tickets/providers/mockProvider.js";
import { getConfig } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import { requestLogger } from "./middleware/requestLogger.js";
import chatRoutes from "./routes/chatRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";

export function createApp() {
  const config = getConfig();
  const conversationRepository = new InMemoryConversationRepository();
  const sessionService = new AnonymousSessionService(conversationRepository);
  const ticketSearchService = new TicketSearchService(new MockProvider());
  const chatService = new ChatService(conversationRepository, ticketSearchService);

  const app = express();

  app.use(requestLogger);
  app.use(cookieParser());
  app.use(express.json());

  app.use("/api/health", healthRoutes);
  app.use("/api/session", sessionRoutes({ config, sessionService }));
  app.use("/api/conversations", conversationRoutes({ config, conversationRepository, sessionService }));
  app.use("/api/chat", chatRoutes({ config, chatService, sessionService }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
