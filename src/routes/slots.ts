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
    const result = await store.bookSlot(req.params.id, req.body.orderId, req.user!.tenantId);

    if (!result.ok) {
      if (result.error === "slot_not_found" || result.error === "order_not_found") {
        return res.status(404).json({ error: result.error });
      }
      return res.status(409).json({ error: result.error });
    }

    res.json({ slot: result.slot, order: result.order });
  });

  return r;
}
