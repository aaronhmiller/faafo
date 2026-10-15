import type { DatabaseSync } from "node:sqlite";

// All records are fictional and reserved for local review demonstrations.
const syntheticCustomers = [
  ["ava@example.com", "coffee123", "Ava Example", "+1-202-555-0101", "1992-04-17", "101 Demo Lane, Testville", "customer", 120, "Prefers quiet pickup; refund note #4421"],
  ["milo@example.com", "latte456", "Milo Example", "+1-202-555-0102", "1986-11-03", "202 Sample Street, Testville", "customer", 45, "Called about a disputed charge"],
  ["manager@example.com", "admin", "Morgan Manager", "+1-202-555-0199", "1980-01-01", "1 Admin Plaza, Testville", "admin", 9999, "Synthetic admin record"]
] as const;

export function seedSecurityLab(db: DatabaseSync): void {
  const insert = db.prepare(`INSERT OR IGNORE INTO customers
    (email, password, full_name, phone, birth_date, home_address, role, loyalty_points, private_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const customer of syntheticCustomers) insert.run(...customer);
}
