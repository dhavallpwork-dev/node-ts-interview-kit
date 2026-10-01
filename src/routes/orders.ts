import { Router } from "express";
import { requireRole } from "../auth.js";
import type { Store } from "../store.js";
import type { Order, OrderItem } from "../types.js";

export function ordersRouter(store: Store): Router {
  const r = Router();

  // GET /orders?page=1&limit=10
  r.get("/", async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const all = await store.listOrders(req.user!.tenantId);
    const offset = page * limit;
    res.json({
      page,
      limit,
      total: all.length,
      data: all.slice(offset, offset + limit),
    });
  });

  r.get("/:id", async (req, res) => {
    const order = await store.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: "not_found" });
    res.json(order);
  });

  // POST /orders  { items: [{ sku, quantity, unitPriceCents }] }
  r.post("/", requireRole("admin", "staff"), async (req, res) => {
    const items: OrderItem[] = req.body.items;
    const order: Order = {
      id: store.nextId("ord"),
      tenantId: req.user!.tenantId,
      createdBy: req.user!.id,
      items,
      totalCents: items.reduce((sum, i) => sum + i.quantity * i.unitPriceCents, 0),
      status: "pending",
      slotId: null,
      createdAt: new Date().toISOString(),
    };
    await store.saveOrder(order);
    res.status(201).json(order);
  });

  r.post("/:id/cancel", requireRole("admin"), async (req, res) => {
    const order = await store.getOrder(req.params.id);
    if (!order || order.tenantId !== req.user!.tenantId) {
      return res.status(404).json({ error: "not_found" });
    }
    order.status = "cancelled";
    await store.saveOrder(order);
    res.json(order);
  });

  return r;
}
