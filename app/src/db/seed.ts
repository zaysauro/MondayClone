import { openDatabase } from "../lib/db";
import { uuid } from "../lib/uuid";

const db = openDatabase();

/** Remove chaves de sincronização (_) para casar exatamente com os parâmetros SQL. */
function clean<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const r: Record<string, unknown> = { ...row };
  for (const k of Object.keys(r)) {
    if (k.startsWith("_")) { delete r[k]; continue; }
    const v = r[k];
    if (v === null || v === undefined) continue;
    if (typeof v === "object") r[k] = JSON.stringify(v);
  }
  return r;
}

const now = new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const count = db.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number };
if (count.c > 0) {
  console.log("Seed jÃ¡ aplicado â€” nada a fazer (idempotente).");
  process.exit(0);
}

const users = [
  { name: "Ana Gestora", email: "ana@imob.com", role: "gestor", creci: null },
  { name: "Bruno Corretor", email: "bruno@imob.com", role: "corretor", creci: "CRECI-SP-12345" },
  { name: "Carla Corretora", email: "carla@imob.com", role: "corretor", creci: "CRECI-SP-67890" },
].map((u, i) => ({ ...u, id: uuid(), phone: null, active: 1, createdAt: now, updatedAt: now, _key: `u${i}` }));

const persons = [
  { type: "comprador", name: "Diego Souza", document: "39053344705", email: "diego@mail.com", incomeCents: 1_200_000, source: "portal" },
  { type: "comprador", name: "Elisa Moraes", document: "61398939381", email: "elisa@mail.com", incomeCents: 1_800_000, source: "indicacao" },
  { type: "comprador", name: "Fernanda Lima", document: "24210541092", email: "fernanda@mail.com", incomeCents: 900_000, source: "site" },
  { type: "proprietario", name: "Gabriel Torres", document: "06127917052", email: "gabriel@mail.com", incomeCents: null, source: "indicacao" },
  { type: "proprietario", name: "Helena Prado", document: "71428793861", email: "helena@mail.com", incomeCents: null, source: "outro" },
].map((p, i) => ({
  ...p,
  id: uuid(),
  phone: null,
  whatsapp: null,
  birthDate: null,
  maritalStatus: null,
  profession: null,
  creditScore: null,
  preferences: null,
  address: null,
  tags: [],
  notes: null,
  lgpdAcceptedAt: now,
  marketingOptIn: 1,
  consentSource: "site",
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  _key: `p${i}`,
}));

const developments = [
  { name: "Residencial Vista Verde", status: "em_obras", priceFromCents: 45_000_00, priceToCents: 70_000_00, builder: "Construtora Aurora" },
  { name: "Parque Solaris", status: "pronto", priceFromCents: 55_000_00, priceToCents: 90_000_00, builder: "Solaris Incorporadora" },
].map((d, i) => ({
  ...d,
  id: uuid(),
  deliveryDate: null,
  address: null,
  bedroomsOptions: [2, 3],
  areaOptionsM2: [62, 88],
  amenities: ["piscina", "churrasqueira"],
  brochureUrl: null,
  createdAt: now,
  updatedAt: now,
  _key: `d${i}`,
}));

const properties = [
  { code: "AP-101", type: "apartamento", purpose: "venda", status: "disponivel", dev: 0, owner: 3, priceCents: 52_000_00, bedrooms: 2, suites: 1, bathrooms: 2, parking: 1, area: 65 },
  { code: "AP-204", type: "apartamento", purpose: "venda", status: "reservado", dev: 0, owner: 4, priceCents: 68_000_00, bedrooms: 3, suites: 1, bathrooms: 3, parking: 2, area: 88 },
  { code: "AP-302", type: "apartamento", purpose: "venda", status: "disponivel", dev: 1, owner: 3, priceCents: 59_000_00, bedrooms: 2, suites: 1, bathrooms: 2, parking: 1, area: 70 },
  { code: "CS-011", type: "casa", purpose: "venda", status: "disponivel", dev: null, owner: 4, priceCents: 95_000_00, bedrooms: 4, suites: 2, bathrooms: 4, parking: 4, area: 180 },
  { code: "CS-012", type: "casa", purpose: "venda", status: "vendido", dev: null, owner: 3, priceCents: 120_000_00, bedrooms: 4, suites: 3, bathrooms: 5, parking: 4, area: 240 },
  { code: "AP-115", type: "apartamento", purpose: "venda", status: "disponivel", dev: 1, owner: 4, priceCents: 61_000_00, bedrooms: 2, suites: 1, bathrooms: 2, parking: 1, area: 66 },
].map((p, i) => ({
  ...p,
  id: uuid(),
  developmentId: p.dev === null ? null : developments[p.dev].id,
  ownerPersonId: persons[p.owner as number].id,
  address: null,
  condoFeeCents: 60_00,
  iptuAnnualCents: null,
  floor: i % 4,
  ageYears: 5,
  features: [],
  description: null,
  photos: [],
  exclusive: 1,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  _key: `pr${i}`,
}));

