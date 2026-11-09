import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

export interface Deal {
  id: string;
  code: string;
  title: string;
  stage: string;
  valueCents: number;
  buyerPersonId: string;
  propertyId: string;
  ownerUserId: string;
  lastActivityAt: string;
  stageEnteredAt: string;
  closedAt: string | null;
  lostReason: string | null;
}

export interface Dashboard {
  vgvCents: number;
  winRate: number;
  ticketMedioCents: number;
  funnel: { stage: string; label: string; count: number; valueCents: number }[];
  agingByStage: { stage: string; label: string; agingDays: number }[];
  estagnados: { stage: string; label: string; lastActivityAt: string; idleDays: number }[];
}

export const useDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setDeals(await api<Deal[]>("/deals"));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const moveTo = useCallback(async (id: string, toStage: string, changedByUserId: string, note?: string) => {
    await api<Deal>(`/deals/${id}/stage`, {
      method: "PUT",
      body: JSON.stringify({ toStage, changedByUserId, note }),
    });
    await reload();
  }, [reload]);

  return { deals, loading, error, reload, moveTo };
};

export const useStageChange = () => {
  const [dialog, setDialog] = useState<{ deal: Deal; toStage: string } | null>(null);
  return { dialog, setDialog };
};

export const useDashboard = () => {
  const [data, setData] = useState<Dashboard | null>(null);
  useEffect(() => {
    api<Dashboard>("/dashboard").then(setData).catch(() => setData(null));
  }, []);
  return data;
};
