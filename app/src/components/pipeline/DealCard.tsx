import Badge from "../ui/Badge";
import { centsToBRL } from "../../lib/money";
import { daysSince } from "../../lib/dates";
import { STAGE_LABELS, type Stage } from "../../domain/enums";
import type { Deal } from "../../hooks/useDeals";

export default function DealCard({
  deal,
  onOpen,
  onDragStart,
}: {
  deal: Deal;
  onOpen: () => void;
  onDragStart: () => void;
}) {
  const idle = daysSince(deal.lastActivityAt);
  const stale = idle > 15 && !["ganho", "perdido"].includes(deal.stage);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md"
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="truncate text-sm font-semibold text-slate-800">{deal.title}</span>
        {stale && (
          <span title={`Sem atividade há ${idle} dias`} className="text-amber-500" aria-label="estagnado">
            ⚠️
          </span>
        )}
      </div>
      <span className="text-xs text-slate-400">{deal.code}</span>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">
          {deal.valueCents > 0 ? centsToBRL(deal.valueCents) : "—"}
        </span>
        <Badge label={STAGE_LABELS[deal.stage as Stage]} stage={deal.stage} />
      </div>
    </div>
  );
}
