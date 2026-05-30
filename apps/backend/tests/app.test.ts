import request from "supertest";
import { createApp } from "../src/app";

describe("app response envelope", () => {
  it("returns health in the standard envelope", async () => {
    const response = await request(createApp()).get("/health").expect(200);

    expect(response.body).toEqual({
      success: true,
      data: { status: "ok" },
      error: null,
      meta: null
    });
  });

  it("returns not found errors in the standard envelope", async () => {
    const response = await request(createApp()).get("/v1/missing").expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.data).toBeNull();
    expect(response.body.error.code).toBe("NOT_FOUND");
    expect(response.body.meta).toBeNull();
  });
});
