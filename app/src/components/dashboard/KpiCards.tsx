import { centsToBRL } from "../../lib/money";

export default function KpiCards({ vgvCents, winRate, ticketMedioCents, estagnados }: {
  vgvCents: number;
  winRate: number;
  ticketMedioCents: number;
  estagnados: number;
}) {
  const cards = [
    { label: "VGV total", value: centsToBRL(vgvCents) },
    { label: "Win rate", value: `${winRate.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` },
    { label: "Ticket médio", value: centsToBRL(ticketMedioCents) },
    { label: "Estagnados (>15 dias)", value: String(estagnados) },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase text-slate-500">{c.label}</div>
          <div className="mt-1 text-2xl font-bold text-slate-800">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
