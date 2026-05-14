import type { FlightCard } from "../../schemas/domainSchemas.js";

export function rankFlightCards(cards: FlightCard[]) {
  const cheapest = minBy(cards, (card) => card.price?.amount ?? Number.POSITIVE_INFINITY);
  const fastest = minBy(cards, (card) => card.totalDurationMinutes ?? Number.POSITIVE_INFINITY);
  const recommended =
    cards.find((card) => card.label === "recommended") ??
    minBy(cards, (card) => (card.price?.amount ?? 0) * 0.35 + (card.totalDurationMinutes ?? 0) * 0.25);

  return uniqueCards([cheapest, fastest, recommended].filter((card): card is FlightCard => Boolean(card))).map(
    (card) => {
      if (card.id === cheapest?.id) return { ...card, label: "cheapest" as const };
      if (card.id === fastest?.id) return { ...card, label: "fastest" as const };
      return { ...card, label: "recommended" as const };
    }
  );
}

function minBy(cards: FlightCard[], score: (card: FlightCard) => number) {
  return cards.reduce<FlightCard | undefined>((best, current) => {
    if (!best) return current;
    return score(current) < score(best) ? current : best;
  }, undefined);
}

function uniqueCards(cards: FlightCard[]) {
  const seen = new Set<string>();
  return cards.filter((card) => {
    if (seen.has(card.id)) return false;
    seen.add(card.id);
    return true;
  });
}
