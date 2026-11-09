import { FormEvent, useEffect, useState } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { api } from "../../lib/api";
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from "../../domain/enums";

interface Deal { id: string; title: string }
interface Person { id: string; name: string }

export default function ActivityForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ type: "ligacao", title: "", dealId: "", personId: "", body: "" });
  const [deals, setDeals] = useState<Deal[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [users, setUsers] = useState<Deal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api<Deal[]>("/deals").then(setDeals).catch(() => setDeals([]));
    void api<Person[]>("/persons").then(setPersons).catch(() => setPersons([]));
    void api<Deal[]>("/users").then(setUsers).catch(() => setUsers([]));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api("/activities", {
        method: "POST",
        body: JSON.stringify({
          type: form.type, title: form.title, dealId: form.dealId || null,
          personId: form.personId || null, body: form.body || null,
          userId: users[0]?.id,
        }),
      });
      onClose();
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Modal open title="Nova atividade" onClose={onClose}>
      <form className="space-y-3" onSubmit={submit}>
        <Select label="Tipo" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={ACTIVITY_TYPES.map((t) => ({ value: t, label: ACTIVITY_TYPE_LABELS[t] }))} />
        <Input label="Título *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        <Select label="Negócio" value={form.dealId} onChange={(v) => setForm({ ...form, dealId: v })} options={deals.map((d) => ({ value: d.id, label: d.title }))} />
        <Select label="Pessoa" value={form.personId} onChange={(v) => setForm({ ...form, personId: v })} options={persons.map((p) => ({ value: p.id, label: p.name }))} />
        <Input label="Observações" value={form.body} onChange={(v) => setForm({ ...form, body: v })} />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}
