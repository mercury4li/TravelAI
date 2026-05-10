# FlyAI / 飞猪 flyai-skill 调研文档

> **文档日期**：2026-05-10  
> **调研对象**：飞猪 / Fliggy 发布的 `flyai-skill`、`@fly-ai/flyai-cli`、公开 GitHub / npm / 媒体资料。  
> **调研目的**：评估 FlyAI 是否适合作为 TravelAI 后续「实时机票 / 火车票 / 酒店 / POI / 预订跳转」能力的数据源与工具层。  
> **说明**：本文面向后续技术实现。公开资料与 CLI 能力可能持续变化，正式接入前需重新验证版本、API Key 规则、商用条款与返回字段。

---

## 1. 一句话结论

`flyai-skill` 是飞猪面向 AI Agent 生态发布的旅行 Skill，底层依赖 `@fly-ai/flyai-cli` 调用飞猪相关 MCP / 服务能力，输出结构化 JSON，并提供飞猪预订跳转链接。

对 TravelAI 来说，它适合做 **旅行商品实时查询 + 可预订候选项补全**，尤其是机票、火车票、酒店、景点 / POI 等事实性数据；但它不是完整的团队旅行解决方案，不能替代我们的行程协作、预算管理、多人决策、记账分账、行后内容沉淀等产品能力。

---

## 2. 背景与公开信息

### 2.1 发布时间与定位

公开媒体信息显示，飞猪于 **2026-03-24** 发布首个全品类出行旅游技能插件 `flyai`，并上线 ClawHub、GitHub 等平台。

媒体与官方 README 对其定位基本一致：

- 面向 OpenClaw、Claude Code 等支持 Skill / Agent 能力的平台。
- 基于飞猪 MCP 做标准化封装。
- 覆盖旅行搜索、咨询、规划、预订跳转等场景。
- 免注册、免 API Key 也可体验；正式或增强结果可配置 API Key。

### 2.2 公开仓库与包

| 项目 | 信息 |
|------|------|
| GitHub 仓库 | `alibaba-flyai/flyai-skill` |
| Skill 名称 | `flyai` |
| CLI 包 | `@fly-ai/flyai-cli` |
| 本地调研时 npm 最新版本 | `1.0.16` |
| CLI bin | `flyai` |
| License | MIT |
| 运行时 | Node.js |

---

## 3. Skill 与 CLI 的关系

`flyai-skill` 本身更像是 Agent 的「使用说明 + 触发规则 + 展示规范」，真正执行查询的是 `@fly-ai/flyai-cli`。

简化链路：

```text
用户旅行需求
  -> Agent 命中 flyai Skill
  -> Agent 选择合适 flyai CLI 命令
  -> flyai-cli 调用飞猪 MCP / 服务
  -> 返回单行 JSON
  -> Agent 格式化成 Markdown / 卡片 / 表格
  -> 用户点击飞猪 jumpUrl / detailUrl 完成预订或核验
```

后续 TravelAI 技术接入时，建议把 `flyai-cli` 当作一个 **外部数据适配器**，而不是把 Skill 文档直接嵌进核心业务逻辑。

---

## 4. 安装与验证

### 4.1 Skill 安装方式

公开 README 给出的方式：

```bash
# OpenClaw 推荐方式
clawhub install flyai

# 通用 skills CLI
npx skills add alibaba-flyai/flyai-skill
```

Claude Code 方式：

```bash
cp -r /path/to/flyai-skill/skills/flyai ~/.claude/skills/flyai
```

### 4.2 CLI 安装方式

```bash
npm i -g @fly-ai/flyai-cli
```

也可以在服务端通过 `npx -y @fly-ai/flyai-cli ...` 临时执行，但生产环境不建议每次走 `npx`，启动慢且版本不稳定。

### 4.3 可选 API Key

```bash
flyai config set FLYAI_API_KEY "your-key"
```

本地验证免 Key 可用，但返回中出现平台提示：

```text
当前为体验模式，部分搜索结果可能受限，请前往飞猪AI开放平台获取正式API Key解锁完整服务。
```

因此：

- MVP 原型可以先免 Key 验证体验。
- 生产或准生产必须申请正式 API Key。
- 需要确认 Key 的调用限制、计费、商用许可、展示归因、缓存规则。

---

## 5. CLI 命令能力

