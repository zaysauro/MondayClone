import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDatabase } from "../lib/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = openDatabase();
const applied = new Set<string>(
  (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'")
      .get()
      ? db.prepare("SELECT name FROM _migrations").all() as { name: string }[]
      : []
  ).map((r) => r.name),
);

const migrationsDir = path.resolve(__dirname, "migrations");
const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) continue;
  const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
  const wrapped = db.transaction(() => {
    db.exec(sql);
    db.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)").run(
      file,
      new Date().toISOString(),
    );
  });
  wrapped();
  console.log(`Aplicada: ${file}`);
}

for (const file of applied) {
  console.log(`Já aplicada (ignorada): ${file}`);
}

db.close();
console.log("Migração concluída.");
