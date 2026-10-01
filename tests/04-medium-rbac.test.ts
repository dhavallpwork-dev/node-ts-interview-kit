import { describe, expect, it } from "vitest";
import { ITEM, setup } from "./helpers.js";

describe("Task 4 (medium): role-based access", () => {
  it("viewer cannot create orders (403)", async () => {
    const { as } = setup();
    await as("acme-viewer").post("/orders").send({ items: [ITEM] }).expect(403);
  });

  it("staff cannot cancel orders (403)", async () => {
    const { as, store } = setup();
    const [order] = await store.listOrders("acme");
    await as("acme-staff").post(`/orders/${order.id}/cancel`).expect(403);
    expect((await store.getOrder(order.id))!.status).toBe("pending");
  });

  it("admin can cancel orders", async () => {
    const { as, store } = setup();
    const [order] = await store.listOrders("acme");
    const res = await as("acme-admin").post(`/orders/${order.id}/cancel`).expect(200);
    expect(res.body.status).toBe("cancelled");
  });
});
