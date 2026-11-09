import { useEffect, useState } from "react";
import { api } from "../lib/api";

export const useActivities = (dealId?: string) => {
  const [items, setItems] = useState<unknown[]>([]);
  const reload = () => {
    const q = dealId ? `?dealId=${dealId}` : "";
    api<unknown[]>(`/activities${q}`).then(setItems).catch(() => setItems([]));
  };
  useEffect(() => { reload(); }, [dealId]); // eslint-disable-line react-hooks/exhaustive-deps
  return { items, reload };
};
