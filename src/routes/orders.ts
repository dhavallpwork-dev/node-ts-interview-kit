import { Router } from "express";
import { requireRole } from "../auth.js";
import type { Store } from "../store.js";
import type { Order, OrderItem } from "../types.js";

export function ordersRouter(store: Store): Router {
  const r = Router();

  // GET /orders?page=1&limit=10
  r.get("/", async (req, res) => {
    if(!req.user) return res.status(401).json({ error: "unauthorized" });
    if(req.user.role !== "admin" && req.user.role !== "staff" && req.user.role !== "viewer") return res.status(403).json({ error: "forbidden" });
    //page
    const page = Number(req.query.page ?? 1);
    if(isNaN(page) || page < 1) return res.status(400).json({ error: "invalid_page" });

    const limit = Number(req.query.limit ?? 10);
    if(isNaN(limit) || limit < 1 || limit > 100) return res.status(400).json({ error: "invalid_limit" });

    const all = (await store.listOrders(req.user!.tenantId));
    const offset = (page - 1) * limit;
    const data = all.slice(offset, offset + limit);
    const totalPages = Math.ceil(all.length / limit);
    const remainder = all.length - offset - limit;
    
    res.json({ page, limit, total: all.length, data, totalPages, remainder });
  });

  r.get("/:id", async (req, res) => {
    const order = await store.getOrder(req.params.id);
    if (!order || order.tenantId !== req.user!.tenantId) return res.status(404).json({ error: "not_found" });
    res.json(order);
  });

  // POST /orders  { items: [{ sku, quantity, unitPriceCents }] }
  r.post("/", requireRole("admin", "staff"), async (req, res) => {
    const items: OrderItem[] = req.body.items;
    if(!items || items.length === 0) return res.status(400).json({ error: "no_items" });
    if(!items || !Array.isArray(items)) return res.status(400).json({ error: "invalid_items" });
    if(items.some(item => !item.sku || !item.quantity || !item.unitPriceCents)) return res.status(400).json({ error: "invalid_items" });
    if(items.some(item => item.quantity <= 0 || !Number.isInteger(item.quantity))) return res.status(400).json({ error: "invalid_items" });
    if(items.some(item => item.unitPriceCents <= 0)) return res.status(400).json({ error: "invalid_items" });
    if(items.some(item => item.unitPriceCents > 1000000)) return res.status(400).json({ error: "invalid_items" });
    if(items.some(item => item.unitPriceCents < 0)) return res.status(400).json({ error: "invalid_items" });
    if(items.some(item => item.unitPriceCents > 1000000)) return res.status(400).json({ error: "invalid_items" });

    const createOrder = async (): Promise<Order> => {
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
      return order;
    };

    const idempotencyKey = req.get("Idempotency-Key");
    if (idempotencyKey) {
      const result = await store.createOrderIdempotent(
        req.user!.tenantId,
        idempotencyKey,
        items,
        createOrder,
      );
      if (!result.ok) {
        return res.status(422).json({ error: "idempotency_key_mismatch" });
      }
      return res.status(201).json(result.order);
    }

    const order = await createOrder();
    res.status(201).json(order);
  });

  // POST /orders/:id/cancel
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
