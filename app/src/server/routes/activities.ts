import type { Router } from "express";
import express from "express";
import type { Database } from "better-sqlite3";
import { uuid } from "../../lib/uuid";
import { activitySchema } from "../../domain/validators";
import { ZodError } from "zod";

export default function routes(db: Database): Router {
  const r: Router = express.Router();
  const now = () => new Date().toISOString();

  const SEL = `id, type, deal_id AS dealId, lead_id AS leadId, person_id AS personId,
    property_id AS propertyId, user_id AS userId, title, body, due_at AS dueAt,
    done_at AS doneAt, outcome, created_at AS createdAt, updated_at AS updatedAt`;

  r.get("/", (req, res) => {
    const q: string[] = ["1=1"];
    const params: unknown[] = [];
    if (req.query.dealId) { q.push("deal_id = ?"); params.push(req.query.dealId); }
    const rows = db.prepare(`SELECT ${SEL} FROM activities WHERE ${q.join(" AND ")} ORDER BY created_at DESC`).all(...params);
    res.json(rows);
  });

  r.get("/:id", (req, res) => {
    const row = db.prepare(`SELECT ${SEL} FROM activities WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: "Atividade não encontrada" });
    res.json(row);
  });

  r.post("/", (req, res) => {
    try {
      const body = activitySchema.parse(req.body);
      const id = uuid();
      const n = now();
      db.prepare(`INSERT INTO activities (id,type,deal_id,lead_id,person_id,property_id,user_id,title,body,due_at,done_at,outcome,created_at,updated_at)
        VALUES (@id,@type,@deal_id,@lead_id,@person_id,@property_id,@user_id,@title,@body,@due_at,@done_at,@outcome,@created_at,@updated_at)`)
        .run({
          id, type: body.type, deal_id: body.dealId ?? null, lead_id: body.leadId ?? null,
          person_id: body.personId ?? null, property_id: body.propertyId ?? null,
          user_id: body.userId, title: body.title, body: body.body ?? null,
          due_at: body.dueAt ?? null, done_at: body.doneAt ?? null, outcome: body.outcome ?? null,
          created_at: n, updated_at: n,
        });
      res.status(201).json(db.prepare(`SELECT ${SEL} FROM activities WHERE id = ?`).get(id));
    } catch (e) {
      res.status(400).json({ error: e instanceof ZodError ? e.issues.map((i) => i.message).join("; ") : (e as Error).message });
    }
  });

  r.put("/:id", (req, res) => {
    const existing = db.prepare(`SELECT ${SEL} FROM activities WHERE id = ?`).get(req.params.id) as Record<string, unknown> | undefined;
    if (!existing) return res.status(404).json({ error: "Atividade não encontrada" });
    try {
      const body = activitySchema.parse({ ...existing, ...req.body });
      db.prepare(`UPDATE activities SET type=@type, deal_id=@deal_id, lead_id=@lead_id, person_id=@person_id, property_id=@property_id,
        user_id=@user_id, title=@title, body=@body, due_at=@due_at, done_at=@done_at, outcome=@outcome, updated_at=@updated_at WHERE id=@id`)
        .run({
          type: body.type, deal_id: body.dealId ?? null, lead_id: body.leadId ?? null,
          person_id: body.personId ?? null, property_id: body.propertyId ?? null,
          user_id: body.userId, title: body.title, body: body.body ?? null,
          due_at: body.dueAt ?? null, done_at: body.doneAt ?? null, outcome: body.outcome ?? null,
          updated_at: now(), id: req.params.id,
        });
      res.json(db.prepare(`SELECT ${SEL} FROM activities WHERE id = ?`).get(req.params.id));
    } catch (e) {
      res.status(400).json({ error: e instanceof ZodError ? e.issues.map((i) => i.message).join("; ") : (e as Error).message });
    }
  });

  r.delete("/:id", (req, res) => {
    db.prepare("DELETE FROM activities WHERE id = ?").run(req.params.id);
    res.status(204).end();
  });

  return r;
}
