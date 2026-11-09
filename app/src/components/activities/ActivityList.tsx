import { useEffect, useState } from "react";
import Badge from "../ui/Badge";
import { api } from "../../lib/api";
import { ACTIVITY_TYPE_LABELS, type ActivityType } from "../../domain/enums";
import { formatDateTime } from "../../lib/dates";
import ActivityForm from "./ActivityForm";

export default function ActivityList() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [open, setOpen] = useState(false);

  const load = () => api<Record<string, unknown>[]>("/activities").then(setItems).catch(() => setItems([]));

  useEffect(() => { void load(); }, []);

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h1 className="text-xl font-bold">Atividades</h1>
        <button onClick={() => setOpen(true)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Nova atividade</button>
      </div>
      <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-2.5 font-medium">Tipo</th>
              <th className="px-4 py-2.5 font-medium">Título</th>
              <th className="px-4 py-2.5 font-medium">Negócio</th>
              <th className="px-4 py-2.5 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={String(a.id)} className="border-b border-slate-100">
                <td className="px-4 py-2.5"><Badge label={ACTIVITY_TYPE_LABELS[String(a.type) as ActivityType] ?? String(a.type)} /></td>
                <td className="px-4 py-2.5">{String(a.title)}</td>
                <td className="px-4 py-2.5 text-slate-500">{a.dealId ? "Negócio vinculado" : "—"}</td>
                <td className="px-4 py-2.5 text-slate-500">{formatDateTime(String(a.createdAt))}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td className="px-4 py-2.5 text-slate-500" colSpan={4}>Nenhuma atividade registrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {open && (
        <ActivityForm
          onClose={() => setOpen(false)}
          onSaved={() => { void load(); }}
        />
      )}
    </div>
  );
}
