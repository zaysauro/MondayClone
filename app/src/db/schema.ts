import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const iso = () => text("created_at").notNull();

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  creci: text("creci"),
  phone: text("phone"),
  active: integer("active").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const persons = sqliteTable(
  "persons",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    name: text("name").notNull(),
    document: text("document"),
    email: text("email"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    birthDate: text("birth_date"),
    maritalStatus: text("marital_status"),
    profession: text("profession"),
    incomeCents: integer("income_cents"),
    creditScore: integer("credit_score"),
    preferences: text("preferences", { mode: "json" }).$type<Record<string, unknown>>(),
    address: text("address", { mode: "json" }).$type<Record<string, unknown> | null>(),
    source: text("source"),
    tags: text("tags", { mode: "json" }).$type<string[]>(),
    notes: text("notes"),
    lgpdAcceptedAt: text("lgpd_accepted_at"),
    marketingOptIn: integer("marketing_opt_in").notNull().default(0),
    consentSource: text("consent_source"),
    createdAt: iso(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  // @ts-ignore
  (t) => [index("idx_person_document").on(t.document)],
);

export const developments = sqliteTable("developments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  builder: text("builder"),
  status: text("status").notNull(),
  deliveryDate: text("delivery_date"),
  address: text("address", { mode: "json" }).$type<Record<string, unknown> | null>(),
  priceFromCents: integer("price_from_cents"),
  priceToCents: integer("price_to_cents"),
  bedroomsOptions: text("bedrooms_options", { mode: "json" }).$type<number[]>(),
  areaOptionsM2: text("area_options_m2", { mode: "json" }).$type<number[]>(),
  amenities: text("amenities", { mode: "json" }).$type<string[]>(),
  brochureUrl: text("brochure_url"),
  createdAt: iso(),
  updatedAt: text("updated_at").notNull(),
});

export const properties = sqliteTable(
  "properties",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    type: text("type").notNull(),
    purpose: text("purpose").notNull(),
    status: text("status").notNull(),
    developmentId: text("development_id").references(() => developments.id),
    ownerPersonId: text("owner_person_id").references(() => persons.id),
    address: text("address", { mode: "json" }).$type<Record<string, unknown> | null>(),
    priceCents: integer("price_cents").notNull(),
    condoFeeCents: integer("condo_fee_cents"),
    iptuAnnualCents: integer("iptu_annual_cents"),
    bedrooms: integer("bedrooms").notNull().default(0),
    suites: integer("suites").notNull().default(0),
    bathrooms: integer("bathrooms").notNull().default(0),
    parkingSpots: integer("parking_spots").notNull().default(0),
    areaM2: real("area_m2").notNull().default(0),
    landAreaM2: real("land_area_m2"),
    floor: integer("floor"),
    ageYears: integer("age_years"),
    features: text("features", { mode: "json" }).$type<string[]>(),
    description: text("description"),
    photos: text("photos", { mode: "json" }).$type<unknown[]>(),
    exclusive: integer("exclusive").notNull().default(0),
    createdAt: iso(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  // @ts-ignore
  (t) => [uniqueIndex("idx_property_code").on(t.code)],
);

export const leads = sqliteTable(
  "leads",
  {
    id: text("id").primaryKey(),
    personId: text("person_id")
      .notNull()
      .references(() => persons.id),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id),
    source: text("source").notNull(),
    interest: text("interest", { mode: "json" }).$type<Record<string, unknown>>(),
    temperature: text("temperature").notNull(),
    score: integer("score").notNull().default(0),
    qualified: integer("qualified").notNull().default(0),
    disqualifiedReason: text("disqualified_reason"),
    createdAt: iso(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  // @ts-ignore
  (t) => [index("idx_lead_owner_temperature").on(t.ownerUserId, t.temperature)],
);

export const deals = sqliteTable(
  "deals",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    title: text("title").notNull(),
    leadId: text("lead_id"),
    buyerPersonId: text("buyer_person_id")
      .notNull()
      .references(() => persons.id),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id),
    stage: text("stage").notNull().default("novo_lead"),
    valueCents: integer("value_cents").notNull().default(0),
    expectedCloseAt: text("expected_close_at"),
    closedAt: text("closed_at"),
    lostReason: text("lost_reason"),
    lostNotes: text("lost_notes"),
    paymentMethod: text("payment_method"),
    commissionPct: real("commission_pct"),
    lastActivityAt: text("last_activity_at").notNull(),
    stageEnteredAt: text("stage_entered_at").notNull(),
    createdAt: iso(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  // @ts-ignore
  (t) => [
    index("idx_deal_stage_owner").on(t.stage, t.ownerUserId) as any,
    index("idx_deal_property").on(t.propertyId) as any,
  ],
);

export const dealStageHistory = sqliteTable(
  "deal_stage_history",
  {
    id: text("id").primaryKey(),
    dealId: text("deal_id")
      .notNull()
      .references(() => deals.id),
    fromStage: text("from_stage"),
    toStage: text("to_stage").notNull(),
    changedByUserId: text("changed_by_user_id").notNull(),
    note: text("note"),
    createdAt: text("created_at").notNull(),
  },
  // @ts-ignore
  (t) => [index("idx_dsh_deal").on(t.dealId) as any],
);

export const proposals = sqliteTable(
  "proposals",
  {
    id: text("id").primaryKey(),
    dealId: text("deal_id")
      .notNull()
      .references(() => deals.id),
    version: integer("version").notNull().default(1),
    amountCents: integer("amount_cents").notNull(),
    paymentMethod: text("payment_method"),
    downPaymentCents: integer("down_payment_cents"),
    financingMonths: integer("financing_months"),
    conditions: text("conditions"),
    status: text("status").notNull().default("rascunho"),
    sentAt: text("sent_at"),
    expiresAt: text("expires_at"),
    decidedAt: text("decided_at"),
    documentUrl: text("document_url"),
    createdAt: iso(),
    updatedAt: text("updated_at").notNull(),
  },
  // @ts-ignore
  (t) => [uniqueIndex("idx_proposal_deal_version").on(t.dealId, t.version) as any],
);

export const activities = sqliteTable(
  "activities",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    dealId: text("deal_id").references(() => deals.id),
    leadId: text("lead_id").references(() => leads.id),
    personId: text("person_id").references(() => persons.id),
    propertyId: text("property_id").references(() => properties.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    body: text("body"),
    dueAt: text("due_at"),
    doneAt: text("done_at"),
    outcome: text("outcome"),
    createdAt: iso(),
    updatedAt: text("updated_at").notNull(),
  },
  // @ts-ignore
  (t) => [index("idx_activity_due_done").on(t.dueAt, t.doneAt)],
);

export const commissions = sqliteTable(
  "commissions",
  {
    id: text("id").primaryKey(),
    dealId: text("deal_id")
      .notNull()
      .references(() => deals.id),
    grossValueCents: integer("gross_value_cents").notNull(),
    pct: real("pct").notNull(),
    totalCents: integer("total_cents").notNull(),
    split: text("split", { mode: "json" }).$type<unknown[]>(),
    status: text("status").notNull().default("prevista"),
    expectedAt: text("expected_at"),
    receivedAt: text("received_at"),
    createdAt: iso(),
    updatedAt: text("updated_at").notNull(),
  },
  // @ts-ignore
  (t) => [uniqueIndex("idx_commission_deal").on(t.dealId)],
);
