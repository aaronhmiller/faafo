export const MENU_CATEGORIES = ["coffee", "tea", "bakery"] as const;

export type MenuCategory = (typeof MENU_CATEGORIES)[number];

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: MenuCategory;
  priceCents: number;
  accent: string;
  icon: string;
  featured: boolean;
}

export interface MenuResponse {
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface OrderLineInput {
  menuItemId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  lines: OrderLineInput[];
}

export interface OrderLine {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface Order {
  id: string;
  status: "received" | "preparing" | "ready";
  totalCents: number;
  createdAt: string;
  lines: OrderLine[];
}

export interface ApiError {
  error: { code: string; message: string };
}

export function parseCreateOrder(value: unknown): CreateOrderRequest {
  if (!isRecord(value) || !Array.isArray(value.lines) || value.lines.length === 0 || value.lines.length > 20) {
    throw new Error("An order must contain between 1 and 20 lines.");
  }

  const lines = value.lines.map((line) => {
    if (!isRecord(line) || typeof line.menuItemId !== "string" || !/^[a-z0-9-]{1,40}$/.test(line.menuItemId)) {
      throw new Error("Every line needs a valid menu item id.");
    }
    if (!Number.isInteger(line.quantity) || (line.quantity as number) < 1 || (line.quantity as number) > 20) {
      throw new Error("Line quantities must be whole numbers between 1 and 20.");
    }
    return { menuItemId: line.menuItemId, quantity: line.quantity as number };
  });

  return { lines };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
