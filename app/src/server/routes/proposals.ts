import type { Router } from "express";
import express from "express";
import type { Database } from "better-sqlite3";
import { uuid } from "../../lib/uuid";
import { proposalSchema } from "../../domain/validators";
import { ZodError } from "zod";

export default function routes(db: Database): Router {
  const r: Router = express.Router();
  const now = () => new Date().toISOString();

  const SEL = `id, deal_id AS dealId, version, amount_cents AS amountCents,
    payment_method AS paymentMethod, down_payment_cents AS downPaymentCents,
    financing_months AS financingMonths, conditions, status, sent_at AS sentAt,
    expires_at AS expiresAt, decided_at AS decidedAt, document_url AS documentUrl,
    created_at AS createdAt, updated_at AS updatedAt`;

  r.get("/", (req, res) => {
    const q: string[] = ["1=1"];
    const params: unknown[] = [];
    if (req.query.dealId) { q.push("deal_id = ?"); params.push(req.query.dealId); }
    const rows = db.prepare(`SELECT ${SEL} FROM proposals WHERE ${q.join(" AND ")} ORDER BY deal_id, version`).all(...params);
    res.json(rows);
  });

  r.get("/:id", (req, res) => {
    const row = db.prepare(`SELECT ${SEL} FROM proposals WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: "Proposta não encontrada" });
    res.json(row);
  });

  r.post("/", (req, res) => {
    try {
      const body = proposalSchema.parse(req.body);
      if (!body.version || body.version < 1) body.version = 1;
      const max = db.prepare("SELECT COALESCE(MAX(version),0) AS v FROM proposals WHERE deal_id = ?").get(body.dealId) as { v: number };
      const id = uuid();
      const n = now();
      db.prepare(`INSERT INTO proposals (id,deal_id,version,amount_cents,payment_method,down_payment_cents,financing_months,conditions,status,sent_at,expires_at,decided_at,document_url,created_at,updated_at)
        VALUES (@id,@deal_id,@version,@amount_cents,@payment_method,@down_payment_cents,@financing_months,@conditions,@status,@sent_at,@expires_at,@decided_at,@document_url,@created_at,@updated_at)`)
        .run({
          id, deal_id: body.dealId, version: max.v + 1, amount_cents: body.amountCents,
          payment_method: body.paymentMethod ?? null, down_payment_cents: body.downPaymentCents ?? null,
          financing_months: body.financingMonths ?? null, conditions: body.conditions ?? null,
          status: body.status, sent_at: body.sentAt ?? null, expires_at: body.expiresAt ?? null,
          decided_at: body.decidedAt ?? null, document_url: body.documentUrl ?? null,
          created_at: n, updated_at: n,
        });
      res.status(201).json(db.prepare(`SELECT ${SEL} FROM proposals WHERE id = ?`).get(id));
    } catch (e) {
      res.status(400).json({ error: e instanceof ZodError ? e.issues.map((i) => i.message).join("; ") : (e as Error).message });
    }
  });

  r.put("/:id", (req, res) => {
    const existing = db.prepare(`SELECT ${SEL} FROM proposals WHERE id = ?`).get(req.params.id) as Record<string, unknown> | undefined;
    if (!existing) return res.status(404).json({ error: "Proposta não encontrada" });
    try {
      const body = proposalSchema.parse({ ...existing, ...req.body });
      db.prepare(`UPDATE proposals SET amount_cents=@amount_cents, payment_method=@payment_method, down_payment_cents=@down_payment_cents,
        financing_months=@financing_months, conditions=@conditions, status=@status, sent_at=@sent_at, expires_at=@expires_at,
        decided_at=@decided_at, document_url=@document_url, updated_at=@updated_at WHERE id=@id`)
        .run({
          amount_cents: body.amountCents, payment_method: body.paymentMethod ?? null,
          down_payment_cents: body.downPaymentCents ?? null, financing_months: body.financingMonths ?? null,
          conditions: body.conditions ?? null, status: body.status, sent_at: body.sentAt ?? null,
          expires_at: body.expiresAt ?? null, decided_at: body.decidedAt ?? null,
          document_url: body.documentUrl ?? null, updated_at: now(), id: req.params.id,
        });
      res.json(db.prepare(`SELECT ${SEL} FROM proposals WHERE id = ?`).get(req.params.id));
    } catch (e) {
      res.status(400).json({ error: e instanceof ZodError ? e.issues.map((i) => i.message).join("; ") : (e as Error).message });
    }
  });

  return r;
}
