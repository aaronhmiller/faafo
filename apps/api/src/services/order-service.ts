import { randomUUID } from "node:crypto";
import type { CreateOrderRequest, Order } from "@verdant/contracts";
import type { MenuRepository } from "../repositories/menu-repository.js";
import type { OrderRepository } from "../repositories/order-repository.js";

export class MenuItemUnavailableError extends Error {}

export class OrderService {
  constructor(
    private readonly menu: MenuRepository,
    private readonly orders: OrderRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID
  ) {}

  create(input: CreateOrderRequest): Order {
    const quantityById = new Map<string, number>();
    for (const line of input.lines) {
      quantityById.set(line.menuItemId, (quantityById.get(line.menuItemId) ?? 0) + line.quantity);
    }
    const items = this.menu.findAvailableByIds([...quantityById.keys()]);
    if (items.length !== quantityById.size) throw new MenuItemUnavailableError("One or more items are unavailable.");

    const lines = items.map((item) => {
      const quantity = quantityById.get(item.id)!;
      return {
        menuItemId: item.id,
        name: item.name,
        quantity,
        unitPriceCents: item.priceCents,
        lineTotalCents: item.priceCents * quantity
      };
    });
    const order: Order = {
      id: this.createId(),
      status: "received",
      totalCents: lines.reduce((sum, line) => sum + line.lineTotalCents, 0),
      createdAt: this.now().toISOString(),
      lines
    };
    this.orders.save(order);
    return order;
  }
}
