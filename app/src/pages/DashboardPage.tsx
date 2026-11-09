import { useEffect, useState } from "react";
import KpiCards from "../components/dashboard/KpiCards";
import FunnelChart from "../components/dashboard/FunnelChart";
import { api } from "../lib/api";

interface Dash {
  vgvCents: number;
  winRate: number;
  ticketMedioCents: number;
  funnel: { stage: string; label: string; count: number; valueCents: number }[];
  agingByStage: { stage: string; label: string; agingDays: number }[];
  estagnados: { stage: string; label: string; lastActivityAt: string; idleDays: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    api<Dash>("/dashboard").then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <p className="text-sm text-slate-500">Carregando dashboard…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <KpiCards
        vgvCents={data.vgvCents ?? 0}
        winRate={data.winRate ?? 0}
        ticketMedioCents={data.ticketMedioCents ?? 0}
        estagnados={data.estagnados?.length ?? 0}
      />
      <FunnelChart funnel={data.funnel ?? []} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Aging médio por etapa (dias)</h3>
          <ul className="space-y-1 text-sm">
            {data.agingByStage.map((a) => (
              <li key={a.stage} className="flex justify-between">
                <span className="text-slate-600">{a.label}</span>
                <span className="font-medium">{a.agingDays}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Negócios estagnados (&gt;15 dias)</h3>
          {data.estagnados.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum negócio estagnado.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.estagnados.map((s, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-slate-600">{s.label}</span>
                  <span className="font-medium text-amber-600">{s.idleDays} dias</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
