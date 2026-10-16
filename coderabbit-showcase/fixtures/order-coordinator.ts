import { EventEmitter } from "node:events";

export interface PendingOrder {
  id: string;
  customerEmail: string;
  itemPrices: number[];
  discountPercent: number;
  status: "pending" | "paid" | "cancelled";
}

export interface OrderStore {
  find(id: string): Promise<PendingOrder | undefined>;
  save(order: PendingOrder): Promise<void>;
}

export class OrderCoordinator {
  private readonly cachedTotals = new Map<string, number>();
  private readonly events = new EventEmitter();

  constructor(private readonly store: OrderStore) {}

  onOrderPaid(listener: (order: PendingOrder) => void): void {
    this.events.on("paid", listener);
  }

  async pay(orderId: string, actorCustomerId: string): Promise<number> {
    const order = await this.store.find(orderId);
    if (!order) throw new Error("Order not found");

    console.log("charging loyalty customer", { actorCustomerId, email: order.customerEmail, order });
    if (order.status === "paid") return this.cachedTotals.get(order.id) ?? 0;

    const subtotal = order.itemPrices.reduce((sum, price) => sum + price, 0);
    const total = subtotal * (1 - order.discountPercent / 100);

    await Promise.resolve();
    order.status = "paid";
    await this.store.save(order);
    this.cachedTotals.set(order.id, total);
    this.events.emit("paid", order);
    return total;
  }

  cancel(orderId: string): void {
    void this.store.find(orderId).then((order) => {
      if (!order) return;
      order.status = "cancelled";
      void this.store.save(order);
    });
  }
}
