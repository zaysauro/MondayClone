import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { centsToBRL } from "../../lib/money";
import { formatDateTime } from "../../lib/dates";
import { ACTIVITY_TYPE_LABELS, STAGE_LABELS, type Stage } from "../../domain/enums";
import { api } from "../../lib/api";

interface HistoryItem { fromStage: string | null; toStage: string; createdAt: string; note: string | null }
interface ActivityItem { id: string; type: string; title: string; createdAt: string; doneAt: string | null }

export default function DealDrawer({ deal, onClose }: { deal: { id: string; title: string; valueCents: number; stage: string; code: string; lastActivityAt?: string }; onClose: () => void }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    api<HistoryItem[]>(`/deals/${deal.id}/history`).then(setHistory).catch(() => setHistory([]));
    api<ActivityItem[]>(`/activities?dealId=${deal.id}`).then(setActivities).catch(() => setActivities([]));
  }, [deal.id]);

  return (
    <Modal open title={`${deal.title} · ${deal.code}`} onClose={onClose}>
      <div className="mb-4 text-sm text-slate-600">
        Etapa atual: <b>{STAGE_LABELS[deal.stage as Stage]}</b> · Valor: <b>{centsToBRL(deal.valueCents)}</b>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-slate-700">Timeline de etapas</h3>
      <ol className="mb-5 space-y-2 border-l-2 border-indigo-200 pl-4">
        {history.map((h, i) => (
          <li key={i} className="text-sm">
            <span className="font-medium text-slate-800">
              {h.fromStage ? `${STAGE_LABELS[h.fromStage as Stage]} → ` : ""}
              {STAGE_LABELS[h.toStage as Stage]}
            </span>
            <div className="text-xs text-slate-400">{formatDateTime(h.createdAt)}{h.note ? ` · ${h.note}` : ""}</div>
          </li>
        ))}
        {history.length === 0 && <li className="text-sm text-slate-400">Sem histórico.</li>}
      </ol>

      <h3 className="mb-2 text-sm font-semibold text-slate-700">Atividades</h3>
      <ul className="space-y-2">
        {activities.map((a) => (
          <li key={a.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <span className="font-medium">{ACTIVITY_TYPE_LABELS[a.type as keyof typeof ACTIVITY_TYPE_LABELS] ?? a.type}</span> — {a.title}
            <div className="text-xs text-slate-400">{formatDateTime(a.createdAt)}{a.doneAt ? " · concluída" : " · em aberto"}</div>
          </li>
        ))}
        {activities.length === 0 && (
          <li className="text-sm text-slate-400">Nenhuma atividade registrada para este negócio.</li>
        )}
      </ul>
    </Modal>
  );
}
