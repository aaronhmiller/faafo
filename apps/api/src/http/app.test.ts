import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { it } from "node:test";
import type { MenuResponse, Order } from "@verdant/contracts";
import { openDatabase } from "../db/database.js";
import { SqliteMenuRepository } from "../repositories/menu-repository.js";
import { SqliteOrderRepository } from "../repositories/order-repository.js";
import { OrderService } from "../services/order-service.js";
import { createHandler } from "./app.js";

it("initializes only ordering tables with a nonempty menu", async (t) => {
  const db = await openDatabase(":memory:");
  t.after(() => db.close());

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
  assert.deepEqual(tables.map((table) => table.name), ["menu_items", "order_lines", "orders"]);
  assert.ok(new SqliteMenuRepository(db).listAvailable().length > 0);
});

it("serves menu and orders while removed lab endpoints return 404", async (t) => {
  const db = await openDatabase(":memory:");
  t.after(() => db.close());
  const menu = new SqliteMenuRepository(db);
  const orders = new SqliteOrderRepository(db);
  const kioskOrigin = "http://localhost:5173";
  const server = createServer(createHandler({ menu, orderService: new OrderService(menu, orders), kioskOrigin }));
  t.after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  for (const [method, path] of [
    ["POST", "/api/loyalty/login"],
    ["GET", "/api/loyalty/customers/1"],
    ["PATCH", "/api/loyalty/customers/1"],
    ["POST", "/api/loyalty/password-reminder"],
    ["GET", "/api/admin/customers"],
    ["GET", "/api/admin/session-debug"]
  ] as const) {
    const response = await fetch(`${baseUrl}${path}`, { method });
    assert.equal(response.status, 404, `${method} ${path}`);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), kioskOrigin);
    assert.equal(response.headers.get("Access-Control-Allow-Credentials"), null);
    assert.deepEqual(await response.json(), { error: { code: "not_found", message: "Route not found." } });
  }

  const menuResponse = await fetch(`${baseUrl}/api/menu`);
  assert.equal(menuResponse.status, 200);
  const { items } = await menuResponse.json() as MenuResponse;
  const item = items[0]!;
  const orderResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines: [{ menuItemId: item.id, quantity: 2 }] })
  });
  assert.equal(orderResponse.status, 201);
  const order = await orderResponse.json() as Order;
  assert.equal(order.totalCents, item.priceCents * 2);
  const persisted = db.prepare("SELECT total_cents FROM orders WHERE id = ?").get(order.id);
  assert.equal(persisted?.total_cents, order.totalCents);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM order_lines WHERE order_id = ?").get(order.id)?.count, 1);
});
