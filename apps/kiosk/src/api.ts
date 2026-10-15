import type { CreateOrderRequest, MenuResponse, Order, RecommendationRequest, RecommendationResponse } from "@verdant/contracts";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  const payload = await response.json() as T | { error?: { message?: string } };
  if (!response.ok) {
    const message = "error" in (payload as object) ? (payload as { error?: { message?: string } }).error?.message : undefined;
    throw new Error(message ?? "Something went wrong. Please ask a barista for help.");
  }
  return payload as T;
}

export const api = {
  menu: () => request<MenuResponse>("/api/menu"),
  recommendations: (body: RecommendationRequest) => request<RecommendationResponse>("/api/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }),
  createOrder: (body: CreateOrderRequest) => request<Order>("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
};
