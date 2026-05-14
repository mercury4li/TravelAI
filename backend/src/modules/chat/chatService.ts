import { ChatResponseSchema, type BookingIntent, type ChatResponse } from "../../schemas/domainSchemas.js";
import { notFound } from "../../shared/apiError.js";
import { nowIso } from "../../shared/time.js";
import type { InMemoryConversationRepositoryContract } from "../conversation/conversationRepository.js";
import type { TicketSearchService } from "../tickets/ticketSearchService.js";

const sourceSummary = "航班号与时刻展示来源链接；价格、余票和退改规则必须跳转票源实时核验。";

export class ChatService {
  constructor(
    private readonly conversationRepository: InMemoryConversationRepositoryContract,
    private readonly ticketSearchService: TicketSearchService
  ) {}

  async sendMessage(input: { anonymousUserId: string; conversationId: string; content: string }): Promise<ChatResponse> {
    const conversation = this.conversationRepository.findConversation(input.conversationId);
    if (!conversation || conversation.anonymousUserId !== input.anonymousUserId || conversation.status === "archived") {
      throw notFound("conversation not found");
    }

    this.conversationRepository.appendMessage(input.conversationId, {
      role: "user",
      content: input.content
    });

    if (shouldRefuseFabrication(input.content)) {
      const assistantMessage = {
        type: "no_result" as const,
        content: "我不能编造航班、价格或余票。可以帮你调整日期、机场或直飞限制后重新查询。",
        quickReplies: ["改成前后一天", "放宽直飞限制", "降低时间要求"]
      };
      const intent = createMockIntent(["verified_result"]);

      this.conversationRepository.appendMessage(input.conversationId, {
        role: "assistant",
        content: assistantMessage.content,
        quickReplies: assistantMessage.quickReplies
      });
      this.conversationRepository.updateConversationState(input.conversationId, {
        latestIntent: intent,
        latestCards: [],
        queryTime: nowIso(),
        sourceSummary
      });

      return ChatResponseSchema.parse({
        conversationId: input.conversationId,
        assistantMessage,
        intent,
        cards: [],
        queryTime: nowIso(),
        sourceSummary
      });
    }

    const intent = createMockIntent([]);
    const cards = await this.ticketSearchService.searchFlights({
      origin: "上海",
      destination: "东京",
      departDate: "2026-06-27",
      returnDate: "2026-07-01",
      adults: 2,
      directOnly: true,
      avoidRedEye: true
    });
    const queryTime = nowIso();
    const assistantMessage = {
      type: "result" as const,
      content: "我找到了 3 个可比较方案。综合推荐是不红眼直飞，返程时间也更完整；价格与余票以跳转后的实时来源为准。",
      quickReplies: ["只看更便宜", "不要成田", "返程再晚一点"]
    };

    this.conversationRepository.appendMessage(input.conversationId, {
      role: "assistant",
      content: assistantMessage.content,
      quickReplies: assistantMessage.quickReplies
    });
    this.conversationRepository.updateConversationState(input.conversationId, {
      latestIntent: intent,
      latestCards: cards,
      queryTime,
      sourceSummary,
      title: "上海 -> 东京 · 2 人"
    });

    return ChatResponseSchema.parse({
      conversationId: input.conversationId,
      assistantMessage,
      intent,
      cards,
      queryTime,
      sourceSummary
    });
  }
}

function shouldRefuseFabrication(content: string) {
  return ["编", "不存在", "随便编"].some((keyword) => content.includes(keyword));
}

function createMockIntent(missingFields: string[]): BookingIntent {
  return {
    mode: "flight",
    tripType: "round_trip",
    origin: "上海",
    destination: "东京",
    departDate: "2026-06-27",
    returnDate: "2026-07-01",
    adults: 2,
    preferences: {
      directOnly: true,
      avoidRedEye: true,
      priority: "balanced"
    },
    missingFields,
    confidence: missingFields.length > 0 ? 0.7 : 0.92
  };
}
