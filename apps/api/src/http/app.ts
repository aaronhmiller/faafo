import type { IncomingMessage, ServerResponse } from "node:http";
import { MENU_CATEGORIES, parseCreateOrder, parseRecommendationRequest, type ApiError, type MenuResponse } from "@verdant/contracts";
import type { MenuRepository } from "../repositories/menu-repository.js";
import { MenuItemUnavailableError, type OrderService } from "../services/order-service.js";
import type { RecommendationService } from "../services/recommendation-service.js";

interface Dependencies {
  menu: MenuRepository;
  orderService: OrderService;
  recommendationService: RecommendationService;
  kioskOrigin: string;
}

export function createHandler(dependencies: Dependencies) {
  return async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
    setCorsHeaders(response, dependencies.kioskOrigin);
    if (request.method === "OPTIONS") return send(response, 204);

    const url = new URL(request.url ?? "/", "http://localhost");
    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return send(response, 200, { status: "ok" });
      }
      if (request.method === "GET" && url.pathname === "/api/menu") {
        const payload: MenuResponse = { categories: [...MENU_CATEGORIES], items: dependencies.menu.listAvailable() };
        return send(response, 200, payload);
      }
      if (request.method === "POST" && url.pathname === "/api/orders") {
        const input = parseCreateOrder(await readJson(request));
        return send(response, 201, dependencies.orderService.create(input));
      }
      if (request.method === "POST" && url.pathname === "/api/recommendations") {
        const input = parseRecommendationRequest(await readJson(request));
        return send(response, 200, await dependencies.recommendationService.recommend(input));
      }
      return send(response, 404, apiError("not_found", "Route not found."));
    } catch (error) {
      if (error instanceof MenuItemUnavailableError) return send(response, 409, apiError("item_unavailable", error.message));
      if (error instanceof SyntaxError || (error instanceof Error && /order|mood|Dietary|Cart item/.test(error.message))) {
        return send(response, 400, apiError("invalid_request", error instanceof Error ? error.message : "Invalid request."));
      }
      console.error("Unhandled request error", error);
      return send(response, 500, apiError("internal_error", "We could not complete that order."));
    }
  };
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > 32_768) throw new SyntaxError("Request body is too large.");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function setCorsHeaders(response: ServerResponse, origin: string): void {
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Headers", "content-type");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Vary", "Origin");
}

function apiError(code: string, message: string): ApiError {
  return { error: { code, message } };
}

function send(response: ServerResponse, status: number, payload?: unknown): void {
  response.statusCode = status;
  if (payload === undefined) {
    response.end();
    return;
  }
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}
