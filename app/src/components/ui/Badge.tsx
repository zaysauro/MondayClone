import { ReactNode } from "react";

const COLORS: Record<string, string> = {
  novo_lead: "bg-slate-100 text-slate-700",
  contato_feito: "bg-sky-100 text-sky-700",
  qualificado: "bg-cyan-100 text-cyan-700",
  visita_agendada: "bg-blue-100 text-blue-700",
  proposta: "bg-violet-100 text-violet-700",
  negociacao: "bg-purple-100 text-purple-700",
  reserva: "bg-amber-100 text-amber-700",
  contrato: "bg-orange-100 text-orange-700",
  ganho: "bg-emerald-100 text-emerald-700",
  perdido: "bg-rose-100 text-rose-700",
};

export default function Badge({ label, stage }: { label: ReactNode; stage?: string }) {
  const cls = stage && COLORS[stage] ? COLORS[stage] : "bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}
