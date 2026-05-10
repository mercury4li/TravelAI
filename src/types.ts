export type AssistantMessageType = "clarification" | "result" | "no_result" | "error";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  quickReplies?: string[];
}

export interface BookingIntent {
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  adults: number;
  budget: string;
  preference: string;
  directOnly: boolean;
  avoidRedEye: boolean;
  ticketStatus: string;
}

export interface FlightSegment {
  direction: "outbound" | "return";
  dateLabel: string;
  flightNumber: string;
  originAirport: string;
  destinationAirport: string;
  departTime: string;
  arriveTime: string;
}

export interface FlightCard {
  id: string;
  label: "cheapest" | "fastest" | "recommended";
  labelText: string;
  title: string;
  price: string;
  priceStatus: "live" | "cached" | "unknown";
  availabilityStatus: "available" | "limited" | "unknown";
  segments: FlightSegment[];
  reason: string;
  sourceLabel: string;
  sourceUrl: string;
  bookingUrl: string;
  highlighted?: boolean;
}

export interface MvpState {
  taskTitle: string;
  taskSubtitle: string;
  statusText: string;
  messages: ChatMessage[];
  intent: BookingIntent;
  cards: FlightCard[];
  queryTime: string;
  sourceSummary: string;
}
