import { FlightCardSchema } from "../../schemas/domainSchemas.js";
import type { FlightCard } from "../../schemas/domainSchemas.js";
import { rankFlightCards } from "./ranker.js";
import type { FlightSearchInput, TicketProvider } from "./providers/ticketProvider.js";

export class TicketSearchService {
  constructor(private readonly provider: TicketProvider) {}

  async searchFlights(input: FlightSearchInput): Promise<FlightCard[]> {
    const cards = await this.provider.searchFlights(input);
    return rankFlightCards(cards).map((card) => FlightCardSchema.parse(card));
  }
}
