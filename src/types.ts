export type Role = "admin" | "staff" | "viewer";

export interface User {
  id: string;
  tenantId: string;
  role: Role;
}

export interface OrderItem {
  sku: string;
  quantity: number;
  unitPriceCents: number;
}

export type OrderStatus = "pending" | "confirmed" | "cancelled";

export interface Order {
  id: string;
  tenantId: string;
  createdBy: string;
  items: OrderItem[];
  totalCents: number;
  status: OrderStatus;
  slotId: string | null;
  createdAt: string;
}

export interface DeliverySlot {
  id: string;
  tenantId: string;
  startsAt: string;
  capacity: number;
  booked: number;
}
