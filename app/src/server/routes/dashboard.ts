import type { Router } from "express";
import express from "express";
import type { Database } from "better-sqlite3";
import { STAGES, STAGE_LABELS, type Stage } from "../../domain/enums";

export default function routes(db: Database): Router {
  const r: Router = express.Router();

  r.get("/dashboard", (_req, res) => {
    const dealRows = db.prepare(
      "SELECT stage, value_cents as valueCents, last_activity_at as lastActivityAt, created_at as createdAt FROM deals WHERE deleted_at IS NULL",
    ).all() as { stage: Stage; valueCents: number; lastActivityAt: string; createdAt: string }[];

    const byStage: Record<string, number> = {};
    for (const s of STAGES) byStage[s] = 0;
    let vgv = 0;
    for (const d of dealRows) {
      vgv += d.valueCents;
      byStage[d.stage] = (byStage[d.stage] ?? 0) + d.valueCents;
    }

    const won = dealRows.filter((d) => d.stage === "ganho").length;
    const lost = dealRows.filter((d) => d.stage === "perdido").length;
    const decided = won + lost;
    const winRate = decided > 0 ? (won / decided) * 100 : 0;

    const wonValues = dealRows.filter((d) => d.stage === "ganho").map((d) => d.valueCents);
    const ticketMedio = wonValues.length ? wonValues.reduce((a, b) => a + b, 0) / wonValues.length : 0;

    const nowMs = Date.now();
    const agingByStage = STAGES.map((s) => {
      const inStage = dealRows.filter((d) => d.stage === s && (STAGES.indexOf(s) < 8));
      const avg = inStage.length
        ? inStage.reduce((sum, d) => sum + (nowMs - new Date(d.lastActivityAt).getTime()) / 86_400_000, 0) / inStage.length
        : 0;
      return { stage: s, label: STAGE_LABELS[s], agingDays: Math.round(avg * 10) / 10 };
    });

    const estagnados = dealRows
      .filter((d) => {
        const days = (nowMs - new Date(d.lastActivityAt).getTime()) / 86_400_000;
        return days > 15 && STAGES.indexOf(d.stage) < 8;
      })
      .map((d) => ({ stage: d.stage, label: STAGE_LABELS[d.stage], lastActivityAt: d.lastActivityAt, idleDays: Math.round((nowMs - new Date(d.lastActivityAt).getTime()) / 86_400_000) }));

    const funnel = STAGES.map((s) => ({
      stage: s,
      label: STAGE_LABELS[s],
      count: dealRows.filter((d) => d.stage === s).length,
      valueCents: byStage[s],
    }));

    res.json({
      vgvCents: vgv,
      vgvByStageCents: byStage,
      winRate: Math.round(winRate * 10) / 10,
      ticketMedioCents: Math.round(ticketMedio),
      agingByStage,
      estagnados,
      funnel,
      totais: { deals: dealRows.length, ganhos: won, perdidos: lost },
    });
  });

  return r;
}