本地执行 `npx -y @fly-ai/flyai-cli --help` 验证，当前 CLI 暴露 8 类命令：

| 命令 | 能力 | 典型用途 |
|------|------|----------|
| `keyword-search` / `fliggy-fast-search` | 关键词搜索 | 模糊搜索酒店、机票、门票、线路等 |
| `ai-search` | 自然语言语义搜索 | 复杂意图下的旅行商品搜索 |
| `search-flight` | 机票搜索 | 结构化查询航班 |
| `search-train` | 火车票搜索 | 结构化查询车次 |
| `search-hotel` / `search-hotels` | 酒店搜索 | 按目的地、日期、星级、价格等筛选 |
| `search-poi` | 景点 / POI 搜索 | 查城市景点、类别、等级 |
| `search-marriott-hotel` | 万豪酒店搜索 | 查万豪集团酒店 |
| `search-marriott-package` | 万豪套餐搜索 | 查万豪套餐、下午茶、Spa 等商品 |

### 5.1 `keyword-search`

适合全品类粗搜。

```bash
flyai keyword-search --query "杭州 西湖 酒店"
```

本地验证可返回：

- `title`
- `picUrl`
- `jumpUrl`
- `star`
- `price`
- `scoreDesc`
- `tags`
- `systemMessage`

注意：体验模式下样例结果的 `price` 多为 `null`，不适合直接做价格比较。

### 5.2 `ai-search`

适合把用户复杂自然语言意图交给 FlyAI 做语义理解。

```bash
flyai ai-search --query "五一杭州三日游，人均预算2000，想住西湖附近"
```

适用场景：

- 用户需求还没有结构化。
- 需要把酒店、机票、景点放在同一意图下搜索。
- 用作候选召回，不建议直接作为最终行程排布。

### 5.3 `search-flight`

结构化机票搜索。

常见参数：

| 参数 | 含义 |
|------|------|
| `--origin` | 出发城市 / 机场 |
| `--destination` | 到达城市 / 机场 |
| `--dep-date` | 出发日期 |
| `--dep-date-start` / `--dep-date-end` | 出发日期范围 |
| `--back-date` | 返程日期 |
| `--journey-type` | `1` 直达，`2` 中转 |
| `--seat-class-name` | 舱位 |
| `--max-price` | 最高价 |
| `--sort-type` | 排序方式 |

示例：

```bash
flyai search-flight \
  --origin "上海" \
  --destination "东京" \
  --dep-date 2026-06-01 \
  --back-date 2026-06-06 \
  --journey-type 1 \
  --sort-type 3
```

### 5.4 `search-train`

结构化火车票搜索。

常见参数与 `search-flight` 类似：

- `--origin`
- `--destination`
- `--dep-date`
- `--journey-type`
- `--seat-class-name`
- `--max-price`
- `--sort-type`

示例：

```bash
flyai search-train \
  --origin "上海" \
  --destination "杭州" \
  --dep-date 2026-06-01 \
  --journey-type 1 \
  --seat-class-name "second class" \
  --sort-type 3
```

### 5.5 `search-hotel`

结构化酒店搜索。

常见参数：

| 参数 | 含义 |
|------|------|
| `--dest-name` | 目的地，必填 |
| `--key-words` | 关键词 |
| `--poi-name` | 附近景点 |
| `--hotel-types` | 酒店 / 民宿 / 客栈 |
| `--sort` | `distance_asc` / `rate_desc` / `price_asc` / `price_desc` / `no_rank` |
| `--check-in-date` | 入住日期 |
| `--check-out-date` | 离店日期 |
| `--hotel-stars` | 星级，逗号分隔 |
| `--hotel-bed-types` | 大床房 / 双床房 / 多床房 |
| `--max-price` | 最高价 |

示例：

```bash
flyai search-hotel \
  --dest-name "杭州" \
  --poi-name "西湖" \
  --check-in-date 2026-06-01 \
  --check-out-date 2026-06-03 \
  --hotel-stars "4,5" \
  --max-price 800 \
  --sort rate_desc
```

### 5.6 `search-poi`

景点 / POI 搜索。

常见参数：

| 参数 | 含义 |
|------|------|
| `--city-name` | 城市，必填 |
| `--keyword` | 景点关键词 |
| `--poi-level` | 景点等级，`1` 到 `5` |
| `--category` | 景点类别 |

