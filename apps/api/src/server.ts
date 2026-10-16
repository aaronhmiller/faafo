import { createServer } from "node:http";
import { openDatabase } from "./db/database.js";
import { createHandler } from "./http/app.js";
import { SqliteMenuRepository } from "./repositories/menu-repository.js";
import { SqliteOrderRepository } from "./repositories/order-repository.js";
import { OrderService } from "./services/order-service.js";

const port = Number(process.env.PORT ?? 3001);
const databasePath = process.env.DATABASE_PATH ?? "./data/verdant.db";
const kioskOrigin = process.env.KIOSK_ORIGIN ?? "http://localhost:5173";

const db = await openDatabase(databasePath);
const menu = new SqliteMenuRepository(db);
const orders = new SqliteOrderRepository(db);
const server = createServer(createHandler({ menu, orderService: new OrderService(menu, orders), kioskOrigin }));

server.listen(port, () => console.log(`Verdant API listening on http://localhost:${port}`));

/** Stop accepting requests, close SQLite after pending requests finish, and exit. */
function shutdown(): void {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
