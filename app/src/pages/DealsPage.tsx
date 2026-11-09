import { useEffect, useState } from "react";
import { useDeals } from "../hooks/useDeals";
import { centsToBRL } from "../lib/money";
import Badge from "../components/ui/Badge";
import Table from "../components/ui/Table";
import DealForm from "../components/deals/DealForm";
import { STAGE_LABELS, type Stage } from "../domain/enums";

export default function DealsPage() {
  const { deals, reload } = useDeals();
  const [open, setOpen] = useState(false);

  useEffect(() => { void reload(); }, [reload]);

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h1 className="text-xl font-bold">Negócios</h1>
        <button onClick={() => setOpen(true)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Novo negócio</button>
      </div>
      <Table head={["Código", "Título", "Etapa", "Valor"]}>
        {deals.map((d) => (
          <tr key={d.id} className="border-b border-slate-100">
            <td className="px-4 py-2.5 text-slate-500">{d.code}</td>
            <td className="px-4 py-2.5">{d.title}</td>
            <td className="px-4 py-2.5"><Badge label={STAGE_LABELS[d.stage as Stage]} stage={d.stage} /></td>
            <td className="px-4 py-2.5">{d.valueCents > 0 ? centsToBRL(d.valueCents) : "—"}</td>
          </tr>
        ))}
        {deals.length === 0 && (
          <tr><td className="px-4 py-2.5 text-slate-500" colSpan={4}>Nenhum negócio cadastrado.</td></tr>
        )}
      </Table>
      {open && <DealForm open onClose={() => setOpen(false)} onSaved={() => void reload()} />}
    </div>
  );
}
