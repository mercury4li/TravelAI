import { describe, expect, it } from "vitest";
import { rankFlightCards } from "../modules/tickets/ranker.js";
import { MockProvider } from "../modules/tickets/providers/mockProvider.js";

describe("ticket mock and ranker", () => {
  it("returns mock cards with source links", async () => {
    const cards = await new MockProvider().searchFlights({
      origin: "上海",
      destination: "东京",
      departDate: "2026-06-27",
      returnDate: "2026-07-01",
      adults: 2
    });

    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((card) => card.sourceUrl && card.providerMeta.sourceUrl)).toBe(true);
  });

  it("ranks cheapest, fastest, and recommended cards", async () => {
    const cards = await new MockProvider().searchFlights({
      origin: "上海",
      destination: "东京",
      departDate: "2026-06-27",
      returnDate: "2026-07-01",
      adults: 2
    });

    const ranked = rankFlightCards(cards);

    expect(ranked.map((card) => card.label)).toEqual(["cheapest", "fastest", "recommended"]);
  });
});
