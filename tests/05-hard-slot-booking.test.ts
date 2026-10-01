import { describe, expect, it } from "vitest";
import { ITEM, setup } from "./helpers.js";

describe("Task 5 (hard): delivery slots never overbook", () => {
  it("10 concurrent bookings into a capacity-5 slot: exactly 5 succeed", async () => {
    const { as, store } = setup();
    const staff = as("acme-staff");

    const orderIds: string[] = [];
    for (let i = 0; i < 10; i++) {
      const res = await staff.post("/orders").send({ items: [ITEM] }).expect(201);
      orderIds.push(res.body.id);
    }

    const results = await Promise.all(
      orderIds.map((orderId) => staff.post("/slots/slot_acme_noon/book").send({ orderId })),
    );

    const statuses = results.map((r) => r.status).sort();
    expect(statuses.filter((s) => s === 200)).toHaveLength(5);
    expect(statuses.filter((s) => s === 409)).toHaveLength(5);
    expect((await store.getSlot("slot_acme_noon"))!.booked).toBe(5);

    const confirmed = (await store.listOrders("acme")).filter((o) => o.slotId === "slot_acme_noon");
    expect(confirmed).toHaveLength(5);
  });

  it("booking the same order twice does not consume two seats", async () => {
    const { as, store } = setup();
    const staff = as("acme-staff");
    const { body: order } = await staff.post("/orders").send({ items: [ITEM] }).expect(201);

    await staff.post("/slots/slot_acme_noon/book").send({ orderId: order.id }).expect(200);
    await staff.post("/slots/slot_acme_noon/book").send({ orderId: order.id }).expect(409);

    expect((await store.getSlot("slot_acme_noon"))!.booked).toBe(1);
  });
});
