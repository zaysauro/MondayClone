import { FormEvent, useEffect, useState } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { api } from "../../lib/api";
import { brlToCents } from "../../lib/money";
import { PROPERTY_TYPES, PROPERTY_PURPOSES, PROPERTY_STATUSES, PROPERTY_TYPE_LABELS, PROPERTY_PURPOSE_LABELS, PROPERTY_STATUS_LABELS } from "../../domain/enums";

const opts = <T extends string>(values: readonly T[], labels: Record<string, string>) =>
  values.map((v) => ({ value: v, label: labels[v as string] }));

export default function PropertyForm({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ code: "", type: "apartamento", purpose: "venda", price: "", bedrooms: "2", areaM2: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({ code: "", type: "apartamento", purpose: "venda", price: "", bedrooms: "2", areaM2: "" });
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api("/properties", {
        method: "POST",
        body: JSON.stringify({
          code: form.code, type: form.type, purpose: form.purpose,
          priceCents: brlToCents(form.price), bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bedrooms) > 0 ? 1 : 0, suites: 0, parkingSpots: 0,
          areaM2: Number(form.areaM2.replace(",", ".")) || 0,
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
    <Modal open title="Novo imóvel" onClose={onClose}>
      <form className="space-y-3" onSubmit={submit}>
        <Input label="Código *" value={form.code} onChange={(v) => setForm({ ...form, code: v })} placeholder="AP-101" required />
        <Select label="Tipo" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={opts(PROPERTY_TYPES, PROPERTY_TYPE_LABELS)} />
        <Select label="Finalidade" value={form.purpose} onChange={(v) => setForm({ ...form, purpose: v })} options={opts(PROPERTY_PURPOSES, PROPERTY_PURPOSE_LABELS)} />
        <Select label="Status" value="" onChange={() => {}} options={opts(PROPERTY_STATUSES, PROPERTY_STATUS_LABELS)} placeholder="Disponível (padrão)" />
        <Input label="Preço (R$) *" value={form.price} onChange={(v) => setForm({ ...form, price: v })} placeholder="0,00" required />
        <Input label="Quartos" value={form.bedrooms} onChange={(v) => setForm({ ...form, bedrooms: v })} type="number" />
        <Input label="Área (m²)" value={form.areaM2} onChange={(v) => setForm({ ...form, areaM2: v })} placeholder="65" />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  );
}
