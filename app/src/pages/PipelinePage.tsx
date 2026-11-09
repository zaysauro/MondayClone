import KanbanBoard from "../components/pipeline/KanbanBoard";
import { useDeals } from "../hooks/useDeals";

export default function PipelinePage() {
  const { deals, moveTo, error } = useDeals();

  if (error) return <p className="text-sm text-rose-600">Erro ao carregar pipeline: {error}</p>;
  if (!deals || deals.length === 0) return <p className="text-sm text-slate-500">Nenhum negócio no pipeline.</p>;

  return <KanbanBoard deals={deals} moveTo={moveTo} />;
}
