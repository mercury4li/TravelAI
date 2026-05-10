# TravelAI MVP 后端模块设计

> 版本：v0.1  
> 日期：2026-05-10  
> 目标：为当前 Vite React 前端提供可逐步替换 mock 的后端模块设计。第一阶段以后端 mock API 跑通前后端联调，随后接入 OpenAI Agents SDK、PostgreSQL 和 FlyAI CLI。

---

## 1. 设计目标

MVP 后端只服务「机票订票助手」：

1. 支持匿名用户会话。
2. 支持查看同一浏览器下的历史会话。
3. 支持 `/api/chat` 接收用户消息并返回前端可渲染的结构。
4. 第一阶段可不依赖 OpenAI / FlyAI / PostgreSQL，用内存 mock 跑通。
5. 第二阶段接 OpenAI Agents SDK，但票务数据仍用 `MockProvider`。
6. 第三阶段接 PostgreSQL 持久化。
7. 第四阶段接 `FlyAICliProvider`。

不做：

- 注册 / 登录。
- 支付。
- 保存方案 / 分享链接。
- 火车票、酒店、行程。
- Streaming。

---

## 2. 技术选择

| 模块 | 选择 | 说明 |
| --- | --- | --- |
| API Server | Express + TypeScript | 对当前 Vite 项目接入简单，生态成熟 |
| Schema | Zod | 校验 API 入参、Agent 输出、provider 输出 |
| Agent Runtime | OpenAI Agents SDK TS | 第二阶段接入 |
| DB | PostgreSQL | 第三阶段接入 |
| DB Client | `pg` | MVP 足够轻，暂不引入 ORM |
| Cookie | httpOnly cookie | 绑定匿名用户 |
| Provider | `MockProvider` -> `FlyAICliProvider` | 先 mock，后真实票源 |

建议依赖：

```bash
npm install express cookie-parser zod pg @openai/agents
npm install -D @types/express @types/cookie-parser @types/pg tsx
```

---

## 3. 模块划分

```text
server/
  index.ts
  app.ts
  config.ts
  routes/
    sessionRoutes.ts
    conversationRoutes.ts
    chatRoutes.ts
    healthRoutes.ts
  modules/
    session/
      anonymousSessionService.ts
    conversation/
      conversationService.ts
      conversationRepository.ts
      inMemoryConversationRepository.ts
      postgresConversationRepository.ts
    chat/
      chatService.ts
      mockChatResponder.ts
    agent/
      bookingAgent.ts
      bookingAgentSchemas.ts
    tickets/
      ticketSearchService.ts
      ranker.ts
      providers/
        ticketProvider.ts
        mockProvider.ts
        flyAiCliProvider.ts
        officialLinkProvider.ts
  schemas/
    apiSchemas.ts
    domainSchemas.ts
  shared/
    ids.ts
    time.ts
    logger.ts
```

### 3.1 API Layer

职责：

- 解析 request。
- 读取 / 设置匿名 cookie。
- 调用 service。
- 返回统一 JSON。
- 不写业务逻辑。

### 3.2 Session Module

职责：

- `GET /api/session` 获取或创建匿名用户。
- 设置 `travelai_anon_id` httpOnly cookie。
- 开发阶段如果没有 DB，则把匿名用户存在内存 map。

### 3.3 Conversation Module

职责：

- 创建会话。
- 查询当前匿名用户的会话列表。
- 查询会话详情。
- 归档会话。
- 写入用户 / AI 消息。

### 3.4 Chat Module

职责：

- 接收 `/api/chat` 消息。
- 校验 conversation ownership。
- 第一阶段调用 `MockChatResponder`。
- 第二阶段调用 `BookingAgent`。
- 统一落库 / 记录 agent run。

### 3.5 Agent Module

职责：

- 定义 `BookingAgent` instructions。
- 注册 `search_flights` tool。
- 校验 `BookingAgentOutput`。
- 禁止输出无来源票务事实。

第一阶段不启用，使用 `BACKEND_MODE=mock`。

### 3.6 Ticket Module

职责：

