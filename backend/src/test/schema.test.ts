import { describe, expect, it } from "vitest";
import { ChatBodySchema, ListConversationsQuerySchema } from "../schemas/apiSchemas.js";

describe("api schemas", () => {
  it("rejects empty chat content", () => {
    const result = ChatBodySchema.safeParse({
      conversationId: "4fb0435d-166b-4188-b0e5-d892a3fd3345",
      content: ""
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty conversation id", () => {
    const result = ChatBodySchema.safeParse({
      conversationId: "",
      content: "hello"
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid conversation list limit", () => {
    const result = ListConversationsQuerySchema.safeParse({
      limit: "0"
    });

    expect(result.success).toBe(false);
  });
});
