import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { schema } from "./schema.js";
import { seedMenu } from "./seed.js";
import { seedSecurityLab } from "./seed-security-lab.js";

export async function openDatabase(path: string): Promise<DatabaseSync> {
  if (path !== ":memory:") await mkdir(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  db.exec(schema);
  seedMenu(db);
  seedSecurityLab(db);
  return db;
}