示例：

```bash
flyai search-poi \
  --city-name "杭州" \
  --keyword "西湖" \
  --category "山湖田园"
```

公开文档列出的类别包括：自然风光、山湖田园、森林丛林、峡谷瀑布、沙滩海岛、沙漠草原、人文古迹、古镇古村、历史古迹、园林花园、宗教场所、公园乐园、主题乐园、水上乐园、影视基地、动物园、植物园、海洋馆、体育场馆、演出赛事、剧院剧场、博物馆、纪念馆、展览馆、地标建筑、市集、文创街区、城市观光、户外活动、滑雪、漂流、冲浪、潜水、露营、温泉。

### 5.7 万豪专项命令

`search-marriott-hotel` 和 `search-marriott-package` 是品牌专项能力，适合高端酒店或套餐场景。

示例：

```bash
flyai search-marriott-hotel \
  --dest-name "上海" \
  --hotel-brands "JW Marriott,Sheraton" \
  --check-in-date 2026-06-01 \
  --check-out-date 2026-06-03
```

```bash
flyai search-marriott-package \
  --keyword "上海" \
  --sort-type price_asc
```

---

## 6. 返回数据与展示要求

### 6.1 返回形态

Skill 文档声明所有命令输出 **单行 JSON 到 stdout**，错误与提示进入 stderr，便于用 `jq`、Node、Go、Python 等解析。

后续技术实现建议：

- 将 CLI stdout 作为 JSON 解析。
- 将 stderr 作为非结构化日志和提示，不参与核心数据模型。
- 对 `status`、`message`、`systemMessage` 做统一处理。
- 对字段缺失保持兼容，尤其是 `price`、`tags`、`scoreDesc` 可能为空。

### 6.2 典型字段

本地 `keyword-search` 验证样例中出现：

```json
{
  "status": 0,
  "message": "success",
  "data": {
    "itemList": [
      {
        "info": {
          "title": "杭州西湖希尔顿花园酒店",
          "picUrl": "https://img.alicdn.com/...",
          "jumpUrl": "https://a.feizhu.com/...",
          "price": null,
          "scoreDesc": null,
          "star": "4",
          "tags": null
        }
      }
    ]
  },
  "systemMessage": "..."
}
```

不同命令字段可能不同。官方 Skill 文档中提到：

| 场景 | 图片字段 | 预订链接字段 |
|------|----------|--------------|
| `keyword-search` | `picUrl` | `jumpUrl` |
| `search-flight` | 无固定图片要求 | `jumpUrl` |
| `search-hotel` | `mainPic` | `detailUrl` |
| `search-poi` | `picUrl` | `jumpUrl` |

实现时不应假设所有命令都有相同字段。

### 6.3 展示规范

官方 Skill 文档要求：

- 有 `jumpUrl` / `detailUrl` 时展示 booking link。
- 有 `picUrl` / `mainPic` 时展示图片。
- 有 `systemMessage` 时展示平台提示。
- 多方案对比建议使用 Markdown 表格。

TravelAI 产品中可以转化为：

- 商品卡片：图片、标题、价格、星级 / 评分、标签。
- 来源与查询时间：显示「来自 FlyAI / 飞猪实时结果」。
- 跳转按钮：使用 `jumpUrl` 或 `detailUrl`。
- 体验模式提示：展示在结果区底部或调试信息中。

---

## 7. 与 TravelAI 的适配点

### 7.1 适合接入的功能模块

| TravelAI 模块 | FlyAI 可提供能力 | 备注 |
|---------------|------------------|------|
| 交通候选 | `search-flight`、`search-train` | 用于减少模型编造航班 / 车次 |
| 酒店候选 | `search-hotel`、`search-marriott-hotel` | 用于展示可核验酒店与外链 |
| POI / 景点候选 | `search-poi`、`keyword-search` | 可作为景点补全和门票入口 |
| 复杂自然语言召回 | `ai-search` | 可用于从用户意图召回商品候选 |
| 预订跳转 | `jumpUrl` / `detailUrl` | 支付和订单仍在飞猪侧完成 |

### 7.2 不适合交给 FlyAI 的能力

