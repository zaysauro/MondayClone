import { useEffect, useState } from "react";
import Badge from "../ui/Badge";
import { api } from "../../lib/api";
import { centsToBRL } from "../../lib/money";
import { PERSON_TYPE_LABELS, type PersonType } from "../../domain/enums";

export default function PersonList({ onNew }: { onNew: () => void }) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    api<Record<string, unknown>[]>("/persons").then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h1 className="text-xl font-bold">Pessoas</h1>
        <button onClick={onNew} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Nova pessoa</button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((p) => (
          <div key={String(p.id)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{String(p.name)}</span>
              <Badge label={PERSON_TYPE_LABELS[String(p.type) as PersonType] ?? String(p.type)} />
            </div>
            <div className="mt-1 text-sm text-slate-500">{String(p.email ?? "")}</div>
            <div className="text-sm text-slate-500">
              Renda: {p.incomeCents ? centsToBRL(Number(p.incomeCents)) : "—"}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-500">Nenhuma pessoa cadastrada.</p>}
      </div>
    </div>
  );
}
