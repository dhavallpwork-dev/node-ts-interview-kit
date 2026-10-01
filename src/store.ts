import type { DeliverySlot, Order } from "./types.js";

// Simulates network latency to a real database. Every store call is async.
const latency = () => new Promise((r) => setTimeout(r, Math.random() * 5));

export class Store {
  orders = new Map<string, Order>();
  slots = new Map<string, DeliverySlot>();
  private seq = 0;

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
}