- 定义 `TicketProvider` interface。
- 调用 provider 搜索机票。
- 归一化为 `FlightOption`。
- 调用 deterministic ranker 生成推荐卡。

Provider 选择：

```text
PROVIDER_MODE=mock   -> MockProvider
PROVIDER_MODE=flyai  -> FlyAICliProvider + OfficialLinkProvider fallback
```

---

## 4. 运行模式

### 4.1 Mode A：本地 Mock API

环境变量：

```bash
BACKEND_MODE=mock
PROVIDER_MODE=mock
PERSISTENCE_MODE=memory
```

特点：

- 不需要 OpenAI API Key。
- 不需要 PostgreSQL。
- 不需要 FlyAI。
- 前端可从内置 mock 切到真实 `/api/chat` 形状。

### 4.2 Mode B：Agent + MockProvider

环境变量：

```bash
BACKEND_MODE=agent
PROVIDER_MODE=mock
PERSISTENCE_MODE=memory
OPENAI_API_KEY=...
```

特点：

- 验证 Agents SDK 多轮理解能力。
- 票务结果仍然稳定可控。
- 适合调 prompt、schema、guardrails。

### 4.3 Mode C：Agent + PostgreSQL

环境变量：

```bash
BACKEND_MODE=agent
PROVIDER_MODE=mock
PERSISTENCE_MODE=postgres
DATABASE_URL=...
OPENAI_API_KEY=...
```

特点：

- 支持历史会话。
- 支持回放 agent run。

### 4.4 Mode D：Agent + FlyAI

环境变量：

```bash
BACKEND_MODE=agent
PROVIDER_MODE=flyai
PERSISTENCE_MODE=postgres
OPENAI_API_KEY=...
FLYAI_API_KEY=...
DATABASE_URL=...
```

特点：

- 接真实票源。
- 失败时返回 `no_result`，不允许模型补结果。

---

## 5. API 合约

后端 API 以技术方案中的接口为准：

- `GET /api/session`
- `POST /api/conversations`
- `GET /api/conversations`
- `GET /api/conversations/:conversationId`
- `POST /api/chat`
- `DELETE /api/conversations/:conversationId`
- `GET /healthz`

### 5.1 统一错误格式

```json
{
  "error": {
    "code": "invalid_request",
    "message": "conversationId is required"
  }
}
```

错误码：

| code | HTTP | 场景 |
| --- | --- | --- |
| `invalid_request` | 400 | 入参非法 |
| `not_found` | 404 | 会话不存在或不属于当前匿名用户 |
| `provider_timeout` | 504 | FlyAI 超时 |
| `provider_failed` | 502 | FlyAI 返回不可解析结果 |
| `agent_failed` | 500 | Agent run 失败 |

### 5.2 `/api/chat` 响应必须兼容前端

后端返回字段必须覆盖当前前端 mock 需要的结构：

```ts
interface ChatResponse {
  conversationId: string;
  assistantMessage: {
    type: "clarification" | "result" | "no_result" | "error";
    content: string;
    quickReplies: string[];
  };
  intent: BookingIntent;
  cards: FlightCard[];
  queryTime?: string;
  sourceSummary?: string;
}
```

---

## 6. 数据流

### 6.1 新用户进入

```text
Frontend
  -> GET /api/session
Backend
  -> 无 cookie: 创建 anonymous_user，Set-Cookie
  -> 有 cookie: 更新 last_seen_at
Frontend
  -> GET /api/conversations
```

### 6.2 新建会话并发送消息

```text
Frontend
  -> POST /api/conversations
  -> POST /api/chat
Backend
  -> 校验 conversation ownership
  -> 写入 user message
  -> BACKEND_MODE=mock: MockChatResponder
  -> BACKEND_MODE=agent: BookingAgent
  -> 写入 assistant message
  -> 如有工具调用，写入 flight_searches
  -> 返回 ChatResponse
```

### 6.3 Agent 查询机票

```text
BookingAgent
  -> call search_flights tool
search_flights
  -> TicketSearchService.searchFlights
  -> TicketProvider.searchFlights
  -> normalize FlightOption
  -> Ranker.createCards
  -> return cards
BookingAgent
  -> final ChatResponse
```

