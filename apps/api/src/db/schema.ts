export const schema = `
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('coffee', 'tea', 'bakery')),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  accent TEXT NOT NULL,
  icon TEXT NOT NULL,
  dietary_flags TEXT NOT NULL DEFAULT '',
  featured INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('received', 'preparing', 'ready')),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS order_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL REFERENCES menu_items(id),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0)
);
CREATE TABLE IF NOT EXISTS recommendation_events (
  trace_id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('ai', 'fallback')),
  mood TEXT NOT NULL,
  dietary_flags TEXT NOT NULL,
  candidate_count INTEGER NOT NULL,
  result_ids TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  created_at TEXT NOT NULL
);`;
