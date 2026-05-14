import { z } from "zod";

export const AssistantMessageTypeSchema = z.enum(["clarification", "result", "no_result", "error"]);
export const MessageRoleSchema = z.enum(["user", "assistant"]);

export const AssistantMessageSchema = z.object({
  type: AssistantMessageTypeSchema,
  content: z.string().min(1),
  quickReplies: z.array(z.string().min(1)).default([])
});

export const BookingIntentSchema = z.object({
  mode: z.literal("flight"),
  tripType: z.enum(["one_way", "round_trip"]),
  origin: z.string().optional(),
  destination: z.string().optional(),
  departDate: z.string().optional(),
  returnDate: z.string().optional(),
  adults: z.number().int().min(1).max(9),
  cabinClass: z.enum(["economy", "business", "first"]).optional(),
  budgetPerPerson: z
    .object({
      amount: z.number().positive(),
      currency: z.string().min(1)
    })
    .optional(),
  preferences: z.object({
    directOnly: z.boolean().optional(),
    avoidRedEye: z.boolean().optional(),
    priority: z.enum(["cheap", "fast", "balanced"]).optional()
  }),
  missingFields: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1)
});

export const FlightSegmentSchema = z.object({
  direction: z.enum(["outbound", "return"]),
  carrierName: z.string().optional(),
  flightNumber: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  departAt: z.string().min(1),
  arriveAt: z.string().min(1),
  durationMinutes: z.number().int().positive().optional()
});

export const FlightCardSchema = z.object({
  id: z.string().min(1),
  label: z.enum(["cheapest", "fastest", "recommended"]),
  title: z.string().min(1),
  price: z
    .object({
      amount: z.number().positive(),
      currency: z.string().min(1)
    })
    .optional(),
  priceStatus: z.enum(["live", "cached", "unknown"]),
  availabilityStatus: z.enum(["available", "limited", "unknown"]),
  segments: z.array(FlightSegmentSchema).min(1),
  totalDurationMinutes: z.number().int().positive().optional(),
  transferCount: z.number().int().min(0),
  sourceUrl: z.string().url(),
  bookingUrl: z.string().url().optional(),
  recommendationReason: z.string().min(1),
  providerMeta: z.object({
    provider: z.enum(["mock", "flyai", "official_link"]),
    queryTime: z.string().min(1),
    sourceName: z.string().min(1),
    sourceUrl: z.string().url()
  })
});

export const ChatResponseSchema = z.object({
  conversationId: z.string().uuid(),
  assistantMessage: AssistantMessageSchema,
  intent: BookingIntentSchema,
  cards: z.array(FlightCardSchema),
  queryTime: z.string().optional(),
  sourceSummary: z.string().optional()
});

export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;
export type BookingIntent = z.infer<typeof BookingIntentSchema>;
export type FlightCard = z.infer<typeof FlightCardSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type MessageRole = z.infer<typeof MessageRoleSchema>;
