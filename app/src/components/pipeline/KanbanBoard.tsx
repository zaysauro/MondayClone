import { useState } from "react";
import { STAGES, STAGE_LABELS, type Stage } from "../../domain/enums";
import type { Deal } from "../../hooks/useDeals";
import StageColumn from "./StageColumn";
import DealCard from "./DealCard";
import DealDrawer from "./DealDrawer";
import StageChangeDialog from "./StageChangeDialog";

export default function KanbanBoard({ deals, moveTo }: {
  deals: Deal[];
  moveTo: (id: string, to: string, user: string, note?: string) => Promise<unknown>;
}) {
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [open, setOpen] = useState<Deal | null>(null);
  const [dialog, setDialog] = useState<{ deal: Deal; toStage: Stage } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handleDrop = (toStage: string) => {
    setOver(null);
    const deal = deals.find((d) => d.id === dragged);
    if (!deal || deal.stage === toStage) return setDragged(null);
    setDialog({ deal, toStage: toStage as Stage });
    setDragged(null);
  };

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h1 className="text-xl font-bold">Pipeline de vendas</h1>
        <span className="text-sm text-slate-500">Arraste cards entre as colunas</span>
      </div>
      {toast && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">{toast}</div>
      )}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            title={STAGE_LABELS[stage]}
            isOver={over === stage}
            onDragOver={() => setOver(stage)}
            onDrop={() => handleDrop(stage)}
          >
            {deals
              .filter((d) => d.stage === stage)
              .map((deal) => (
                <DealCard key={deal.id} deal={deal} onDragStart={() => setDragged(deal.id)} onOpen={() => setOpen(deal)} />
              ))}
          </StageColumn>
        ))}
      </div>
      {open && <DealDrawer deal={open} onClose={() => setOpen(null)} />}
      {dialog && (
        <StageChangeDialog
          deal={dialog.deal}
          toStage={dialog.toStage}
          onCancel={() => setDialog(null)}
          onConfirm={async (userId, note) => {
            try {
              await moveTo(dialog.deal.id, dialog.toStage, userId, note);
              setToast(`Negócio movido para "${STAGE_LABELS[dialog.toStage]}".`);
            } catch (e) {
              setToast((e as Error).message);
            }
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}
