import type { Router } from "express";
import express from "express";
import type { Database } from "better-sqlite3";
import { uuid } from "../../lib/uuid";
import { leadSchema } from "../../domain/validators";
import { ZodError } from "zod";

export default function routes(db: Database): Router {
  const r: Router = express.Router();
  const now = () => new Date().toISOString();

  const SEL = `id, person_id AS personId, owner_user_id AS ownerUserId, source, interest,
    temperature, score, qualified, disqualified_reason AS disqualifiedReason,
    created_at AS createdAt, updated_at AS updatedAt, deleted_at AS deletedAt`;

  const parse = <T,>(s: unknown, fallback: T): T => {
    if (typeof s !== "string" || s === "") return fallback;
    try { return JSON.parse(s) as T; } catch { return fallback; }
  };
  const out = (row: Record<string, unknown>) => ({
    ...row, interest: parse(row.interest, null), qualified: !!row.qualified,
  });

  const toSql = (b: Record<string, unknown>) => ({
    person_id: b.personId, owner_user_id: b.ownerUserId, source: b.source,
    interest: JSON.stringify(b.interest ?? {}), temperature: b.temperature,
    score: Number(b.score ?? 0), qualified: b.qualified ? 1 : 0,
    disqualified_reason: b.disqualifiedReason ?? null,
  });

  r.get("/", (_req, res) => {
    const rows = db.prepare(`SELECT ${SEL} FROM leads WHERE deleted_at IS NULL ORDER BY created_at DESC`).all() as Record<string, unknown>[];
    res.json(rows.map(out));
  });

  r.get("/:id", (req, res) => {
    const row = db.prepare(`SELECT ${SEL} FROM leads WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: "Lead não encontrado" });
    res.json(out(row as Record<string, unknown>));
  });

  r.post("/", (req, res) => {
    try {
      const body = leadSchema.parse(req.body);
      const id = uuid();
      const n = now();
      db.prepare(`INSERT INTO leads (id,person_id,owner_user_id,source,interest,temperature,score,qualified,disqualified_reason,created_at,updated_at)
        VALUES (@id,@person_id,@owner_user_id,@source,@interest,@temperature,@score,@qualified,@disqualified_reason,@created_at,@updated_at)`)
        .run({ id, ...toSql(body as unknown as Record<string, unknown>), created_at: n, updated_at: n });
      res.status(201).json(out(db.prepare(`SELECT ${SEL} FROM leads WHERE id = ?`).get(id) as Record<string, unknown>));
    } catch (e) {
      res.status(400).json({ error: e instanceof ZodError ? e.issues.map((i) => i.message).join("; ") : (e as Error).message });
    }
  });

  r.put("/:id", (req, res) => {
    const existing = db.prepare(`SELECT ${SEL} FROM leads WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Lead não encontrado" });
    try {
      const body = leadSchema.parse({ ...(existing as object), ...req.body, interest: req.body.interest ?? parse((existing as Record<string, unknown>).interest, {}) });
      db.prepare(`UPDATE leads SET person_id=@person_id, owner_user_id=@owner_user_id, source=@source, interest=@interest,
        temperature=@temperature, score=@score, qualified=@qualified, disqualified_reason=@disqualified_reason, updated_at=@updated_at WHERE id=@id`)
        .run({ ...toSql(body as unknown as Record<string, unknown>), updated_at: now(), id: req.params.id });
      res.json(out(db.prepare(`SELECT ${SEL} FROM leads WHERE id = ?`).get(req.params.id) as Record<string, unknown>));
    } catch (e) {
      res.status(400).json({ error: e instanceof ZodError ? e.issues.map((i) => i.message).join("; ") : (e as Error).message });
    }
  });

  r.delete("/:id", (req, res) => {
    db.prepare("UPDATE leads SET deleted_at = ? WHERE id = ?").run(now(), req.params.id);
    res.status(204).end();
  });

  return r;
}