---

## 7. 核心接口设计

### 7.1 TicketProvider

```ts
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
  searchFlights(input: FlightSearchInput): Promise<FlightOption[]>;
}
```

### 7.2 ConversationRepository

```ts
export interface ConversationRepository {
  ensureAnonymousUser(id?: string): Promise<AnonymousUser>;
  createConversation(input: CreateConversationInput): Promise<Conversation>;
  listConversations(anonymousUserId: string, input: ListInput): Promise<ConversationSummary[]>;
  getConversationDetail(anonymousUserId: string, conversationId: string): Promise<ConversationDetail | null>;
  archiveConversation(anonymousUserId: string, conversationId: string): Promise<void>;
  appendMessage(input: AppendMessageInput): Promise<ConversationMessage>;
  recordAgentRun(input: RecordAgentRunInput): Promise<void>;
  recordFlightSearch(input: RecordFlightSearchInput): Promise<void>;
}
```

### 7.3 ChatService

```ts
export interface ChatService {
  sendMessage(input: {
    anonymousUserId: string;
    conversationId: string;
    content: string;
  }): Promise<ChatResponse>;
}
```

---

## 8. 第一阶段实现顺序

### Step 1：后端骨架

1. 增加 Express server。
2. 增加 `/healthz`。
3. 增加 config 读取。
4. 增加统一错误处理中间件。

### Step 2：内存 Session / Conversation

1. 实现 `GET /api/session`。
2. 实现 `POST /api/conversations`。
3. 实现 `GET /api/conversations`。
4. 实现 `GET /api/conversations/:conversationId`。
5. 实现 `DELETE /api/conversations/:conversationId`。

### Step 3：Mock Chat

1. 实现 `POST /api/chat`。
2. 复用前端 mock 数据结构。
3. 输入普通消息返回 `result`。
4. 输入包含「编造 / 不存在」返回 `no_result`。
5. 将前端从内置 mock 切到 API 模式。

### Step 4：Agent + MockProvider

1. 接入 `@openai/agents`。
2. 注册 `search_flights` tool。
3. tool 仍然调用 `MockProvider`。
4. 校验 Agent 输出 shape。

### Step 5：PostgreSQL

1. 创建迁移 SQL。
2. 实现 `PostgresConversationRepository`。
3. 用 `PERSISTENCE_MODE=postgres` 切换。

### Step 6：FlyAI

1. 实现 `FlyAICliProvider`。
2. 设置 15 秒超时。
3. stdout JSON 解析失败返回 `provider_failed`。
4. stderr 只写日志。
5. `PROVIDER_MODE=flyai` 切换。

---

## 9. 测试计划

### 9.1 单元测试

- Zod schema 校验。
- Ranker 分类。
- MockProvider 输出。
- ConversationRepository 内存实现。
- ChatService no-result 规则。

### 9.2 API 测试

```text
GET /healthz
GET /api/session
POST /api/conversations
POST /api/chat
GET /api/conversations
GET /api/conversations/:id
DELETE /api/conversations/:id
```

### 9.3 前后端联调验收

- 页面刷新后能从 `/api/session` 恢复匿名用户。
- 新建会话后能发送消息。
- `/api/chat` 响应能渲染当前需求和推荐卡。
- 历史会话列表能看到刚创建的会话。
- 删除会话后历史列表不再显示。
- no-result 状态不展示编造航班。

---

## 10. 风险和约束

| 风险 | 处理 |
| --- | --- |
| Agent 输出不稳定 | Zod 校验失败时返回 `error`，不写入推荐卡 |
| FlyAI CLI 慢或不可用 | 15 秒超时，返回 `no_result`，可切回 `PROVIDER_MODE=mock` |
| 匿名 cookie 丢失 | 视为新用户；MVP 不承诺跨设备历史 |
| 日志泄露敏感信息 | 日志只记录摘要，不记录完整用户隐私 |
| 前后端类型漂移 | 后端 `ChatResponse` 必须兼容 `src/types.ts`，后续可抽 shared types |
