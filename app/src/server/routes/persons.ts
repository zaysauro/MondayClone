import type { Router } from "express";
import express from "express";
import type { Database } from "better-sqlite3";
import { uuid } from "../../lib/uuid";
import { personSchema } from "../../domain/validators";
import { ZodError } from "zod";

export default function routes(db: Database): Router {
  const r: Router = express.Router();
  const now = () => new Date().toISOString();

  const SEL = `id, type, name, document, email, phone, whatsapp, birth_date AS birthDate,
    marital_status AS maritalStatus, profession, income_cents AS incomeCents,
    credit_score AS creditScore, preferences, address, source, tags, notes,
    lgpd_accepted_at AS lgpdAcceptedAt, marketing_opt_in AS marketingOptIn,
    consent_source AS consentSource, created_at AS createdAt, updated_at AS updatedAt, deleted_at AS deletedAt`;

  const parseJSON = <T,>(s: unknown, fallback: T): T => {
    if (typeof s !== "string" || s === "") return fallback;
    try { return JSON.parse(s) as T; } catch { return fallback; }
  };

  const toProduct = (row: Record<string, unknown>) => ({
    ...row,
    preferences: parseJSON(row.preferences, null),
    address: parseJSON(row.address, null),
    tags: parseJSON(row.tags, []),
  });

  const toSql = (b: Record<string, unknown>) => ({
    type: b.type, name: b.name, document: b.document ?? null, email: b.email ?? null,
    phone: b.phone ?? null, whatsapp: b.whatsapp ?? null, birth_date: b.birthDate ?? null,
    marital_status: b.maritalStatus ?? null, profession: b.profession ?? null,
    income_cents: b.incomeCents == null ? null : Math.round(Number(b.incomeCents)),
    credit_score: b.creditScore ?? null,
    preferences: JSON.stringify(b.preferences ?? {}),
    address: JSON.stringify(b.address ?? null), source: b.source ?? null,
    tags: JSON.stringify(b.tags ?? []), notes: b.notes ?? null,
    lgpd_accepted_at: b.lgpdAcceptedAt ?? new Date().toISOString(),
    marketing_opt_in: b.marketingOptIn ? 1 : 0,
    consent_source: b.consentSource ?? "api",
  });

  r.get("/", (_req, res) => {
    const rows = db.prepare(`SELECT ${SEL} FROM persons WHERE deleted_at IS NULL ORDER BY created_at DESC`).all() as Record<string, unknown>[];
    res.json(rows.map(toProduct));
  });

  r.get("/:id", (req, res) => {
    const row = db.prepare(`SELECT ${SEL} FROM persons WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: "Pessoa não encontrada" });
    res.json(toProduct(row as Record<string, unknown>));
  });

  r.post("/", (req, res) => {
    try {
      const body = personSchema.parse(req.body);
      const s = toSql(body as unknown as Record<string, unknown>);
      const id = uuid();
      const n = now();
      db.prepare(`INSERT INTO persons (id,type,name,document,email,phone,whatsapp,birth_date,marital_status,profession,income_cents,credit_score,preferences,address,source,tags,notes,lgpd_accepted_at,marketing_opt_in,consent_source,created_at,updated_at)
        VALUES (@id,@type,@name,@document,@email,@phone,@whatsapp,@birth_date,@marital_status,@profession,@income_cents,@credit_score,@preferences,@address,@source,@tags,@notes,@lgpd_accepted_at,@marketing_opt_in,@consent_source,@created_at,@updated_at)`)
        .run({ id, ...s, created_at: n, updated_at: n });
      res.status(201).json(toProduct(db.prepare(`SELECT ${SEL} FROM persons WHERE id = ?`).get(id) as Record<string, unknown>));
    } catch (e) {
      res.status(400).json({ error: e instanceof ZodError ? e.issues.map((i) => i.message).join("; ") : (e as Error).message });
    }
  });

  r.put("/:id", (req, res) => {
    const existing = db.prepare(`SELECT ${SEL} FROM persons WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: "Pessoa não encontrada" });
    try {
      const body = personSchema.parse({ ...(existing as object), ...req.body });
      const s = toSql(body as unknown as Record<string, unknown>);
      db.prepare(`UPDATE persons SET type=@type, name=@name, document=@document, email=@email, phone=@phone, whatsapp=@whatsapp,
        birth_date=@birth_date, marital_status=@marital_status, profession=@profession, income_cents=@income_cents, credit_score=@credit_score,
        preferences=@preferences, address=@address, source=@source, tags=@tags, notes=@notes, lgpd_accepted_at=@lgpd_accepted_at,
        marketing_opt_in=@marketing_opt_in, consent_source=@consent_source, updated_at=@updated_at WHERE id=@id`)
        .run({ ...s, updated_at: now(), id: req.params.id });
      res.json(toProduct(db.prepare(`SELECT ${SEL} FROM persons WHERE id = ?`).get(req.params.id) as Record<string, unknown>));
    } catch (e) {
      res.status(400).json({ error: e instanceof ZodError ? e.issues.map((i) => i.message).join("; ") : (e as Error).message });
    }
  });

  r.delete("/:id", (req, res) => {
    db.prepare("UPDATE persons SET deleted_at = ? WHERE id = ?").run(now(), req.params.id);
    res.status(204).end();
  });

  return r;
}
