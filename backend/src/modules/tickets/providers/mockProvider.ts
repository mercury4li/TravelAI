import { FlightCardSchema, type FlightCard } from "../../../schemas/domainSchemas.js";
import { nowIso } from "../../../shared/time.js";
import type { FlightSearchInput, TicketProvider } from "./ticketProvider.js";

export class MockProvider implements TicketProvider {
  async searchFlights(_input: FlightSearchInput) {
    const queryTime = nowIso();
    const sourceUrl = "https://www.flightstats.com/v2/flight-tracker/route/PVG/NRT";

    const cards: FlightCard[] = [
      {
        id: "mock-cheapest",
        label: "cheapest",
        title: "直飞 · 早去晚回",
        price: { amount: 2480, currency: "CNY" },
        priceStatus: "unknown",
        availabilityStatus: "unknown",
        transferCount: 0,
        totalDurationMinutes: 470,
        sourceUrl,
        bookingUrl: "https://www.fliggy.com/",
        recommendationReason: "示例价需实时核验；返程较晚，最后一天可保留半天活动时间。",
        providerMeta: {
          provider: "mock",
          queryTime,
          sourceName: "FlightStats route tracker",
          sourceUrl
        },
        segments: [
          {
            direction: "outbound",
            carrierName: "吉祥航空",
            flightNumber: "HO1379",
            origin: "PVG",
            destination: "NRT",
            departAt: "2026-06-27T08:15:00+08:00",
            arriveAt: "2026-06-27T12:05:00+09:00",
            durationMinutes: 170
          },
          {
            direction: "return",
            carrierName: "Spring Japan",
            flightNumber: "IJ004",
            origin: "NRT",
            destination: "PVG",
            departAt: "2026-07-01T17:35:00+09:00",
            arriveAt: "2026-07-01T21:35:00+08:00",
            durationMinutes: 300
          }
        ]
      },
      {
        id: "mock-fastest",
        label: "fastest",
        title: "直飞 · 成田进出",
        price: { amount: 3260, currency: "CNY" },
        priceStatus: "unknown",
        availabilityStatus: "unknown",
        transferCount: 0,
        totalDurationMinutes: 465,
        sourceUrl,
        bookingUrl: "https://www.ceair.com/",
        recommendationReason: "去程抵达更早，适合当天安排入住和晚餐；价格以实时票源为准。",
        providerMeta: {
          provider: "mock",
          queryTime,
          sourceName: "FlightStats route tracker",
          sourceUrl
        },
        segments: [
          {
            direction: "outbound",
            carrierName: "东方航空",
            flightNumber: "MU523",
            origin: "PVG",
            destination: "NRT",
            departAt: "2026-06-27T09:05:00+08:00",
            arriveAt: "2026-06-27T12:50:00+09:00",
            durationMinutes: 165
          },
          {
            direction: "return",
            carrierName: "Spring Japan",
            flightNumber: "IJ004",
            origin: "NRT",
            destination: "PVG",
            departAt: "2026-07-01T17:35:00+09:00",
            arriveAt: "2026-07-01T21:35:00+08:00",
            durationMinutes: 300
          }
        ]
      },
      {
        id: "mock-recommended",
        label: "recommended",
        title: "直飞 · 不红眼",
        price: { amount: 2780, currency: "CNY" },
        priceStatus: "unknown",
        availabilityStatus: "unknown",
        transferCount: 0,
        totalDurationMinutes: 500,
        sourceUrl:
          "https://ajax.springairlines.com/style/site/img/home/0213UP_SPRING%20JAPAN%20International%20Flight%20Schdule%EF%BC%8820260329-20261024%EF%BC%89.pdf",
        bookingUrl: "https://www.springairlines.com/",
        recommendationReason: "去返程都不是红眼，返程时间更完整；原型价格仅用于比较样式。",
        providerMeta: {
          provider: "mock",
          queryTime,
          sourceName: "Spring Japan official schedule",
          sourceUrl:
            "https://ajax.springairlines.com/style/site/img/home/0213UP_SPRING%20JAPAN%20International%20Flight%20Schdule%EF%BC%8820260329-20261024%EF%BC%89.pdf"
        },
        segments: [
          {
            direction: "outbound",
            carrierName: "Spring Japan",
            flightNumber: "IJ003",
            origin: "PVG",
            destination: "NRT",
            departAt: "2026-06-27T13:55:00+08:00",
            arriveAt: "2026-06-27T16:20:00+09:00",
            durationMinutes: 145
          },
          {
            direction: "return",
            carrierName: "Spring Japan",
            flightNumber: "IJ004",
            origin: "NRT",
            destination: "PVG",
            departAt: "2026-07-01T17:35:00+09:00",
            arriveAt: "2026-07-01T21:35:00+08:00",
            durationMinutes: 300
          }
        ]
      }
    ];

    return cards.map((card) => FlightCardSchema.parse(card));
  }
}