const genericPropsFor = (idx: number) => properties.find((p) => p._key === `pr${idx}`)!;

const dealSpecs: { title: string; buyer: number; property: number; stage: string; valueCents: number; actDays: number }[] = [
  { title: "Diego â€” AP-101", buyer: 0, property: 0, stage: "novo_lead", valueCents: 0, actDays: 20 },
  { title: "Elisa â€” AP-302", buyer: 1, property: 2, stage: "contato_feito", valueCents: 0, actDays: 18 },
  { title: "Diego â€” AP-204", buyer: 0, property: 1, stage: "qualificado", valueCents: 0, actDays: 17 },
  { title: "Fernanda â€” AP-115", buyer: 2, property: 5, stage: "visita_agendada", valueCents: 61_000_00, actDays: 6 },
  { title: "Fernanda â€” CS-011", buyer: 2, property: 3, stage: "proposta", valueCents: 95_000_00, actDays: 3 },
  { title: "Elisa â€” CS-012", buyer: 1, property: 4, stage: "negociacao", valueCents: 120_000_00, actDays: 9 },
  { title: "Diego â€” CS-011", buyer: 0, property: 3, stage: "contrato", valueCents: 93_000_00, actDays: 1 },
  { title: "Elisa â€” AP-101", buyer: 1, property: 0, stage: "ganho", valueCents: 51_000_00, actDays: 30 },
];

const deals = dealSpecs.map((s, i) => {
  const closed = s.stage === "ganho";
  return {
    id: uuid(),
    code: `NEG-2026-000${i + 1}`,
    title: s.title,
    leadId: null,
    buyerPersonId: persons[s.buyer].id,
    propertyId: genericPropsFor(s.property).id,
    ownerUserId: users[i % 3].id,
    stage: s.stage,
    valueCents: s.valueCents,
    expectedCloseAt: null,
    closedAt: closed ? daysAgo(2) : null,
    lostReason: null,
    lostNotes: null,
    paymentMethod: closed ? "financiamento" : null,
    commissionPct: closed ? 5 : null,
    lastActivityAt: daysAgo(s.actDays),
    stageEnteredAt: daysAgo(s.actDays),
    createdAt: daysAgo(s.actDays + 10),
    updatedAt: now,
    deletedAt: null,
    _key: `dl${i}`,
  };
});

const stageLabels: Record<string, string> = {
  novo_lead: "Lead recebido via portal",
  contato_feito: "Primeiro contato por WhatsApp",
  qualificado: "Needs qualificados",
  visita_agendada: "Visita marcada",
  proposta: "Proposta enviada",
  negociacao: "NegociaÃ§Ã£o em andamento",
  contrato: "Contrato em assinatura",
  ganho: "Venda fechada",
};

const activities = deals.slice(0, 10).map((d, i) => ({
  id: uuid(),
  type: i % 3 === 0 ? "ligacao" : i % 3 === 1 ? "whatsapp" : "visita",
  dealId: d.id,
  leadId: null,
  personId: null,
  propertyId: null,
  userId: d.ownerUserId,
  title: stageLabels[deals[i].stage] ?? "Acompanhamento",
  body: null,
  dueAt: null,
  doneAt: daysAgo(10 - i),
  outcome: "OK",
  createdAt: daysAgo(10 - i),
  updatedAt: now,
  _key: `ac${i}`,
}));

const proposals = [4, 5].map((di, i) => ({
  id: uuid(),
  dealId: deals[di].id,
  version: 1,
  amountCents: deals[di].valueCents,
  paymentMethod: "financiamento",
  downPaymentCents: Math.round(deals[di].valueCents * 0.2),
  financingMonths: 360,
  conditions: null,
  status: i === 0 ? "aceita" : "enviada",
  sentAt: daysAgo(4),
  expiresAt: daysAgo(-10),
  decidedAt: i === 0 ? daysAgo(2) : null,
  documentUrl: null,
  createdAt: daysAgo(4),
  updatedAt: now,
  _key: `pp${i}`,
}));

