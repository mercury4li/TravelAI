import type { MvpState } from "../types";

export const initialMvpState: MvpState = {
  taskTitle: "上海 ⇄ 东京 · 2 人 · 5 天",
  taskSubtitle: "用对话确定机票方案，跳转真实来源核验和预订",
  statusText: "正在比较方案",
  queryTime: "2026-05-10 15:30",
  sourceSummary: "航班号与时刻展示来源链接；价格、余票和退改规则必须跳转票源实时核验。",
  intent: {
    origin: "上海",
    destination: "东京",
    departDate: "2026/6/27",
    returnDate: "2026/7/1",
    adults: 2,
    budget: "性价比优先",
    preference: "综合平衡",
    directOnly: true,
    avoidRedEye: true,
    ticketStatus: "待核验余票"
  },
  messages: [
    {
      id: "m1",
      role: "user",
      content: "我想 6 月底从上海去东京玩 5 天，两个人，预算别太贵。"
    },
    {
      id: "m2",
      role: "assistant",
      content:
        "我先帮你把机票定下来。目前我理解是：上海出发、东京往返、2 人、5 天、偏性价比。还差一个关键选择：你更能接受早起出发，还是更希望抵达时间舒服一点？",
      quickReplies: ["优先省钱", "优先少折腾", "不要红眼"]
    },
    {
      id: "m3",
      role: "user",
      content: "不要红眼，可以接受稍微早一点，最好直飞。"
    },
    {
      id: "m4",
      role: "assistant",
      content:
        "明白。我会优先看直飞、非红眼、总价不要太高的组合。下面给你三组候选：最低价、最省时间和我建议优先看的综合方案；价格与余票以跳转后的实时来源为准。",
      quickReplies: ["只看直飞", "预算提高 500", "返程再晚一点"]
    }
  ],
  cards: [
    {
      id: "cheapest",
      label: "cheapest",
      labelText: "最省钱",
      title: "直飞 · 早去晚回",
      price: "¥2,480 / 人",
      priceStatus: "unknown",
      availabilityStatus: "unknown",
      sourceLabel: "核验来源",
      sourceUrl: "https://www.flightstats.com/v2/flight-tracker/route/PVG/NRT",
      bookingUrl: "https://www.fliggy.com/",
      reason: "示例价需实时核验；返程晚，最后一天可保留半天活动时间。",
      segments: [
        {
          direction: "outbound",
          dateLabel: "去程 2026-06-27 周六",
          flightNumber: "HO1379",
          originAirport: "上海浦东 PVG",
          destinationAirport: "东京成田 NRT",
          departTime: "08:15",
          arriveTime: "12:05"
        },
        {
          direction: "return",
          dateLabel: "返程 2026-07-01 周三",
          flightNumber: "IJ004",
          originAirport: "东京成田 NRT",
          destinationAirport: "上海浦东 PVG",
          departTime: "17:35",
          arriveTime: "21:35"
        }
      ]
    },
    {
      id: "fastest",
      label: "fastest",
      labelText: "最省时间",
      title: "直飞 · 成田进出",
      price: "¥3,260 / 人",
      priceStatus: "unknown",
      availabilityStatus: "unknown",
      sourceLabel: "核验来源",
      sourceUrl: "https://www.flightstats.com/v2/flight-tracker/route/PVG/NRT",
      bookingUrl: "https://www.ceair.com/",
      reason: "去程抵达更早，适合当天安排入住和晚餐；价格以实时票源为准。",
      segments: [
        {
          direction: "outbound",
          dateLabel: "去程 2026-06-27 周六",
          flightNumber: "MU523",
          originAirport: "上海浦东 PVG",
          destinationAirport: "东京成田 NRT",
          departTime: "09:05",
          arriveTime: "12:50"
        },
        {
          direction: "return",
          dateLabel: "返程 2026-07-01 周三",
          flightNumber: "IJ004",
          originAirport: "东京成田 NRT",
          destinationAirport: "上海浦东 PVG",
          departTime: "17:35",
          arriveTime: "21:35"
        }
      ]
    },
    {
      id: "recommended",
      label: "recommended",
      labelText: "综合推荐",
      title: "直飞 · 不红眼",
      price: "¥2,780 / 人",
      priceStatus: "unknown",
      availabilityStatus: "unknown",
      highlighted: true,
      sourceLabel: "核验春秋日本官方时刻表",
      sourceUrl:
        "https://ajax.springairlines.com/style/site/img/home/0213UP_SPRING%20JAPAN%20International%20Flight%20Schdule%EF%BC%8820260329-20261024%EF%BC%89.pdf",
      bookingUrl: "https://www.springairlines.com/",
      reason: "去返程都不是红眼，返程时间更完整；原型价格仅用于比较样式。",
      segments: [
        {
          direction: "outbound",
          dateLabel: "去程 2026-06-27 周六",
          flightNumber: "IJ003",
          originAirport: "上海浦东 PVG",
          destinationAirport: "东京成田 NRT",
          departTime: "13:55",
          arriveTime: "16:20"
        },
        {
          direction: "return",
          dateLabel: "返程 2026-07-01 周三",
          flightNumber: "IJ004",
          originAirport: "东京成田 NRT",
          destinationAirport: "上海浦东 PVG",
          departTime: "17:35",
          arriveTime: "21:35"
        }
      ]
    }
  ]
};

export const noResultQuickReplies = ["改成前后一天", "放宽直飞限制", "降低时间要求"];
