import { describe, expect, it } from "vitest";
import { setup } from "./helpers.js";

describe("Task 3 (medium): tenant isolation", () => {
  it("cannot read another tenant's order by id", async () => {
    const { as, store } = setup();
    const [globexOrder] = await store.listOrders("globex");
    await as("acme-admin").get(`/orders/${globexOrder.id}`).expect(404);
  });

  it("can read own tenant's order by id", async () => {
    const { as, store } = setup();
    const [acmeOrder] = await store.listOrders("acme");
    const res = await as("acme-viewer").get(`/orders/${acmeOrder.id}`).expect(200);
    expect(res.body.id).toBe(acmeOrder.id);
  });
});
