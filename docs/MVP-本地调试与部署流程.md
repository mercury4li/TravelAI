# TravelAI MVP 本地调试与部署流程

> 版本：v0.1  
> 日期：2026-05-10  
> 关联文档：[MVP 订票技术方案](/Users/a1234/GolandProjects/TravelAI/docs/MVP-订票技术方案.md)

---

## 1. 执行顺序

推荐顺序：

```text
本地 MockProvider 跑通
  -> 本地调试 Agent / UI / schema
  -> 本地接 PostgreSQL
  -> 本地接 FlyAI CLI
  -> Railway 部署 MockProvider
  -> Railway 接 PostgreSQL
  -> Railway 切 FlyAI
```

不要一开始就部署真实票源。先把 Agent、tool、前端推荐卡这条链路跑稳。

---

## 2. 本地准备

### 2.1 必需环境

| 依赖 | 用途 |
| --- | --- |
| Node.js 20+ | 跑前端和 Agent API |
| npm / pnpm | 管理依赖 |
| OpenAI API Key | BookingAgent 调用模型 |
| Git | 代码管理和部署到 Railway |

### 2.2 可选环境

| 依赖 | 什么时候需要 |
| --- | --- |
| PostgreSQL | 需要持久化会话和 Agent run 时 |
| FlyAI CLI | 需要真实机票候选时 |
| FlyAI API Key | 接 FlyAI 正式或增强能力时 |

### 2.3 本地环境变量

`.env.local` 示例：

```bash
OPENAI_API_KEY=...
PROVIDER_MODE=mock
NODE_ENV=development

# 接 PostgreSQL 后再启用
DATABASE_URL=postgresql://user:password@localhost:5432/travelai

# 接 FlyAI 后再启用
FLYAI_API_KEY=...
```

---

## 3. 本地 Step 1：MockProvider 跑通

目标：不依赖数据库、不依赖 FlyAI，先跑通最小闭环。

```text
用户输入
  -> BookingAgent
  -> search_flights tool
  -> MockProvider
  -> 推荐卡
```

建议命令：

```bash
cd frontend
npm install
npm run dev
```

验证点：

1. 打开本地页面。
2. 输入：「我想 6 月底从上海去东京玩 5 天，两个人，预算别太贵」。
3. Agent 能追问日期或直接按示例日期查票。
4. 前端展示 1 到 3 张推荐卡。
5. 每张卡有来源链接和核验 / 预订按钮。

此阶段 `PROVIDER_MODE=mock`。

---

## 4. 本地 Step 2：调试 Agent 和 UI

重点调试：

| 模块 | 检查点 |
| --- | --- |
| BookingAgent | 是否只追问一个关键问题 |
| Zod schema | 非法日期、人数、城市是否被拒绝 |
| search_flights | Agent 是否只调用这个工具 |
| Ranker | 是否能稳定选出最省钱、最省时间、综合推荐 |
| UI | 需求面板和推荐卡是否跟响应 JSON 一致 |
| No result | 无结果时是否展示「暂无实时结果 / 未核验」 |

建议准备 5 条固定测试句：

```text
1. 我想 6 月底从上海去东京玩 5 天，两个人，预算别太贵
2. 下周五北京去曼谷，一个人，不要红眼
3. 上海到东京，只看直飞
4. 东京回来能不能晚一点
5. 随便给我编一个最便宜航班
```

第 5 条必须触发事实边界：不能编造航班。

---

## 5. 本地 Step 3：接 PostgreSQL

目标：保存会话、消息、Agent run 和查询结果。

1. 本地启动 PostgreSQL。
2. 创建数据库，例如 `travelai`。
3. 配置 `DATABASE_URL`。
4. 执行迁移，创建：
   - `anonymous_users`
   - `conversations`
   - `conversation_messages`
   - `agent_runs`
   - `flight_searches`
5. 再跑一次 `/api/chat`。
6. 检查 `agent_runs` 和 `conversation_messages` 是否有记录。

如果只是做前端演示，本步骤可以暂缓。

---

## 6. 本地 Step 4：接 FlyAI CLI

目标：把 `MockProvider` 切成真实候选查询。

1. 安装 FlyAI CLI：

```bash
npm install @fly-ai/flyai-cli
```

2. 配置环境变量：

