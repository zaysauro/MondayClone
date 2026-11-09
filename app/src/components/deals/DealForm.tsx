import { FormEvent, useEffect, useState } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { api } from "../../lib/api";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, STAGES, STAGE_LABELS } from "../../domain/enums";
import { brlToCents } from "../../lib/money";

interface Person { id: string; name: string }
interface Property { id: string; code: string }

export default function DealForm({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: "", buyerPersonId: "", propertyId: "", ownerUserId: "", stage: "novo_lead", value: "", paymentMethod: "" });
  const [persons, setPersons] = useState<Person[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<Person[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api<Person[]>("/persons").then(setPersons).catch(() => setPersons([]));
    void api<Property[]>("/properties").then(setProperties).catch(() => setProperties([]));
    void api<Person[]>("/users").then(setUsers).catch(() => setUsers([]));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api("/deals", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          buyerPersonId: form.buyerPersonId,
          propertyId: form.propertyId,
          ownerUserId: form.ownerUserId,
          stage: form.stage,
          valueCents: brlToCents(form.value),
          paymentMethod: form.paymentMethod || null,
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
    <Modal open title="Novo negócio" onClose={onClose}>
      <form className="space-y-3" onSubmit={submit}>
        <Input label="Título *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        <Select label="Comprador *" value={form.buyerPersonId} onChange={(v) => setForm({ ...form, buyerPersonId: v })} options={persons.map((p) => ({ value: p.id, label: p.name }))} />
        <Select label="Imóvel *" value={form.propertyId} onChange={(v) => setForm({ ...form, propertyId: v })} options={properties.map((p) => ({ value: p.id, label: p.code }))} />
        <Select label="Corretor responsável *" value={form.ownerUserId} onChange={(v) => setForm({ ...form, ownerUserId: v })} options={users.map((u) => ({ value: u.id, label: u.name }))} />
        <Select label="Etapa" value={form.stage} onChange={(v) => setForm({ ...form, stage: v })} options={STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }))} placeholder="Novo lead" />
        <Input label="Valor (R$)" value={form.value} onChange={(v) => setForm({ ...form, value: v })} placeholder="0,00" />
        <Select label="Forma de pagamento" value={form.paymentMethod} onChange={(v) => setForm({ ...form, paymentMethod: v })} options={PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] }))} />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}
