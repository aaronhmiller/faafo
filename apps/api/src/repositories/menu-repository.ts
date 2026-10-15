import type { DatabaseSync } from "node:sqlite";
import type { MenuCategory, MenuItem } from "@verdant/contracts";

interface MenuRow {
  id: string;
  name: string;
  description: string;
  category: MenuCategory;
  price_cents: number;
  accent: string;
  icon: string;
  featured: number;
}

export interface MenuRepository {
  listAvailable(): MenuItem[];
  findAvailableByIds(ids: string[]): MenuItem[];
}

export class SqliteMenuRepository implements MenuRepository {
  constructor(private readonly db: DatabaseSync) {}

  listAvailable(): MenuItem[] {
    const rows = this.db.prepare("SELECT id, name, description, category, price_cents, accent, icon, featured FROM menu_items WHERE available = 1 ORDER BY featured DESC, name").all() as unknown as MenuRow[];
    return rows.map(mapMenuItem);
  }

  findAvailableByIds(ids: string[]): MenuItem[] {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => "?").join(",");
    const rows = this.db.prepare(`SELECT id, name, description, category, price_cents, accent, icon, featured FROM menu_items WHERE available = 1 AND id IN (${placeholders})`).all(...ids) as unknown as MenuRow[];
    return rows.map(mapMenuItem);
  }
}

function mapMenuItem(row: MenuRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    priceCents: row.price_cents,
    accent: row.accent,
    icon: row.icon,
    featured: row.featured === 1
  };
}
