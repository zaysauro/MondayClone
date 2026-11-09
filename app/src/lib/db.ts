import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

export function dbPath(envPath?: string): string {
  const p = envPath || process.env.DATABASE_PATH || "./data/crm.sqlite";
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

export function openDatabase(file = dbPath()): Database.Database {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}
