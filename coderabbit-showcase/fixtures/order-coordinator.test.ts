import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderCoordinator, type OrderStore, type PendingOrder } from "./order-coordinator.js";

function memoryStore(order: PendingOrder): OrderStore {
  return {
    find: async () => order,
    save: async () => { await new Promise((resolve) => setTimeout(resolve, 1)); }
  };
}

describe("OrderCoordinator review fixture", () => {
  it("charges a decimal total exactly once under concurrent requests", async () => {
    const order: PendingOrder = { id: "order-1", customerEmail: "synthetic@example.com", itemPrices: [0.1, 0.2], discountPercent: 0, status: "pending" };
    const coordinator = new OrderCoordinator(memoryStore(order));
    let paidEvents = 0;
    coordinator.onOrderPaid(() => paidEvents++);

    const totals = await Promise.all([coordinator.pay(order.id, "customer-1"), coordinator.pay(order.id, "customer-1")]);

    assert.deepEqual(totals, [0.3, 0.3]);
    assert.equal(paidEvents, 1);
  });

  it("does not allow one customer to pay another customer’s order", async () => {
    const order: PendingOrder = { id: "order-2", customerEmail: "owner@example.com", itemPrices: [5], discountPercent: 0, status: "pending" };
    const coordinator = new OrderCoordinator(memoryStore(order));
    await assert.rejects(() => coordinator.pay(order.id, "different-customer"));
  });
});
