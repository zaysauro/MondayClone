/**
 * Modo de demonstração offline para o build estático (Vercel).
 * Replica, em memória + localStorage, as rotas que a UI usa.
 * Nenhum dado sai da máquina do usuário.
 */
import seed from "./seed.json";
import { STAGES, STAGE_LABELS, type Stage } from "../domain/enums";
import { assertTransition } from "../domain/pipeline";

type Row = Record<string, unknown>;

const parseJSON = <T,>(s: unknown, fallback: T): T => {
  if (typeof s !== "string" || s === "") return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
};

const camel = (row: Row, map: Record<string, string>): Row => {
  const out: Row = {};
  for (const [from, to] of Object.entries(map)) {
    if (from in row) out[to] = row[from];
  }
  return out;
};

const mapDeal = (r: Row): Row => ({
  ...camel(r, {
    lead_id: "leadId", buyer_person_id: "buyerPersonId", property_id: "propertyId",
    owner_user_id: "ownerUserId", value_cents: "valueCents", expected_close_at: "expectedCloseAt",
    closed_at: "closedAt", lost_reason: "lostReason", lost_notes: "lostNotes",
    payment_method: "paymentMethod", commission_pct: "commissionPct",
    last_activity_at: "lastActivityAt", stage_entered_at: "stageEnteredAt",
    created_at: "createdAt", updated_at: "updatedAt", deleted_at: "deletedAt",
  }),
  id: r.id, code: r.code, title: r.title, stage: r.stage,
});

const mapPerson = (r: Row): Row => ({
  ...camel(r, {
    birth_date: "birthDate", marital_status: "maritalStatus", income_cents: "incomeCents",
    credit_score: "creditScore", lgpd_accepted_at: "lgpdAcceptedAt",
    marketing_opt_in: "marketingOptIn", consent_source: "consentSource",
    created_at: "createdAt", updated_at: "updatedAt", deleted_at: "deletedAt",
  }),
  id: r.id, type: r.type, name: r.name, document: r.document, email: r.email,
  phone: r.phone, whatsapp: r.whatsapp, profession: r.profession, source: r.source,
  notes: r.notes,
  preferences: parseJSON(r.preferences, null),
  address: parseJSON(r.address, null),
  tags: parseJSON(r.tags, []),
});

const mapProperty = (r: Row): Row => ({
  ...camel(r, {
    development_id: "developmentId", owner_person_id: "ownerPersonId",
    price_cents: "priceCents", condo_fee_cents: "condoFeeCents", iptu_annual_cents: "iptuAnnualCents",
    parking_spots: "parkingSpots", area_m2: "areaM2", land_area_m2: "landAreaM2",
    age_years: "ageYears", created_at: "createdAt", updated_at: "updatedAt", deleted_at: "deletedAt",
  }),
  id: r.id, code: r.code, type: r.type, purpose: r.purpose, status: r.status,
  bedrooms: r.bedrooms, suites: r.suites, bathrooms: r.bathrooms, floor: r.floor,
  description: r.description,
  address: parseJSON(r.address, null),
  features: parseJSON(r.features, []),
  photos: parseJSON(r.photos, []),
  exclusive: !!r.exclusive,
});

const mapActivity = (r: Row): Row => ({
  ...camel(r, {
    deal_id: "dealId", lead_id: "leadId", person_id: "personId", property_id: "propertyId",
    user_id: "userId", due_at: "dueAt", done_at: "doneAt",
    created_at: "createdAt", updated_at: "updatedAt",
  }),
  id: r.id, type: r.type, title: r.title, body: r.body, outcome: r.outcome,
});

interface DemoDb {
  users: Row[];
  persons: Row[];
  properties: Row[];
  deals: Row[];
  activities: Row[];
  dealStageHistory: Row[];
}

const KEY = "crm-demo-v1";

const freshDb = (): DemoDb => ({
  users: (seed.users as Row[]).map((u) => camel(u, { created_at: "createdAt", updated_at: "updatedAt" })),
  persons: (seed.persons as Row[]).map(mapPerson),
  properties: (seed.properties as Row[]).map(mapProperty),
  deals: (seed.deals as Row[]).map(mapDeal),
  activities: (seed.activities as Row[]).map(mapActivity),
  dealStageHistory: (seed.deal_stage_history as Row[]).map((r) => camel(r, {
    deal_id: "dealId", from_stage: "fromStage", to_stage: "toStage",
    changed_by_user_id: "changedByUserId", created_at: "createdAt",
  })),
});

const load = (): DemoDb => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DemoDb;
  } catch { /* se corromper, volta ao seed */ }
  const fresh = freshDb();
  save(fresh);
  return fresh;
};

const save = (db: DemoDb) => {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* quota cheia: mantém em memória */ }
};

let cache: DemoDb | null = null;
const db = (): DemoDb => (cache ??= load());