const tx = db.transaction(() => {
  const insertUser = db.prepare(
    "INSERT INTO users (id,name,email,role,creci,phone,active,created_at,updated_at) VALUES (@id,@name,@email,@role,@creci,@phone,@active,@createdAt,@updatedAt)",
  );
  users.forEach((u) => insertUser.run(clean(u)));

  const insertPerson = db.prepare(
    `INSERT INTO persons (id,type,name,document,email,phone,whatsapp,birth_date,marital_status,profession,income_cents,credit_score,preferences,address,source,tags,notes,lgpd_accepted_at,marketing_opt_in,consent_source,created_at,updated_at,deleted_at)
     VALUES (@id,@type,@name,@document,@email,@phone,@whatsapp,@birthDate,@maritalStatus,@profession,@incomeCents,@creditScore,@preferences,@address,@source,@tags,@notes,@lgpdAcceptedAt,@marketingOptIn,@consentSource,@createdAt,@updatedAt,@deletedAt)`,
  );
  persons.forEach((p) => insertPerson.run(clean(p)));

  const insertDev = db.prepare(
    "INSERT INTO developments (id,name,builder,status,delivery_date,address,price_from_cents,price_to_cents,bedrooms_options,area_options_m2,amenities,brochure_url,created_at,updated_at) VALUES (@id,@name,@builder,@status,@deliveryDate,@address,@priceFromCents,@priceToCents,@bedroomsOptions,@areaOptionsM2,@amenities,@brochureUrl,@createdAt,@updatedAt)",
  );
  developments.forEach((d) => insertDev.run(clean(d)));

  const insertProp = db.prepare(
    `INSERT INTO properties (id,code,type,purpose,status,development_id,owner_person_id,address,price_cents,condo_fee_cents,iptu_annual_cents,bedrooms,suites,bathrooms,parking_spots,area_m2,land_area_m2,floor,age_years,features,description,photos,exclusive,created_at,updated_at,deleted_at)
     VALUES (@id,@code,@type,@purpose,@status,@developmentId,@ownerPersonId,@address,@priceCents,@condoFeeCents,@iptuAnnualCents,@bedrooms,@suites,@bathrooms,@parkingSpots,@areaM2,@landAreaM2,@floor,@ageYears,@features,@description,@photos,@exclusive,@createdAt,@updatedAt,@deletedAt)`,
  );
  properties.forEach((p) =>
    insertProp.run(clean({ ...p, parkingSpots: p.parking, areaM2: p.area, landAreaM2: null })),
  );

  const insertDeal = db.prepare(
    `INSERT INTO deals (id,code,title,lead_id,buyer_person_id,property_id,owner_user_id,stage,value_cents,expected_close_at,closed_at,lost_reason,lost_notes,payment_method,commission_pct,last_activity_at,stage_entered_at,created_at,updated_at,deleted_at)
     VALUES (@id,@code,@title,@leadId,@buyerPersonId,@propertyId,@ownerUserId,@stage,@valueCents,@expectedCloseAt,@closedAt,@lostReason,@lostNotes,@paymentMethod,@commissionPct,@lastActivityAt,@stageEnteredAt,@createdAt,@updatedAt,@deletedAt)`,
  );
  const insertHistory = db.prepare(
    "INSERT INTO deal_stage_history (id,deal_id,from_stage,to_stage,changed_by_user_id,note,created_at) VALUES (?,?,'novo_lead',?,?,?,?)",
  );
  deals.forEach((d) => {
    insertDeal.run(clean(d));
    insertHistory.run(uuid(), d.id, d.stage, d.ownerUserId, "CriaÃ§Ã£o do negÃ³cio", d.createdAt);
  });

  const insertActivity = db.prepare(
    `INSERT INTO activities (id,type,deal_id,lead_id,person_id,property_id,user_id,title,body,due_at,done_at,outcome,created_at,updated_at)
     VALUES (@id,@type,@dealId,@leadId,@personId,@propertyId,@userId,@title,@body,@dueAt,@doneAt,@outcome,@createdAt,@updatedAt)`,
  );
  activities.forEach((a) => insertActivity.run(clean(a)));

  const insertProposal = db.prepare(
    `INSERT INTO proposals (id,deal_id,version,amount_cents,payment_method,down_payment_cents,financing_months,conditions,status,sent_at,expires_at,decided_at,document_url,created_at,updated_at)
     VALUES (@id,@dealId,@version,@amountCents,@paymentMethod,@downPaymentCents,@financingMonths,@conditions,@status,@sentAt,@expiresAt,@decidedAt,@documentUrl,@createdAt,@updatedAt)`,
  );
  proposals.forEach((p) => insertProposal.run(clean(p)));

  const wonDeal = deals.find((d) => d.stage === "ganho")!;
  db.prepare(
    "INSERT INTO commissions (id,deal_id,gross_value_cents,pct,total_cents,split,status,expected_at,received_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
  ).run(uuid(), wonDeal.id, wonDeal.valueCents, 5, Math.round(wonDeal.valueCents * 0.05), "[]", "prevista", null, null, now, now);
});
tx();

db.close();
console.log("Seed aplicado: 3 users, 5 persons, 2 developments, 6 properties, 8 deals, 10 activities, 2 proposals.");

