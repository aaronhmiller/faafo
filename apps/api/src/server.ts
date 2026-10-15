import { createServer } from "node:http";
import { openDatabase } from "./db/database.js";
import { createHandler } from "./http/app.js";
import { SqliteMenuRepository } from "./repositories/menu-repository.js";
import { SqliteOrderRepository } from "./repositories/order-repository.js";
import { OrderService } from "./services/order-service.js";
import { HeuristicRecommendationProvider } from "./ai/heuristic-provider.js";
import { JsonAiRecommendationProvider } from "./ai/json-ai-provider.js";
import { SqliteRecommendationAuditRepository } from "./repositories/recommendation-audit-repository.js";
import { RecommendationService } from "./services/recommendation-service.js";

const port = Number(process.env.PORT ?? 3001);
const databasePath = process.env.DATABASE_PATH ?? "./data/verdant.db";
const kioskOrigin = process.env.KIOSK_ORIGIN ?? "http://localhost:5173";

const db = await openDatabase(databasePath);
const menu = new SqliteMenuRepository(db);
const orders = new SqliteOrderRepository(db);
const fallback = new HeuristicRecommendationProvider();
const primary = process.env.AI_RECOMMENDATIONS_URL && process.env.AI_API_KEY
  ? new JsonAiRecommendationProvider({ endpoint: process.env.AI_RECOMMENDATIONS_URL, apiKey: process.env.AI_API_KEY, model: process.env.AI_MODEL ?? "small-recommendation-model" })
  : fallback;
const recommendationService = new RecommendationService(menu, primary, fallback, new SqliteRecommendationAuditRepository(db));
const server = createServer(createHandler({ menu, orderService: new OrderService(menu, orders), recommendationService, kioskOrigin }));

server.listen(port, () => console.log(`Verdant API listening on http://localhost:${port}`));

function shutdown(): void {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
