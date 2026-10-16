import type { DatabaseSync } from "node:sqlite";
import type { Order } from "@verdant/contracts";

export interface OrderRepository {
  /** Persist an order and its price snapshots together. */
  save(order: Order): void;
}

export class SqliteOrderRepository implements OrderRepository {
  /** Use the supplied SQLite connection to persist orders. */
  constructor(private readonly db: DatabaseSync) {}

  /** Save the order and its lines atomically, rolling back on any failure. */
  save(order: Order): void {
    const insertOrder = this.db.prepare("INSERT INTO orders (id, status, total_cents, created_at) VALUES (?, ?, ?, ?)");
    const insertLine = this.db.prepare("INSERT INTO order_lines (order_id, menu_item_id, item_name, quantity, unit_price_cents) VALUES (?, ?, ?, ?, ?)");
    this.db.exec("BEGIN IMMEDIATE");
    try {
      insertOrder.run(order.id, order.status, order.totalCents, order.createdAt);
      for (const line of order.lines) {
        insertLine.run(order.id, line.menuItemId, line.name, line.quantity, line.unitPriceCents);
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}
