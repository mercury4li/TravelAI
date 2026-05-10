import { FormEvent, useMemo, useState } from "react";
import { initialMvpState, noResultQuickReplies } from "./mock/flightMvp";
import type { BookingIntent, ChatMessage, FlightCard, MvpState } from "./types";

const createId = () => Math.random().toString(36).slice(2, 10);

const cloneInitialState = (): MvpState => ({
  ...initialMvpState,
  intent: { ...initialMvpState.intent },
  messages: initialMvpState.messages.map((message) => ({
    ...message,
    quickReplies: message.quickReplies ? [...message.quickReplies] : undefined
  })),
  cards: initialMvpState.cards.map((card) => ({
    ...card,
    segments: card.segments.map((segment) => ({ ...segment }))
  }))
});

function App() {
  const [mvpState, setMvpState] = useState<MvpState>(() => cloneInitialState());
  const [inputValue, setInputValue] = useState("再帮我看看返程能不能晚一点");

  const latestQuickReplies = useMemo(() => {
    const assistantMessages = mvpState.messages.filter((message) => message.role === "assistant");
    return assistantMessages.at(-1)?.quickReplies ?? [];
  }, [mvpState.messages]);

  const appendInteraction = (userContent: string, assistantContent: string, nextIntent?: Partial<BookingIntent>) => {
    setMvpState((current) => ({
      ...current,
      intent: {
        ...current.intent,
        ...nextIntent
      },
      statusText: "已更新方案",
      messages: [
        ...current.messages,
        {
          id: createId(),
          role: "user",
          content: userContent
        },
        {
          id: createId(),
          role: "assistant",
          content: assistantContent,
          quickReplies: ["只看直飞", "预算提高 500", "返程再晚一点"]
        }
      ]
    }));
  };

  const handleQuickReply = (reply: string) => {
    const replyMap: Record<string, { assistant: string; intent?: Partial<BookingIntent> }> = {
      优先省钱: {
        assistant: "我会把价格权重调高，但仍保留不红眼和直飞作为硬约束。下面的最省钱方案会优先展示。",
        intent: { preference: "优先省钱" }
      },
      优先少折腾: {
        assistant: "我会优先看直飞、时间舒服、机场转换少的方案。综合推荐会更偏向少折腾。",
        intent: { preference: "优先少折腾", directOnly: true }
      },
      不要红眼: {
        assistant: "已加入不要红眼。当前推荐只保留白天或傍晚出发的候选，价格和余票仍以票源页面为准。",
        intent: { avoidRedEye: true }
      },
      只看直飞: {
        assistant: "已切换为只看直飞。当前三组候选都不会包含中转方案。",
        intent: { directOnly: true }
      },
      "预算提高 500": {
        assistant: "已把预算弹性提高 500 元。这样可以保留更舒服的出发时段，综合推荐暂时不变。",
        intent: { budget: "预算可上浮 500" }
      },
      返程再晚一点: {
        assistant: "我会优先保留晚返程方案。当前推荐的 IJ004 是 17:35 起飞，适合最后一天保留半天活动时间。",
        intent: { preference: "晚返程优先" }
      }
    };

    const fallback = {
      assistant: "已收到这个筛选条件。我会按当前偏好重新整理候选机票，票价和余票仍以外部票源为准。"
    };

    const next = replyMap[reply] ?? fallback;
    appendInteraction(reply, next.assistant, next.intent);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const isNoResultProbe = trimmed.includes("编") || trimmed.includes("不存在");
    if (isNoResultProbe) {
      setMvpState((current) => ({
        ...current,
        statusText: "暂无实时结果",
        messages: [
          ...current.messages,
          { id: createId(), role: "user", content: trimmed },
          {
            id: createId(),
            role: "assistant",
            content: "我不能编造航班、价格或余票。可以帮你调整日期、机场或直飞限制后重新查询。",
            quickReplies: noResultQuickReplies
          }
        ]
      }));
    } else {
      appendInteraction(
        trimmed,
        "我已按你的补充重新理解需求。当前仍建议先核验综合推荐方案；如果票源页面价格不合适，可以继续改日期、机场或预算。",
        { preference: "按最新消息调整" }
      );
    }

    setInputValue("");
  };

  const handleReset = () => {
    setMvpState(cloneInitialState());
    setInputValue("再帮我看看返程能不能晚一点");
  };

  const handleStartVerify = () => {
    const recommended = mvpState.cards.find((card) => card.highlighted) ?? mvpState.cards[0];
    window.open(recommended.bookingUrl || recommended.sourceUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <strong>TravelAI</strong>
          <span>机票订票助手 · MVP</span>
        </div>
        <div className="top-actions" aria-label="页面操作">
          <button type="button" className="ghost-button" onClick={handleReset}>
            重新查询
          </button>
          <button type="button" className="primary-button" onClick={handleStartVerify}>
            开始核验
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="chat-panel" aria-label="对话窗口">
          <div className="chat-header">
            <div>
              <h1>{mvpState.taskTitle}</h1>
              <p>{mvpState.taskSubtitle}</p>
            </div>
            <span className="status-pill">{mvpState.statusText}</span>
          </div>

          <div className="messages" aria-live="polite">
            {mvpState.messages.map((message) => (
              <MessageBubble key={message.id} message={message} onQuickReply={handleQuickReply} />
            ))}
          </div>

          <form className="composer" onSubmit={handleSubmit}>
            <input
              aria-label="输入消息"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="输入新的筛选条件，例如：不要红眼、返程晚一点"
            />
            <button type="submit" aria-label="发送消息">
              ↗
            </button>
          </form>
        </section>

        <section className="side-panel" aria-label="机票方案面板">
          <IntentPanel intent={mvpState.intent} />

          <section className="panel">
            <div className="panel-header">
              <h2>推荐方案</h2>
              <small>前端内置 Mock 数据</small>
            </div>
            <div className="flight-grid">
              {mvpState.cards.map((card) => (
                <FlightCardView key={card.id} card={card} />
              ))}
            </div>
          </section>

          <section className="trust-panel">
            <p>
              <strong>核验信息：</strong>
              {mvpState.sourceSummary} 查询时间：{mvpState.queryTime}。
            </p>
            <a href={mvpState.cards[0]?.sourceUrl} target="_blank" rel="noreferrer" className="outline-link">
              打开信息源
            </a>
          </section>

          <div className="next-actions">
            <article>
              <h3>下一步：核验票价与余票</h3>
              <p>跳转真实票源后确认价格、余票、行李额和退改规则。</p>
            </article>
            <article>
              <h3>下一步：调整筛选条件</h3>
              <p>如果票源页面不合适，回到这里继续改日期、机场或预算。</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

function MessageBubble({ message, onQuickReply }: { message: ChatMessage; onQuickReply: (reply: string) => void }) {
  return (
    <article className={`message ${message.role}`}>
      <div className="avatar">{message.role === "user" ? "我" : "AI"}</div>
      <div className="bubble">
        <p>{message.content}</p>
        {message.quickReplies && message.quickReplies.length > 0 ? (
          <div className="quick-replies" aria-label="快捷回复">
            {message.quickReplies.map((reply) => (
              <button type="button" key={reply} onClick={() => onQuickReply(reply)}>
                {reply}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function IntentPanel({ intent }: { intent: BookingIntent }) {
  const slots = [
    ["出发地", intent.origin],
    ["目的地", intent.destination],
    ["日期", `${intent.departDate} - ${intent.returnDate}`],
    ["人数", `${intent.adults} 成人`],
    ["预算", intent.budget],
    ["偏好", intent.preference],
    ["直飞", intent.directOnly ? "只看直飞" : "可接受中转"],
    ["红眼", intent.avoidRedEye ? "不要红眼" : "可接受"]
  ];

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>当前需求</h2>
        <small>AI 已结构化</small>
      </div>
      <div className="slots">
        {slots.map(([label, value]) => (
          <div className="slot" key={label}>
            <label>{label}</label>
            <strong>{value}</strong>
          </div>
        ))}
        <div className="slot pending">
          <label>票务状态</label>
          <strong>{intent.ticketStatus}</strong>
        </div>
      </div>
    </section>
  );
}

function FlightCardView({ card }: { card: FlightCard }) {
  return (
    <article className={`flight-card ${card.highlighted ? "highlighted" : ""}`}>
      <span className="flight-tag">{card.labelText}</span>
      <div className="price-row">
        <strong>{card.price}</strong>
        <span>价格以票源为准</span>
      </div>
      <h3>{card.title}</h3>

      <div className="segments">
        {card.segments.map((segment) => (
          <div className="segment" key={`${card.id}-${segment.direction}`}>
            <span className="date-line">{segment.dateLabel}</span>
            <b>{segment.flightNumber}</b>
            <span>
              {segment.originAirport} {segment.departTime} → {segment.destinationAirport} {segment.arriveTime}
            </span>
          </div>
        ))}
      </div>

      <a href={card.sourceUrl} target="_blank" rel="noreferrer" className="source-link">
        {card.sourceLabel}
      </a>

      <p className="reason">{card.reason}</p>

      <a href={card.bookingUrl} target="_blank" rel="noreferrer" className="verify-link">
        核验 / 预订
      </a>
    </article>
  );
}

export default App;
