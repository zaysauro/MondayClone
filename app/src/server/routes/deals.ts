import type { Router } from "express";
import express from "express";
import type { Database } from "better-sqlite3";
import { uuid } from "../../lib/uuid";
import { dealSchema, validateDealRules } from "../../domain/validators";
import { assertTransition, type Stage } from "../../domain/pipeline";
import { ZodError } from "zod";

export default function routes(db: Database): Router {
  const r: Router = express.Router();
  const now = () => new Date().toISOString();

  const SEL = `id, code, title, lead_id AS leadId, buyer_person_id AS buyerPersonId,
    property_id AS propertyId, owner_user_id AS ownerUserId, stage,
    value_cents AS valueCents, expected_close_at AS expectedCloseAt, closed_at AS closedAt,
    lost_reason AS lostReason, lost_notes AS lostNotes, payment_method AS paymentMethod,
    commission_pct AS commissionPct, last_activity_at AS lastActivityAt,
    stage_entered_at AS stageEnteredAt, created_at AS createdAt, updated_at AS updatedAt,
    deleted_at AS deletedAt`;

  r.get("/", (_req, res) => {
    const rows = db.prepare(`SELECT ${SEL} FROM deals WHERE deleted_at IS NULL ORDER BY created_at DESC`).all();
    res.json(rows);
  });

  r.get("/:id", (req, res) => {
    const row = db.prepare(`SELECT ${SEL} FROM deals WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: "Negócio não encontrado" });
    res.json(row);
  });

  r.get("/:id/history", (req, res) => {
    const rows = db.prepare(
      `SELECT h.id, h.deal_id AS dealId, h.from_stage AS fromStage, h.to_stage AS toStage,
        h.changed_by_user_id AS changedByUserId, h.note, h.created_at AS createdAt
        FROM deal_stage_history h WHERE h.deal_id = ? ORDER BY h.created_at ASC`,
    ).all(req.params.id);
    res.json(rows);
  });

  r.post("/", (req, res) => {
    try {
      const body = dealSchema.parse(req.body);
      const stage = body.stage;
      validateDealRules({ stage, valueCents: body.valueCents, closedAt: null, lostReason: body.lostReason });
      const id = uuid();
      const n = now();
      db.prepare(`INSERT INTO deals (id,code,title,lead_id,buyer_person_id,property_id,owner_user_id,stage,value_cents,expected_close_at,closed_at,lost_reason,lost_notes,payment_method,commission_pct,last_activity_at,stage_entered_at,created_at,updated_at)
        VALUES (@id,@code,@title,@lead_id,@buyer_person_id,@property_id,@owner_user_id,@stage,@value_cents,@expected_close_at,@closed_at,@lost_reason,@lost_notes,@payment_method,@commission_pct,@last_activity_at,@stage_entered_at,@created_at,@updated_at)`)
        .run({
          id, code: `NEG-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`,
          title: body.title, lead_id: body.leadId ?? null, buyer_person_id: body.buyerPersonId,
          property_id: body.propertyId, owner_user_id: body.ownerUserId, stage,
          value_cents: body.valueCents, expected_close_at: body.expectedCloseAt ?? null,
          closed_at: null, lost_reason: null, lost_notes: null, payment_method: body.paymentMethod ?? null,
          commission_pct: body.commissionPct ?? null, last_activity_at: n, stage_entered_at: n,
          created_at: n, updated_at: n,
        });
      db.prepare("INSERT INTO deal_stage_history (id,deal_id,from_stage,to_stage,changed_by_user_id,note,created_at) VALUES (?,?,?,?,?,?)")
        .run(id, id, "novo_lead", stage, body.ownerUserId, "Criação do negócio", n);
      res.status(201).json(db.prepare(`SELECT ${SEL} FROM deals WHERE id = ?`).get(id));
    } catch (e) {
      res.status(400).json({ error: e instanceof ZodError ? e.issues.map((i) => i.message).join("; ") : (e as Error).message });
    }
  });

  r.put("/:id", (req, res) => {
    const existing = db.prepare(`SELECT ${SEL} FROM deals WHERE id = ?`).get(req.params.id) as Record<string, unknown> | undefined;
    if (!existing) return res.status(404).json({ error: "Negócio não encontrado" });
    try {
      const body = dealSchema.parse({ ...existing, ...req.body });
      const stage = body.stage;
      validateDealRules({ stage, valueCents: body.valueCents, closedAt: (existing.closedAt as string) ?? null, lostReason: body.lostReason });
      db.prepare(`UPDATE deals SET title=@title, buyer_person_id=@buyer_person_id, property_id=@property_id,
        owner_user_id=@owner_user_id, stage=@stage, value_cents=@value_cents, expected_close_at=@expected_close_at,
        payment_method=@payment_method, commission_pct=@commission_pct, lost_reason=@lost_reason, lost_notes=@lost_notes,
        updated_at=@updated_at WHERE id=@id`)
        .run({
          title: body.title, buyer_person_id: body.buyerPersonId, property_id: body.propertyId,
          owner_user_id: body.ownerUserId, stage, value_cents: body.valueCents,
          expected_close_at: body.expectedCloseAt ?? null, payment_method: body.paymentMethod ?? null,
          commission_pct: body.commissionPct ?? null, lost_reason: body.lostReason ?? null,
          lost_notes: body.lostNotes ?? null, updated_at: now(), id: req.params.id,
        });
      res.json(db.prepare(`SELECT ${SEL} FROM deals WHERE id = ?`).get(req.params.id));
    } catch (e) {
      res.status(400).json({ error: e instanceof ZodError ? e.issues.map((i) => i.message).join("; ") : (e as Error).message });
    }
  });

  /** Transição de etapa (kanban): PUT /api/deals/:id/stage { toStage, changedByUserId, note } */
  r.put("/:id/stage", (req, res) => {
    const existing = db.prepare(`SELECT ${SEL} FROM deals WHERE id = ? AND deleted_at IS NULL`).get(req.params.id) as Record<string, unknown> | undefined;
    if (!existing) return res.status(404).json({ error: "Negócio não encontrado" });
    const from = existing.stage as Stage;
    const to = req.body.toStage as Stage;
    const changedBy = req.body.changedByUserId as string | undefined;
    if (!changedBy) return res.status(400).json({ error: "changedByUserId é obrigatório" });
    try {
      assertTransition(from, to);
    } catch (e) {
      return res.status(400).json({ error: (e as Error).message });
    }
    if (to === "ganho") {
      const accepted = db.prepare("SELECT COUNT(*) AS c FROM proposals WHERE deal_id = ? AND status = 'aceita'").get(existing.id) as { c: number };
      const buyer = existing.buyerPersonId, property = existing.propertyId;
      const missing: string[] = [];
      if ((existing.valueCents as number) <= 0) missing.push("valueCents > 0");
      if (accepted.c < 1) missing.push("ao menos 1 proposta aceita");
      if (!buyer) missing.push("comprador vinculado");
      if (!property) missing.push("imóvel vinculado");
      if (missing.length) {
        return res.status(400).json({ error: `Não é possível marcar como ganho: ${missing.join(", ")}.` });
      }
    }
    const n = now();
    const wrapped = db.transaction(() => {
      db.prepare("UPDATE deals SET stage = ?, stage_entered_at = ?, closed_at = ?, lost_reason = ?, lost_notes = ?, payment_method = COALESCE(?, payment_method), updated_at = ? WHERE id = ?")
        .run(to, n, to === "ganho" || to === "perdido" ? n : null, to === "perdido" ? req.body.lostReason ?? null : null, req.body.lostNotes ?? null, to === "ganho" ? req.body.paymentMethod ?? null : null, n, existing.id);
      db.prepare("INSERT INTO deal_stage_history (id, deal_id, from_stage, to_stage, changed_by_user_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(uuid(), existing.id, from, to, changedBy, req.body.note ?? null, n);
      if (to === "ganho") {
        db.prepare("UPDATE properties SET status = 'vendido' WHERE id = ?").run(existing.propertyId);
      }
    });
    wrapped();
    res.json(db.prepare(`SELECT ${SEL} FROM deals WHERE id = ?`).get(existing.id));
  });

  r.delete("/:id", (req, res) => {
    const commission = db.prepare("SELECT status FROM commissions WHERE deal_id = ?").get(req.params.id) as { status: string } | undefined;
    if (commission?.status === "recebida") {
      return res.status(400).json({ error: "Não é possível excluir: este negócio tem comissão recebida." });
    }
    db.prepare("UPDATE deals SET deleted_at = ? WHERE id = ?").run(now(), req.params.id);
    res.status(204).end();
  });

  return r;
}
