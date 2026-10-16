import type { CreateOrderRequest, MenuResponse, Order } from "@verdant/contracts";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

/** Fetch JSON from the configured API and surface its public error message on failure. */
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
  /** Fetch the available menu and category list. */
  menu: () => request<MenuResponse>("/api/menu"),
  /** Submit item identifiers and quantities for authoritative pricing and order creation. */
  createOrder: (body: CreateOrderRequest) => request<Order>("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
};