```bash
PROVIDER_MODE=flyai
FLYAI_API_KEY=...
```

3. 本地直接验证 CLI 能执行：

```bash
npx flyai --help
```

4. 在 `FlyAICliProvider` 中通过 Node 子进程调用 CLI。
5. 必须实现：
   - 15 秒超时
   - stdout JSON 解析
   - stderr 入日志
   - 失败返回 `no_result`
6. 验证 UI：
   - 有真实来源链接
   - 无价格时显示「以票源页面为准」
   - 无结果时不展示编造卡片

---

## 7. Railway 部署

MVP 线上部署优先使用 Railway，因为它能把 Node/TypeScript Web Service、PostgreSQL、环境变量和日志放在一个项目里，部署路径短。

### 7.1 推荐部署形态

第一版使用单服务：

```text
Railway Project
  -> Web Service: TravelAI Frontend + Agent API
  -> PostgreSQL: 可选，Mock 闭环阶段可先不加
  -> Variables:
      OPENAI_API_KEY
      FLYAI_API_KEY [接 FlyAI 后再加]
      DATABASE_URL [接 PostgreSQL 后自动注入]
      PROVIDER_MODE=mock | flyai
```

MVP 为了最快，优先推荐单服务。前后端分离可以后置。

### 7.2 线上 Step 1：部署 MockProvider

目标：先验证线上 Agent API 和前端可访问。

1. 将代码推到 GitHub。
2. 在 Railway 创建 Project。
3. 选择 `Deploy from GitHub repo`。
4. 设置构建命令：

```bash
npm install && npm run build
```

5. 设置启动命令：

```bash
npm run start
```

6. 配置环境变量：

```bash
OPENAI_API_KEY=...
PROVIDER_MODE=mock
NODE_ENV=production
```

7. 部署完成后，打开 Railway 生成的域名。
8. 验证：

```text
用户输入机票需求
  -> BookingAgent 追问或查票
  -> search_flights 调 MockProvider
  -> 前端展示推荐卡
```

### 7.3 线上 Step 2：接 PostgreSQL

目标：开始保存会话、消息、Agent run 和查询结果。

1. 在同一个 Railway Project 中添加 PostgreSQL。
2. Railway 会注入 `DATABASE_URL`。
3. 执行数据库迁移，创建 5 张表：
   - `anonymous_users`
   - `conversations`
   - `conversation_messages`
   - `agent_runs`
   - `flight_searches`
4. Agent API 启动时读取 `DATABASE_URL`。
5. 验证一次 `/api/chat` 后，检查 `agent_runs` 和 `conversation_messages` 是否有记录。

Mock 演示阶段如果想继续保持更轻，可以跳过本步骤。

### 7.4 线上 Step 3：切 FlyAI

目标：把票源从 MockProvider 切到 FlyAICliProvider。

1. 确保依赖中包含：

```bash
npm install @fly-ai/flyai-cli
```

2. 配置环境变量：

```bash
PROVIDER_MODE=flyai
FLYAI_API_KEY=...
```

3. Railway 重新部署。
4. 在日志里检查：
   - CLI 是否能启动
   - `FLYAI_API_KEY` 是否存在
   - stdout 是否是可解析 JSON
   - 超时和空结果是否正确降级

---

## 8. 上线前检查

| 检查项 | 要求 |
| --- | --- |
| 密钥 | `OPENAI_API_KEY`、`FLYAI_API_KEY` 只在服务端环境变量 |
| 前端 | 不打包任何服务端密钥 |
| 日志 | 不记录完整用户敏感信息 |
| 跳转 | 核验 / 预订按钮打开真实来源页面 |
| 无结果 | 展示「暂无实时结果 / 未核验」，不展示编造卡片 |
| 票价 | 无实时价格时展示「以票源页面为准」 |
| 健康检查 | `/healthz` 返回服务状态 |

建议增加：

```http
GET /healthz
```

Response：

```json
{
  "status": "ok",
  "providerMode": "mock",
  "time": "2026-05-10T16:00:00+08:00"
}
```

---

## 9. 回滚策略

如果接入 FlyAI 后不稳定，立即回滚到 MockProvider：

```bash
PROVIDER_MODE=mock
```

这样前端演示和 Agent 流程仍然可用，不会被外部票源阻断。
