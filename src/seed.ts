import { Store } from "./store.js";
import type { User } from "./types.js";

// Bearer token -> user. Stand-in for real auth.
export const TOKENS: Record<string, User> = {
  "acme-admin": { id: "u_acme_admin", tenantId: "acme", role: "admin" },
  "acme-staff": { id: "u_acme_staff", tenantId: "acme", role: "staff" },
  "acme-viewer": { id: "u_acme_viewer", tenantId: "acme", role: "viewer" },
  "globex-admin": { id: "u_globex_admin", tenantId: "globex", role: "admin" },
};

export function seed(store: Store): Store {
  const base = Date.parse("2026-01-01T00:00:00Z");
  for (let i = 0; i < 25; i++) {
    const tenantId = i % 5 === 0 ? "globex" : "acme";
    const id = store.nextId("ord");
    store.orders.set(id, {
      id,
      tenantId,
      createdBy: tenantId === "acme" ? "u_acme_staff" : "u_globex_admin",
      items: [{ sku: `SKU-${i}`, quantity: 1, unitPriceCents: 1000 + i }],
      totalCents: 1000 + i,
      status: "pending",
      slotId: null,
      createdAt: new Date(base + i * 60_000).toISOString(),
    });
  }
  store.slots.set("slot_acme_noon", {
    id: "slot_acme_noon",
    tenantId: "acme",
    startsAt: "2026-01-02T12:00:00Z",
    capacity: 5,
    booked: 0,
  });
  store.slots.set("slot_globex_noon", {
    id: "slot_globex_noon",
    tenantId: "globex",
    startsAt: "2026-01-02T12:00:00Z",
    capacity: 5,
    booked: 0,
  });
  return store;
}
