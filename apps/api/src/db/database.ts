import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { schema } from "./schema.js";
import { seedMenu } from "./seed.js";

/** Open SQLite, apply the ordering schema, and seed missing menu items. */
export async function openDatabase(path: string): Promise<DatabaseSync> {
  if (path !== ":memory:") await mkdir(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  db.exec(schema);
  migrate(db);
  seedMenu(db);
  return db;
}

function migrate(db: DatabaseSync): void {
  const columns = db.prepare("PRAGMA table_info(menu_items)").all() as Array<{ name: string }>;
  if (!columns.some(({ name }) => name === "dietary_flags")) {
    db.exec("ALTER TABLE menu_items ADD COLUMN dietary_flags TEXT NOT NULL DEFAULT ''");
  }
}
