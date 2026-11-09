import { centsToBRL } from "../../lib/money";

export default function FunnelChart({ funnel }: { funnel: { stage: string; label: string; count: number; valueCents: number }[] }) {
  const max = Math.max(1, ...funnel.map((f) => f.count));
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">Funil — negócios por etapa</h3>
      <div className="space-y-2">
        {funnel.map((f) => (
          <div key={f.stage} className="flex items-center gap-3 text-sm">
            <span className="w-48 shrink-0 text-slate-600">{f.label}</span>
            <div className="h-6 flex-1 overflow-hidden rounded bg-slate-100">
              <div className="h-full rounded bg-indigo-500" style={{ width: `${(f.count / max) * 100}%` }} />
            </div>
            <span className="w-24 text-right text-slate-500">{f.count} · {centsToBRL(f.valueCents)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
