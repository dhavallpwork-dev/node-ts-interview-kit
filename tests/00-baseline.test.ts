import request from "supertest";
import { describe, expect, it } from "vitest";
import { ITEM, setup } from "./helpers.js";

describe("baseline (should already pass)", () => {
  it("health is public", async () => {
    const { app } = setup();
    await request(app).get("/health").expect(200, { ok: true });
  });

  it("rejects missing token", async () => {
    const { app } = setup();
    await request(app).get("/orders").expect(401);
  });

  it("creates an order and computes the total", async () => {
    const { as } = setup();
    const res = await as("acme-staff").post("/orders").send({ items: [ITEM] }).expect(201);
    expect(res.body.totalCents).toBe(1000);
    expect(res.body.tenantId).toBe("acme");
  });
});
