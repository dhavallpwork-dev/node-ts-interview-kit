import { describe, it } from "vitest";
import { ITEM, setup } from "./helpers.js";

describe("Task 2 (easy): validate POST /orders body", () => {
  const bad = [
    ["missing items", {}],
    ["empty items", { items: [] }],
    ["zero quantity", { items: [{ ...ITEM, quantity: 0 }] }],
    ["fractional quantity", { items: [{ ...ITEM, quantity: 1.5 }] }],
    ["negative price", { items: [{ ...ITEM, unitPriceCents: -1 }] }],
    ["missing sku", { items: [{ quantity: 1, unitPriceCents: 100 }] }],
  ] as const;

  for (const [name, body] of bad) {
    it(`400 on ${name}`, async () => {
      const { as } = setup();
      await as("acme-staff").post("/orders").send(body).expect(400);
    });
  }
});
