import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("mock backend api", () => {
  it("returns health status", async () => {
    const app = createApp();
    const response = await request(app).get("/api/health").expect(200);

    expect(response.body.status).toBe("ok");
    expect(response.body.providerMode).toBe("mock");
  });

  it("creates and reuses an anonymous session", async () => {
    const app = createApp();
    const agent = request.agent(app);

    const first = await agent.get("/api/session").expect(200);
    const second = await agent.get("/api/session").expect(200);

    expect(first.headers["set-cookie"]).toBeDefined();
    expect(first.body.isNew).toBe(true);
    expect(second.body.isNew).toBe(false);
    expect(second.body.anonymousUserId).toBe(first.body.anonymousUserId);
  });

  it("creates, lists, reads, chats in, and archives a conversation", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.get("/api/session").expect(200);

    const created = await agent
      .post("/api/conversations")
      .send({ title: "上海到东京机票" })
      .expect(201);

    const conversationId = created.body.conversationId;
    const listed = await agent.get("/api/conversations").expect(200);
    expect(listed.body.items).toHaveLength(1);

    const chat = await agent
      .post("/api/chat")
      .send({
        conversationId,
        content: "我想 6 月底从上海去东京玩 5 天，两个人，预算别太贵"
      })
      .expect(200);

    expect(chat.body.assistantMessage.type).toBe("result");
    expect(chat.body.cards).toHaveLength(3);

    const detail = await agent.get(`/api/conversations/${conversationId}`).expect(200);
    expect(detail.body.messages).toHaveLength(2);
    expect(detail.body.latestCards).toHaveLength(3);

    await agent.delete(`/api/conversations/${conversationId}`).expect(200);
    const afterDelete = await agent.get("/api/conversations").expect(200);
    expect(afterDelete.body.items).toHaveLength(0);
  });

  it("returns no_result and no cards for fabrication requests", async () => {
    const app = createApp();
    const agent = request.agent(app);
    const created = await agent.post("/api/conversations").send({}).expect(201);

    const response = await agent
      .post("/api/chat")
      .send({
        conversationId: created.body.conversationId,
        content: "随便编一个最便宜航班"
      })
      .expect(200);

    expect(response.body.assistantMessage.type).toBe("no_result");
    expect(response.body.cards).toHaveLength(0);
  });

  it("hides conversations from other anonymous users", async () => {
    const app = createApp();
    const owner = request.agent(app);
    const stranger = request.agent(app);

    const created = await owner.post("/api/conversations").send({}).expect(201);

    await stranger.get(`/api/conversations/${created.body.conversationId}`).expect(404);
    await stranger
      .post("/api/chat")
      .send({
        conversationId: created.body.conversationId,
        content: "帮我看机票"
      })
      .expect(404);
  });
});
