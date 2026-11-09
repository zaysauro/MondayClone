import { formatDateTime } from "../../lib/dates";
import { STAGE_LABELS, type Stage } from "../../domain/enums";

interface HistoryItem { fromStage: string | null; toStage: string; createdAt: string; note: string | null }

export default function DealTimeline({ history }: { history: HistoryItem[] }) {
  return (
    <ol className="space-y-2 border-l-2 border-indigo-200 pl-4">
      {history.map((h, i) => (
        <li key={i} className="text-sm">
          <span className="font-medium">
            {h.fromStage ? `${STAGE_LABELS[h.fromStage as Stage]} → ` : ""}
            {STAGE_LABELS[h.toStage as Stage]}
          </span>
          <div className="text-xs text-slate-400">{formatDateTime(h.createdAt)}{h.note ? ` · ${h.note}` : ""}</div>
        </li>
      ))}
      {history.length === 0 && <li className="text-sm text-slate-400">Sem histórico.</li>}
    </ol>
  );
}