| 能力 | 原因 |
|------|------|
| 多日行程结构化编排 | FlyAI 偏商品搜索，不负责我们的行程对象模型 |
| 多人协作 | FlyAI 无团队状态、权限、评论、投票模型 |
| 预算管理与 AA 记账 | FlyAI 返回价格候选，不管理真实支出 |
| 偏好长期记忆 | 应由 TravelAI 用户画像和对话系统沉淀 |
| 行后游记 / 视频 / 照片归集 | 不在 FlyAI 当前核心能力内 |
| 订单聚合 | FlyAI 提供跳转，不等于可读取用户飞猪订单 |

---

## 8. 推荐技术架构

### 8.1 MVP 集成方式

MVP 阶段建议先走 **服务端 CLI 子进程适配器**：

```text
TravelAI Backend
  -> FlyAIAdapter
      -> spawn/exec flyai CLI
      -> parse stdout JSON
      -> normalize result
      -> cache + log
  -> TravelAI domain model
  -> API response to frontend
```

优点：

- 接入最快。
- 与官方公开方式一致。
- 不需要逆向底层 MCP 协议。
- 后续可替换为正式 HTTP / SDK 方式。

风险：

- 子进程调用有性能与稳定性成本。
- CLI 返回字段可能随版本变化。
- 需要处理超时、并发、日志、错误码。

### 8.2 生产化建议

如果后续使用频繁，建议演进为：

```text
FlyAIProvider interface
  -> FlyAICliProvider
  -> FlyAIHttpProvider [待官方 API 确认]
  -> MockFlyAIProvider
```

核心业务层只依赖统一接口，不依赖 CLI 命令细节。

建议接口示意：

```ts
interface TravelSearchProvider {
  searchFlights(input: FlightSearchInput): Promise<FlightOption[]>;
  searchTrains(input: TrainSearchInput): Promise<TrainOption[]>;
  searchHotels(input: HotelSearchInput): Promise<HotelOption[]>;
  searchPois(input: PoiSearchInput): Promise<PoiOption[]>;
  semanticSearch(input: SemanticTravelSearchInput): Promise<TravelSearchResult[]>;
}
```

### 8.3 数据模型归一化

FlyAI 返回数据不应直接进入前端。建议归一化为 TravelAI 自己的候选项模型：

```ts
type Provider = "flyai";

interface ProviderMeta {
  provider: Provider;
  rawProvider: "fliggy";
  queryTime: string;
  sourceMessage?: string;
  raw?: unknown;
}

interface BookableOption {
  id: string;
  type: "flight" | "train" | "hotel" | "poi" | "package" | "unknown";
  title: string;
  imageUrl?: string;
  bookingUrl?: string;
  price?: {
    amount?: number;
    currency: "CNY";
    raw?: string;
  };
  rating?: string;
  tags?: string[];
  providerMeta: ProviderMeta;
}
```

### 8.4 缓存策略

不同品类的时效性不同：

| 品类 | 建议缓存 |
|------|----------|
| 机票 / 火车票 | 短缓存，1 到 5 分钟，或不缓存 |
| 酒店 | 5 到 30 分钟，价格与库存需提示以跳转页为准 |
| POI / 景点 | 1 到 24 小时，视是否含票价 / 库存 |
| 关键词 / AI 搜索 | 5 到 30 分钟，按 query hash 缓存 |

所有结果都应带 `queryTime`，前端提示「价格和库存以飞猪页面为准」。

### 8.5 超时与降级

建议：

- 单次 CLI 调用超时：10 到 20 秒。
- 失败时返回「暂无实时结果」，不要让模型编造候选项。
- 对行程生成主流程，FlyAI 失败不应阻断行程草案生成，但相关交通 / 酒店区块必须标「未核验」。
- 日志记录命令、参数、耗时、状态码、stderr 摘要，不记录用户敏感身份信息。

---

## 9. 实现优先级建议

### 9.1 P0：验证型接入

目标：证明 FlyAI 能为 TravelAI 提供可用候选。

范围：

- 后端封装 `keyword-search`、`search-hotel`、`search-flight`、`search-train`。
- 支持 API 调用并返回归一化结构。
- 前端展示卡片、来源、查询时间、跳转链接。
- 加超时、错误提示、基础日志。

### 9.2 P1：行程生成联动

目标：让 AI 行程草案关联真实候选。

范围：

