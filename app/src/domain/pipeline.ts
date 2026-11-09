import { STAGES, STAGE_KIND, type Stage } from "./enums";

export type { Stage };

/**
 * Máquina de estados do pipeline:
 * - avanço de exatamente 1 etapa;
 * - retorno permitido para a etapa imediatamente anterior;
 * - `ganho` só a partir de `reserva` ou `contrato`;
 * - `perdido` a partir de qualquer etapa aberta;
 * - nenhum retorno a partir de ganho/perdido.
 */
export const ALLOWED_TRANSITIONS: Record<Stage, readonly Stage[]> = Object.fromEntries(
  STAGES.map((stage) => {
    const idx = STAGES.indexOf(stage);
    if (STAGE_KIND[stage] === "won") return [stage, [] as readonly Stage[]];
    if (STAGE_KIND[stage] === "lost") return [stage, ["contato_feito"] as readonly Stage[]];
    const targets: Stage[] = [];
    if (idx + 1 < STAGES.length && STAGE_KIND[STAGES[idx + 1]] === "open") {
      targets.push(STAGES[idx + 1]);
    }
    if (stage === "reserva" || stage === "contrato") targets.push("ganho" as Stage);
    if (STAGE_KIND[stage] === "open") targets.push("perdido" as Stage);
    if (idx - 1 >= 0 && STAGE_KIND[STAGES[idx - 1]] === "open") {
      targets.push(STAGES[idx - 1] as Stage);
    }
    return [stage, targets as readonly Stage[]];
  }),
) as Record<Stage, readonly Stage[]>;

export function canTransition(from: Stage, to: Stage): boolean {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: Stage, to: Stage): void {
  if (from === to) {
    throw new Error("Transição inválida: o negócio já está nesta etapa.");
  }
  if (!canTransition(from, to)) {
    throw new Error(
      `Transição bloqueada: não é possível ir de "${from}" para "${to}".`,
    );
  }
}