const parseBody = (init?: RequestInit): Row => {
  try { return JSON.parse(String(init?.body ?? "{}")) as Row; } catch { return {}; }
};

const nowIso = () => new Date().toISOString();

const uuid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const computeDashboard = () => {
  const deals = db().deals;
  const byStage: Record<string, number> = {};
  for (const s of STAGES) byStage[s] = 0;
  let vgv = 0;
  for (const d of deals) {
    const value = Number(d.valueCents ?? 0);
    vgv += value;
    const stage = String(d.stage);
    byStage[stage] = (byStage[stage] ?? 0) + value;
  }
  const won = deals.filter((d) => d.stage === "ganho");
  const lost = deals.filter((d) => d.stage === "perdido");
  const decided = won.length + lost.length;
  const winRate = decided > 0 ? (won.length / decided) * 100 : 0;
  const ticketMedio = won.length
    ? won.reduce((sum, d) => sum + Number(d.valueCents ?? 0), 0) / won.length
    : 0;
  const nowMs = Date.now();
  const agingByStage = STAGES.map((s) => {
    const idx = STAGES.indexOf(s);
    const inStage = deals.filter((d) => d.stage === s && idx < 8);
    const avg = inStage.length
      ? inStage.reduce((sum, d) => sum + (nowMs - new Date(String(d.lastActivityAt)).getTime()) / 86_400_000, 0) / inStage.length
      : 0;
    return { stage: s, label: STAGE_LABELS[s], agingDays: Math.round(avg * 10) / 10 };
  });
  const estagnados = deals
    .filter((d) => {
      const days = (nowMs - new Date(String(d.lastActivityAt)).getTime()) / 86_400_000;
      return days > 15 && STAGES.indexOf(d.stage as Stage) < 8;
    })
    .map((d) => ({
      stage: d.stage,
      label: STAGE_LABELS[d.stage as Stage],
      lastActivityAt: d.lastActivityAt,
      idleDays: Math.round((nowMs - new Date(String(d.lastActivityAt)).getTime()) / 86_400_000),
    }));
  const funnel = STAGES.map((s) => ({
    stage: s,
    label: STAGE_LABELS[s],
    count: deals.filter((d) => d.stage === s).length,
    valueCents: byStage[s] ?? 0,
  }));
  return {
    vgvCents: vgv,
    vgvByStageCents: byStage,
    winRate: Math.round(winRate * 10) / 10,
    ticketMedioCents: Math.round(ticketMedio),
    agingByStage,
    estagnados,
    funnel,
    totais: { deals: deals.length, ganhos: won.length, perdidos: lost.length },
  };
};

