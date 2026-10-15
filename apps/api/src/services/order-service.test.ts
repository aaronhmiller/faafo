import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MenuItem, Order } from "@verdant/contracts";
import type { MenuRepository } from "../repositories/menu-repository.js";
import type { OrderRepository } from "../repositories/order-repository.js";
import { MenuItemUnavailableError, OrderService } from "./order-service.js";

const latte: MenuItem = {
  id: "latte",
  name: "Latte",
  description: "Silky",
  category: "coffee",
  priceCents: 550,
  accent: "#fff",
  icon: "☕",
  featured: true
};

describe("OrderService", () => {
  it("merges duplicate lines and calculates authoritative totals", () => {
    let saved: Order | undefined;
    const menu: MenuRepository = {
      listAvailable: () => [latte],
      findAvailableByIds: (ids) => ids.includes(latte.id) ? [latte] : []
    };
    const orders: OrderRepository = { save: (order) => { saved = order; } };
    const service = new OrderService(menu, orders, () => new Date("2026-01-01T00:00:00Z"), () => "order-1");

    const order = service.create({ lines: [{ menuItemId: "latte", quantity: 1 }, { menuItemId: "latte", quantity: 2 }] });

    assert.equal(order.totalCents, 1650);
    assert.equal(order.lines[0]?.quantity, 3);
    assert.deepEqual(saved, order);
  });

  it("rejects unavailable menu items", () => {
    const menu: MenuRepository = { listAvailable: () => [], findAvailableByIds: () => [] };
    const service = new OrderService(menu, { save: () => assert.fail("should not save") });
    assert.throws(() => service.create({ lines: [{ menuItemId: "gone", quantity: 1 }] }), MenuItemUnavailableError);
  });
});
