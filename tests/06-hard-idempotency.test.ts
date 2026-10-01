import { describe, expect, it } from "vitest";
import { ITEM, setup } from "./helpers.js";

describe("Task 6 (hard): Idempotency-Key on POST /orders", () => {
  it("replaying the same key returns the original order, no duplicate", async () => {
    const { as, store } = setup();
    const before = store.orders.size;
    const staff = as("acme-staff");

    const a = await staff.post("/orders").set("Idempotency-Key", "k1").send({ items: [ITEM] }).expect(201);
    const b = await staff.post("/orders").set("Idempotency-Key", "k1").send({ items: [ITEM] }).expect(201);

    expect(b.body.id).toBe(a.body.id);
    expect(store.orders.size).toBe(before + 1);
  });

  it("concurrent requests with the same key create exactly one order", async () => {
    const { as, store } = setup();
    const before = store.orders.size;
    const staff = as("acme-staff");

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        staff.post("/orders").set("Idempotency-Key", "k2").send({ items: [ITEM] }),
      ),
    );

    const ids = new Set(results.filter((r) => r.status === 201).map((r) => r.body.id));
    expect(ids.size).toBe(1);
    expect(store.orders.size).toBe(before + 1);
  });

  it("same key with a different body is rejected with 422", async () => {
    const { as } = setup();
    const staff = as("acme-staff");
    await staff.post("/orders").set("Idempotency-Key", "k3").send({ items: [ITEM] }).expect(201);
    await staff
      .post("/orders")
      .set("Idempotency-Key", "k3")
      .send({ items: [{ ...ITEM, quantity: 3 }] })
      .expect(422);
  });

  it("keys are scoped per tenant", async () => {
    const { as } = setup();
    const a = await as("acme-staff").post("/orders").set("Idempotency-Key", "k4").send({ items: [ITEM] }).expect(201);
    const b = await as("globex-admin").post("/orders").set("Idempotency-Key", "k4").send({ items: [ITEM] }).expect(201);
    expect(b.body.id).not.toBe(a.body.id);
    expect(b.body.tenantId).toBe("globex");
  });

  it("requests without a key are not deduplicated", async () => {
    const { as } = setup();
    const staff = as("acme-staff");
    const a = await staff.post("/orders").send({ items: [ITEM] }).expect(201);
    const b = await staff.post("/orders").send({ items: [ITEM] }).expect(201);
    expect(b.body.id).not.toBe(a.body.id);
  });
});