- 生成行程草案后，根据目的地 / 日期自动查询酒店、交通、POI。
- 对每个推荐项标注「已核验 / 未核验」。
- 用户可把 FlyAI 候选添加到某天行程或住宿区块。

### 9.3 P2：正式 Key 与生产化

目标：进入可上线状态。

范围：

- 申请正式 `FLYAI_API_KEY`。
- 明确商用条款和展示归因。
- 建立限流、缓存、监控。
- 做 mock fixture，避免测试依赖实时外部服务。

---

## 10. 风险与待确认问题

| 风险 / 问题 | 影响 | 建议 |
|-------------|------|------|
| 体验模式结果受限 | 价格、库存、数量可能不足 | 正式接入前申请 API Key |
| 字段不稳定 | 前端展示和解析易出错 | 做 provider adapter 和 schema 容错 |
| CLI 子进程性能 | 高并发下成本高 | MVP 可接受，生产评估 HTTP / SDK |
| 商用条款不明 | 上线与变现存在合规风险 | 联系飞猪 AI 开放平台确认 |
| 预订闭环不在站内 | 无法掌握支付与订单状态 | 产品上定义为「跳转预订 / 核验」 |
| 数据价格可能为空 | 无法承诺实时比价 | UI 明确「以跳转页为准」 |
| 国际目的地覆盖未知 | 出境游质量不稳定 | 按目的地做样例测试集 |
| Key 存储与安全 | 泄露风险 | 后端环境变量管理，不下发前端 |

---

## 11. 建议测试用例

正式技术实现前，建议维护一组固定测试 query：

| 场景 | 命令示例 | 预期 |
|------|----------|------|
| 国内酒店 | `search-hotel --dest-name "杭州" --poi-name "西湖"` | 返回酒店、图片、跳转链接 |
| 国内机票 | `search-flight --origin "上海" --destination "北京" --dep-date <未来日期>` | 返回航班候选 |
| 国内火车 | `search-train --origin "上海" --destination "杭州" --dep-date <未来日期>` | 返回车次候选 |
| POI | `search-poi --city-name "成都" --category "自然风光"` | 返回景点候选 |
| 复杂意图 | `ai-search --query "端午杭州三日游，人均2000，住西湖附近"` | 返回混合候选 |
| 无结果 / 异常 | 输入不存在城市或过期日期 | 不崩溃，返回可理解错误 |

测试日期必须使用未来日期，避免被库存和时效影响误判。当前文档日期为 2026-05-10。

---

## 12. 对产品话术的影响

可使用：

- 「接入 FlyAI / 飞猪实时结果，提供可跳转核验的交通、住宿、景点候选。」
- 「价格、库存和预订状态以飞猪跳转页为准。」
- 「无实时数据时明确标注未核验。」

不建议使用：

- 「站内完成全品类预订闭环。」
- 「保证最低价。」
- 「保证所有航班、车次、酒店库存实时准确。」
- 「自动读取飞猪订单。」

---

## 13. 后续行动清单

1. 建立 `FlyAIAdapter` 技术 spike，先封装 CLI 调用和 JSON 解析。
2. 申请或评估 `FLYAI_API_KEY`，确认体验模式与正式模式差异。
3. 设计 TravelAI 内部 `BookableOption` / `TransportOption` / `HotelOption` 模型。
4. 准备固定测试集，覆盖国内、出境、无结果、异常、慢请求。
5. 明确 UI 展示：来源、查询时间、跳转按钮、价格库存免责声明。
6. 确认商用条款、Logo / 品牌露出、缓存与归因要求。

---

## 14. 参考资料

- [GitHub: alibaba-flyai/flyai-skill](https://github.com/alibaba-flyai/flyai-skill)
- [flyai-skill README](https://raw.githubusercontent.com/alibaba-flyai/flyai-skill/main/README.md)
- [flyai Skill 定义](https://raw.githubusercontent.com/alibaba-flyai/flyai-skill/main/skills/flyai/SKILL.md)
- [36氪：打造智能出行管家、开发主题游，飞猪“flyai”旅行skill助力开发者百倍级提效](https://36kr.com/p/3737995187503360)
- [环球旅讯：飞猪发布首个全品类旅行skill](https://www.traveldaily.cn/article/189568/)
- npm 包：`@fly-ai/flyai-cli`

