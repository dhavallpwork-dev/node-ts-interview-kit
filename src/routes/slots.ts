import { Router } from "express";
import { requireRole } from "../auth.js";
import type { Store } from "../store.js";

export function slotsRouter(store: Store): Router {
  const r = Router();

  r.get("/:id", async (req, res) => {
    const slot = await store.getSlot(req.params.id);
    if (!slot || slot.tenantId !== req.user!.tenantId) {
      return res.status(404).json({ error: "not_found" });
    }
    res.json(slot);
  });

  // POST /slots/:id/book  { orderId }
  r.post("/:id/book", requireRole("admin", "staff"), async (req, res) => {
    const tenantId = req.user!.tenantId;
    const slot = await store.getSlot(req.params.id);
    if (!slot || slot.tenantId !== tenantId) {
      return res.status(404).json({ error: "slot_not_found" });
    }
    const order = await store.getOrder(req.body.orderId);
    if (!order || order.tenantId !== tenantId) {
      return res.status(404).json({ error: "order_not_found" });
    }
    if (slot.booked >= slot.capacity) {
      return res.status(409).json({ error: "slot_full" });
    }

    slot.booked += 1;
    await store.saveSlot(slot);
    order.slotId = slot.id;
    order.status = "confirmed";
    await store.saveOrder(order);

    res.json({ slot, order });
  });

  return r;
}
