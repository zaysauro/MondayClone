import { demoApi } from "../demo/demo";

export class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "HttpError";
  }
}

export const api = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    // Sem backend (deploy estático): cai no modo demonstração offline.
    return demoApi<T>(path, init);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (data === null) {
    // Resposta sem corpo JSON (ex.: rewrite do SPA no deploy estático) → modo demonstração offline.
    return demoApi<T>(path, init);
  }
  if (!res.ok) throw new HttpError((data && (data as { error?: string }).error) || `Erro HTTP ${res.status}`, res.status);
  return data as T;
};
