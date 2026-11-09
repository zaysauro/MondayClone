import { useEffect, useState } from "react";
import Badge from "../ui/Badge";
import { centsToBRL } from "../../lib/money";
import { api } from "../../lib/api";
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS, type PropertyType, type PropertyStatus } from "../../domain/enums";

export default function PropertyList({ onNew }: { onNew: () => void }) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    api<Record<string, unknown>[]>("/properties").then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h1 className="text-xl font-bold">Imóveis</h1>
        <button onClick={onNew} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Novo imóvel</button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((p) => (
          <div key={String(p.id)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="font-semibold">{String(p.code)}</span>
              <Badge label={PROPERTY_STATUS_LABELS[String(p.status) as PropertyStatus] ?? String(p.status)} stage={String(p.status)} />
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {PROPERTY_TYPE_LABELS[String(p.type) as PropertyType] ?? String(p.type)} · {String(p.bedrooms)} quartos · {String(p.areaM2)} m²
            </div>
            <div className="mt-2 text-lg font-bold text-slate-800">{centsToBRL(Number(p.priceCents))}</div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-500">Nenhum imóvel cadastrado.</p>}
      </div>
    </div>
  );
}
