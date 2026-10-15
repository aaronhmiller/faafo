import type { DatabaseSync } from "node:sqlite";

const items = [
  ["sunrise-latte", "Sunrise Latte", "Espresso, orange blossom, oat milk", "coffee", 625, "#e7683d", "☀", 1],
  ["cloud-cappuccino", "Cloud Cappuccino", "Double espresso and silky microfoam", "coffee", 525, "#70483d", "☁", 1],
  ["garden-cold-brew", "Garden Cold Brew", "18-hour brew, rosemary vanilla cream", "coffee", 575, "#3f6555", "❋", 0],
  ["matcha-mist", "Matcha Mist", "Ceremonial matcha, coconut, sea salt", "tea", 650, "#759b65", "◌", 1],
  ["hibiscus-sparkler", "Hibiscus Sparkler", "Tart hibiscus, lime, sparkling water", "tea", 500, "#bd4e62", "✦", 0],
  ["butter-croissant", "Butter Croissant", "Flaky, cultured butter, baked in-house", "bakery", 425, "#d69a43", "◒", 0],
  ["pistachio-bun", "Pistachio Morning Bun", "Cardamom sugar and pistachio cream", "bakery", 550, "#8a9a5b", "◎", 1]
] as const;

export function seedMenu(db: DatabaseSync): void {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO menu_items
      (id, name, description, category, price_cents, accent, icon, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of items) insert.run(...item);
}
