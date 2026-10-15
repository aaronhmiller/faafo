export const schema = `
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('coffee', 'tea', 'bakery')),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  accent TEXT NOT NULL,
  icon TEXT NOT NULL,
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

-- SECURITY REVIEW LAB: synthetic customer data for the intentionally vulnerable loyalty prototype.
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  home_address TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  private_note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  role TEXT NOT NULL,
  created_at TEXT NOT NULL
);`;
