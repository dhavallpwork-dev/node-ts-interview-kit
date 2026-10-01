import type { DeliverySlot, Order, OrderItem } from "./types.js";

// Simulates network latency to a real database. Every store call is async.
const latency = () => new Promise((r) => setTimeout(r, Math.random() * 5));

export type BookSlotError =
  | "slot_not_found"
  | "order_not_found"
  | "slot_full"
  | "order_already_booked";

export class Store {
  orders = new Map<string, Order>();
  slots = new Map<string, DeliverySlot>();
  private seq = 0;
  private slotBookingTail = new Map<string, Promise<void>>();
  private idempotencyTail = new Map<string, Promise<void>>();
  private idempotencyKeys = new Map<string, { bodyHash: string; orderId: string }>();

  nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}_${this.seq}`;
  }

  async listOrders(tenantId: string): Promise<Order[]> {
    await latency();
    return [...this.orders.values()]
      .filter((o) => o.tenantId === tenantId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    await latency();
    return this.orders.get(id);
  }

  async saveOrder(order: Order): Promise<Order> {
    await latency();
    this.orders.set(order.id, { ...order });
    return order;
  }

  async getSlot(id: string): Promise<DeliverySlot | undefined> {
    await latency();
    const slot = this.slots.get(id);
    return slot ? { ...slot } : undefined;
  }

  async saveSlot(slot: DeliverySlot): Promise<DeliverySlot> {
    await latency();
    this.slots.set(slot.id, { ...slot });
    return slot;
  }

  private runSerialized<T>(slotId: string, work: () => Promise<T>): Promise<T> {
    const tail = this.slotBookingTail.get(slotId) ?? Promise.resolve();
    const run = tail.then(work, work);
    this.slotBookingTail.set(
      slotId,
      run.then(
        () => undefined,
        () => undefined,
      ),
    );
    return run;
  }

  static hashOrderItems(items: OrderItem[]): string {
    return JSON.stringify(items);
  }

  private runIdempotencySerialized<T>(tenantId: string, key: string, work: () => Promise<T>): Promise<T> {
    const id = `${tenantId}:${key}`;
    const tail = this.idempotencyTail.get(id) ?? Promise.resolve();
    const run = tail.then(work, work);
    this.idempotencyTail.set(
      id,
      run.then(
        () => undefined,
        () => undefined,
      ),
    );
    return run;
  }

  async createOrderIdempotent(
    tenantId: string,
    idempotencyKey: string,
    items: OrderItem[],
    createOrder: () => Promise<Order>,
  ): Promise<{ ok: true; order: Order } | { ok: false; error: "body_mismatch" }> {
    const bodyHash = Store.hashOrderItems(items);
    return this.runIdempotencySerialized(tenantId, idempotencyKey, async () => {
      const recordId = `${tenantId}:${idempotencyKey}`;
      const existing = this.idempotencyKeys.get(recordId);
      if (existing) {
        if (existing.bodyHash !== bodyHash) {
          return { ok: false as const, error: "body_mismatch" };
        }
        const order = (await this.getOrder(existing.orderId))!;
        return { ok: true as const, order };
      }

      const order = await createOrder();
      this.idempotencyKeys.set(recordId, { bodyHash, orderId: order.id });
      return { ok: true as const, order };
    });
  }

  async bookSlot(
    slotId: string,
    orderId: string,
    tenantId: string,
  ): Promise<
    | { ok: true; slot: DeliverySlot; order: Order }
    | { ok: false; error: BookSlotError }
  > {
    return this.runSerialized(slotId, async () => {
      await latency();
      const slot = this.slots.get(slotId);
      if (!slot || slot.tenantId !== tenantId) {
        return { ok: false as const, error: "slot_not_found" };
      }

      await latency();
      const order = this.orders.get(orderId);
      if (!order || order.tenantId !== tenantId) {
        return { ok: false as const, error: "order_not_found" };
      }
      if (order.slotId) {
        return { ok: false as const, error: "order_already_booked" };
      }
      if (slot.booked >= slot.capacity) {
        return { ok: false as const, error: "slot_full" };
      }

      slot.booked += 1;
      order.slotId = slot.id;
      order.status = "confirmed";
      this.slots.set(slot.id, { ...slot });
      this.orders.set(order.id, { ...order });

      return { ok: true as const, slot: { ...slot }, order: { ...order } };
    });
  }
}