export async function demoApi<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const [pathname, query] = path.split("?");
  const data = db();

  // --- USERS -------------------------------------------------------------
  if (method === "GET" && pathname === "/users") {
    return data.users.filter((u) => u.active !== 0) as T;
  }

  // --- DEALS -------------------------------------------------------------
  if (method === "GET" && pathname === "/deals") {
    return data.deals.filter((d) => !d.deletedAt) as T;
  }
  const dealStageMatch = pathname.match(/^\/deals\/([^/]+)\/stage$/);
  if (method === "PUT" && dealStageMatch) {
    const id = dealStageMatch[1]!;
    const deal = data.deals.find((d) => d.id === id && !d.deletedAt);
    if (!deal) throw new Error("Negócio não encontrado");
    const body = parseBody(init);
    const from = deal.stage as Stage;
    const to = body.toStage as Stage;
    assertTransition(from, to);
    const n = nowIso();
    deal.stage = to;
    deal.stageEnteredAt = n;
    deal.lastActivityAt = n;
    deal.updatedAt = n;
    if (to === "ganho" || to === "perdido") deal.closedAt = n;
    if (to === "perdido") { deal.lostReason = body.lostReason ?? null; deal.lostNotes = body.lostNotes ?? null; }
    data.dealStageHistory.push({
      id: uuid(), dealId: id, fromStage: from, toStage: to,
      changedByUserId: body.changedByUserId ?? null, note: body.note ?? null, createdAt: n,
    });
    if (to === "ganho") {
      const prop = data.properties.find((p) => p.id === deal.propertyId);
      if (prop) prop.status = "vendido";
    }
    save(data);
    return deal as T;
  }
  const dealMatch = pathname.match(/^\/deals\/([^/]+)$/);
  if (method === "GET" && dealMatch) {
    const deal = data.deals.find((d) => d.id === dealMatch[1] && !d.deletedAt);
    if (!deal) throw new Error("Negócio não encontrado");
    return deal as T;
  }
  if (method === "POST" && pathname === "/deals") {
    const body = parseBody(init);
    const n = nowIso();
    const deal: Row = {
      id: uuid(), code: `NEG-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`,
      title: body.title, leadId: body.leadId ?? null, buyerPersonId: body.buyerPersonId,
      propertyId: body.propertyId, ownerUserId: body.ownerUserId, stage: body.stage ?? "novo_lead",
      valueCents: body.valueCents ?? 0, expectedCloseAt: body.expectedCloseAt ?? null,
      closedAt: null, lostReason: null, lostNotes: null, paymentMethod: body.paymentMethod ?? null,
      commissionPct: body.commissionPct ?? null, lastActivityAt: n, stageEnteredAt: n,
      createdAt: n, updatedAt: n, deletedAt: null,
    };
    data.deals.unshift(deal);
    data.dealStageHistory.push({ id: uuid(), dealId: deal.id, fromStage: "novo_lead", toStage: deal.stage, changedByUserId: deal.ownerUserId, note: "Criação do negócio (demo)", createdAt: n });
    save(data);
    return deal as T;
  }

  // --- PERSONS -----------------------------------------------------------
  if (method === "GET" && pathname === "/persons") {
    return data.persons.filter((p) => !p.deletedAt) as T;
  }
  if (method === "POST" && pathname === "/persons") {
    const body = parseBody(init);
    const n = nowIso();
    const person: Row = {
      id: uuid(), type: body.type ?? "comprador", name: body.name, document: body.document ?? null,
      email: body.email ?? null, phone: body.phone ?? null, whatsapp: body.whatsapp ?? null,
      birthDate: body.birthDate ?? null, maritalStatus: body.maritalStatus ?? null,
      profession: body.profession ?? null, incomeCents: body.incomeCents ?? null,
      creditScore: body.creditScore ?? null, preferences: body.preferences ?? null,
      address: body.address ?? null, source: body.source ?? null, tags: body.tags ?? [],
      notes: body.notes ?? null, lgpdAcceptedAt: n, marketingOptIn: body.marketingOptIn ? 1 : 0,
      consentSource: body.consentSource ?? "demo", createdAt: n, updatedAt: n, deletedAt: null,
    };
    data.persons.unshift(person);
    save(data);
    return person as T;
  }

  // --- PROPERTIES --------------------------------------------------------
  if (method === "GET" && pathname === "/properties") {
    return data.properties.filter((p) => !p.deletedAt) as T;
  }
  if (method === "POST" && pathname === "/properties") {
    const body = parseBody(init);
    const n = nowIso();
    const property: Row = {
      id: uuid(), code: body.code ?? `AP-${String(Date.now()).slice(-4)}`, type: body.type ?? "apartamento",
      purpose: body.purpose ?? "venda", status: body.status ?? "disponivel",
      developmentId: body.developmentId ?? null, ownerPersonId: body.ownerPersonId ?? null,
      address: body.address ?? null, priceCents: body.priceCents ?? 0,
      condoFeeCents: body.condoFeeCents ?? null, iptuAnnualCents: body.iptuAnnualCents ?? null,
      bedrooms: body.bedrooms ?? 0, suites: body.suites ?? 0, bathrooms: body.bathrooms ?? 0,
      parkingSpots: body.parkingSpots ?? 0, areaM2: body.areaM2 ?? 0, landAreaM2: body.landAreaM2 ?? null,
      floor: body.floor ?? null, ageYears: body.ageYears ?? null, features: body.features ?? [],
      description: body.description ?? null, photos: body.photos ?? [], exclusive: body.exclusive !== false ? 1 : 0,
      createdAt: n, updatedAt: n, deletedAt: null,
    };
    data.properties.unshift(property);
    save(data);
    return property as T;
  }

  // --- ACTIVITIES --------------------------------------------------------
  if (method === "GET" && pathname === "/activities") {
    return data.activities as T;
  }
  if (method === "POST" && pathname === "/activities") {
    const body = parseBody(init);
    const n = nowIso();
    const activity: Row = {
      id: uuid(), type: body.type ?? "nota", dealId: body.dealId ?? null, leadId: body.leadId ?? null,
      personId: body.personId ?? null, propertyId: body.propertyId ?? null,
      userId: body.userId ?? data.users[0]?.id ?? null, title: body.title ?? "Atividade",
      body: body.body ?? null, dueAt: body.dueAt ?? null, doneAt: null, outcome: null,
      createdAt: n, updatedAt: n,
    };
    data.activities.unshift(activity);
    if (activity.dealId) {
      const deal = data.deals.find((d) => d.id === activity.dealId);
      if (deal) { deal.lastActivityAt = n; deal.updatedAt = n; }
    }
    save(data);
    return activity as T;
  }

  // --- DASHBOARD ---------------------------------------------------------
  if (method === "GET" && pathname === "/dashboard") {
    return computeDashboard() as T;
  }

  throw new Error(`Demonstração offline não implementa ${method} ${pathname}${query ? `?${query}` : ""}`);
}

export const resetDemoData = () => {
  cache = freshDb();
  save(cache);
};
