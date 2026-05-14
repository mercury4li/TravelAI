import type { FlightCard } from "../../../schemas/domainSchemas.js";

export interface FlightSearchInput {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  directOnly?: boolean;
  avoidRedEye?: boolean;
}

export interface TicketProvider {
  searchFlights(input: FlightSearchInput): Promise<FlightCard[]>;
}
