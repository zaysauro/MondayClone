import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { STAGE_LABELS, type Stage } from "../../domain/enums";
import { canTransition } from "../../domain/pipeline";
import { api } from "../../lib/api";

export default function StageChangeDialog({
  deal, toStage, onCancel, onConfirm,
}: {
  deal: { id: string; title: string; stage: string };
  toStage: Stage;
  onCancel: () => void;
  onConfirm: (userId: string, note?: string) => Promise<void>;
}) {
  const blocked = !canTransition(deal.stage as Stage, toStage);
  const [userId, setUserId] = useState("");
  const [note, setNote] = useState("");
  const [users, setUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Carrega usuários para escolher o responsável pela mudança
    const load = async () => {
      try {
        const data = await api<{ id: string; name: string; role: string }[]>("/users");
        setUsers(data);
        if (data.length) setUserId(data[0].id);
      } catch {
        setUsers([]);
      }
    };
    void load();
  }, []);

  return (
    <Modal open title="Mudar etapa" onClose={onCancel}>
      <p className="text-sm text-slate-600">
        Mover <b>{deal.title}</b> de <b>{STAGE_LABELS[deal.stage as Stage]}</b> para{" "}
        <b>{STAGE_LABELS[toStage]}</b>
      </p>
      {blocked && (
        <div data-testid="transition-blocked" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Transição bloqueada pelo pipeline: não é possível ir de "{STAGE_LABELS[deal.stage as Stage]}" para "
          {STAGE_LABELS[toStage]}". Confira as regras (avanço de uma etapa, retorno permitido; ganho/perdido só de
          reserva ou contrato).
        </div>
      )}
      {!blocked && (
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Responsável *</span>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-600">Observação</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        {!blocked && (
          <Button
            disabled={!userId || busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await onConfirm(userId, note || undefined);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Confirmar
          </Button>
        )}
      </div>
    </Modal>
  );
}
