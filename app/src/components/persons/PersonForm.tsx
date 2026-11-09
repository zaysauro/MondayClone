import { FormEvent, useState } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { api } from "../../lib/api";
import { brlToCents } from "../../lib/money";
import { PERSON_TYPES, PERSON_TYPE_LABELS, LEAD_SOURCES, LEAD_SOURCE_LABELS, MARITAL_STATUSES, MARITAL_STATUS_LABELS } from "../../domain/enums";

const opts = <T extends string>(values: readonly T[], labels: Record<string, string>) =>
  values.map((v) => ({ value: v, label: labels[v as string] }));

export default function PersonForm({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", type: "comprador", email: "", phone: "", income: "", maritalStatus: "", source: "" });
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api("/persons", {
        method: "POST",
        body: JSON.stringify({
          name: form.name, type: form.type, email: form.email || null,
          phone: form.phone || null, incomeCents: brlToCents(form.income),
          maritalStatus: form.maritalStatus || null, source: form.source || null,
        }),
      });
      onClose();
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!open) return null;

  return (
    <Modal open title="Nova pessoa" onClose={onClose}>
      <form className="space-y-3" onSubmit={submit}>
        <Input label="Nome *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Select label="Tipo" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={opts(PERSON_TYPES, PERSON_TYPE_LABELS)} />
        <Input label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Input label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+5511999999999" />
        <Input label="Renda (R$)" value={form.income} onChange={(v) => setForm({ ...form, income: v })} />
        <Select label="Estado civil" value={form.maritalStatus} onChange={(v) => setForm({ ...form, maritalStatus: v })} options={opts(MARITAL_STATUSES, MARITAL_STATUS_LABELS)} />
        <Select label="Origem" value={form.source} onChange={(v) => setForm({ ...form, source: v })} options={opts(LEAD_SOURCES, LEAD_SOURCE_LABELS)} />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}
