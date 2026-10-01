import { describe, expect, it } from "vitest";
import { setup } from "./helpers.js";

describe("Task 1 (easy): pagination", () => {
  it("page 1 starts at the first order", async () => {
    const { as, store } = setup();
    const all = await store.listOrders("acme");
    const res = await as("acme-admin").get("/orders?page=1&limit=5").expect(200);
    expect(res.body.data.map((o: any) => o.id)).toEqual(all.slice(0, 5).map((o) => o.id));
  });

  it("last partial page returns the remainder", async () => {
    const { as } = setup();
    // acme has 20 seeded orders
    const res = await as("acme-admin").get("/orders?page=3&limit=8").expect(200);
    expect(res.body.data).toHaveLength(4);
  });

  it("rejects page < 1 and limit outside 1..100 with 400", async () => {
    const { as } = setup();
    await as("acme-admin").get("/orders?page=0").expect(400);
    await as("acme-admin").get("/orders?limit=0").expect(400);
    await as("acme-admin").get("/orders?limit=101").expect(400);
    await as("acme-admin").get("/orders?page=abc").expect(400);
  });
});
