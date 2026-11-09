import { z } from "zod";
import {
  PERSON_TYPES,
  PROPERTY_TYPES,
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
  DEVELOPMENT_STATUSES,
  LEAD_SOURCES,
  LEAD_TEMPERATURES,
  URGENCIES,
  PAYMENT_METHODS,
  PROPOSAL_STATUSES,
  ACTIVITY_TYPES,
  LOST_REASONS,
  COMMISSION_STATUSES,
  USER_ROLES,
  MARITAL_STATUSES,
  STAGES,
  type Stage,
} from "./enums";

/* ---------- primitivos ---------- */
const money = z.number().int("Valor deve ser em centavos (inteiro)").nonnegative("Valor não pode ser negativo");
const positiveMoney = money.refine((v) => v > 0, { message: "Valor deve ser maior que zero" });
const isoDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), { message: "Data ISO-8601 inválida" })
  .nullable()
  .optional();
const uuid = z.string().uuid("ID deve ser um UUID v4");
const uuidOrNull = uuid.nullable().optional();
const email = z.string().email("E-mail inválido").nullable().optional();
const phone = z.string().regex(/^\+[1-9]\d{7,14}$/, "Telefone deve estar no formato E.164").nullable().optional();
const cpfCnpj = z.string().regex(/^\d{11}$|^\d{14}$/, "Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos").nullable().optional();

const addressSchema = z
  .object({
    street: z.string().min(1, "Rua obrigatória"),
    number: z.string().min(1, "Número obrigatório"),
    complement: z.string().nullable().optional(),
    district: z.string().min(1, "Bairro obrigatório"),
    city: z.string().min(1, "Cidade obrigatória"),
    state: z.string().length(2, "UF deve ter 2 letras"),
    zip: z.string().length(8, "CEP deve ter 8 dígitos"),
  })
  .nullable()
  .optional();

/* ---------- person ---------- */
export const personSchema = z
  .object({
    type: z.enum(PERSON_TYPES, { errorMap: () => ({ message: "Tipo de pessoa inválido" }) }),
    name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(160, "Nome máximo 160 caracteres"),
    document: cpfCnpj,
    email,
    phone,
    whatsapp: phone,
    birthDate: isoDate,
    maritalStatus: z.enum(MARITAL_STATUSES).nullable().optional(),
    profession: z.string().nullable().optional(),
    incomeCents: money.nullable().optional(),
    creditScore: z.number().int().min(0, "Score mínimo 0").max(1000, "Score máximo 1000").nullable().optional(),
    preferences: z
      .object({
        budgetMinCents: money.nullable().optional(),
        budgetMaxCents: money.nullable().optional(),
        bedroomsMin: z.number().int().nullable().optional(),
        neighborhoods: z.array(z.string()).optional(),
        propertyTypes: z.array(z.enum(PROPERTY_TYPES)).optional(),
        financing: z.enum(PAYMENT_METHODS).nullable().optional(),
      })
      .superRefine((p, ctx) => {
        if (p.budgetMinCents != null && p.budgetMaxCents != null && p.budgetMaxCents < p.budgetMinCents) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["budgetMaxCents"], message: "Orçamento máximo deve ser maior ou igual ao mínimo" });
        }
      })
      .optional(),
    address: addressSchema,
    source: z.enum(LEAD_SOURCES).nullable().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().nullable().optional(),
  })
  .strict();

/* ---------- development ---------- */
export const developmentSchema = z
  .object({
    name: z.string().min(2, "Nome obrigatório"),
    builder: z.string().nullable().optional(),
    status: z.enum(DEVELOPMENT_STATUSES, { errorMap: () => ({ message: "Status do empreendimento inválido" }) }),
    deliveryDate: isoDate,
    address: addressSchema,
    priceFromCents: money.nullable().optional(),
    priceToCents: money.nullable().optional(),
    bedroomsOptions: z.array(z.number().int()).optional(),
    areaOptionsM2: z.array(z.number()).optional(),
    amenities: z.array(z.string()).optional(),
    brochureUrl: z.string().url("URL inválida").nullable().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.priceFromCents != null && d.priceToCents != null && d.priceToCents < d.priceFromCents) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["priceToCents"], message: "Preço final deve ser maior ou igual ao inicial" });
    }
  });

/* ---------- property ---------- */
export const propertySchema = z.object({
  code: z.string().min(2, "Código obrigatório"),
  type: z.enum(PROPERTY_TYPES, { errorMap: () => ({ message: "Tipo de imóvel inválido" }) }),
  purpose: z.enum(PROPERTY_PURPOSES, { errorMap: () => ({ message: "Finalidade inválida" }) }),
  status: z.enum(PROPERTY_STATUSES, { errorMap: () => ({ message: "Status de imóvel inválido" }) }).optional(),
  developmentId: uuidOrNull,
  ownerPersonId: uuidOrNull,
  address: addressSchema,
  priceCents: positiveMoney,
  condoFeeCents: money.nullable().optional(),
  iptuAnnualCents: money.nullable().optional(),
  bedrooms: z.number().int("Quartos deve ser inteiro").nonnegative().optional(),
  suites: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  parkingSpots: z.number().int().nonnegative().optional(),
  areaM2: z.number().nonnegative("Área não pode ser negativa").optional(),
  landAreaM2: z.number().nullable().optional(),
  floor: z.number().int().nullable().optional(),
  ageYears: z.number().int().nullable().optional(),
  features: z.array(z.string()).optional(),
  description: z.string().nullable().optional(),
  photos: z
    .array(
      z.object({
        url: z.string().url("URL inválida"),
        caption: z.string().nullable().optional(),
        order: z.number().int(),
      }),
    )
    .optional(),
  exclusive: z.boolean().optional(),
});

/* ---------- lead ---------- */
export const leadSchema = z.object({
  personId: uuid,
  ownerUserId: uuid,
  source: z.enum(LEAD_SOURCES, { errorMap: () => ({ message: "Origem inválida" }) }),
  interest: z
    .object({
      propertyId: uuidOrNull,
      developmentId: uuidOrNull,
      propertyTypes: z.array(z.enum(PROPERTY_TYPES)).optional(),
      budgetMaxCents: money.nullable().optional(),
      neighborhoods: z.array(z.string()).optional(),
      urgency: z.enum(URGENCIES).optional(),
    })
    .optional(),
  temperature: z.enum(LEAD_TEMPERATURES, { errorMap: () => ({ message: "Temperatura inválida" }) }),
  score: z.number().int().min(0, "Score mínimo 0").max(100, "Score máximo 100"),
  qualified: z.boolean().optional(),
  disqualifiedReason: z.string().nullable().optional(),
});

/* ---------- deal ---------- */
export const dealSchema = z.object({
  title: z.string().min(2, "Título obrigatório"),
  leadId: uuidOrNull,
  buyerPersonId: uuid,
  propertyId: uuid,
  ownerUserId: uuid,
  stage: z.enum(STAGES).default("novo_lead"),
  valueCents: money.default(0),
  expectedCloseAt: isoDate,
  closedAt: isoDate,
  lostReason: z.enum(LOST_REASONS).nullable().optional(),
  lostNotes: z.string().nullable().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).nullable().optional(),
  commissionPct: z.number().min(0, "Comissão mínima 0%").max(20, "Comissão máxima 20%").nullable().optional(),
});

/* ---------- activity ---------- */
export const activitySchema = z.object({
  type: z.enum(ACTIVITY_TYPES, { errorMap: () => ({ message: "Tipo de atividade inválido" }) }),
  dealId: uuidOrNull,
  leadId: uuidOrNull,
  personId: uuidOrNull,
  propertyId: uuidOrNull,
  userId: uuid,
  title: z.string().min(2, "Título obrigatório"),
  body: z.string().nullable().optional(),
  dueAt: isoDate,
  doneAt: isoDate,
  outcome: z.string().nullable().optional(),
});

/* ---------- proposal ---------- */
export const proposalSchema = z.object({
  dealId: uuid,
  version: z.number().int().min(1, "Versão mínima 1").optional(),
  amountCents: positiveMoney,
  paymentMethod: z.enum(PAYMENT_METHODS).nullable().optional(),
  downPaymentCents: money.nullable().optional(),
  financingMonths: z.number().int().nullable().optional(),
  conditions: z.string().nullable().optional(),
  status: z.enum(PROPOSAL_STATUSES).default("rascunho"),
  sentAt: isoDate,
  expiresAt: isoDate,
  decidedAt: isoDate,
  documentUrl: z.string().url("URL inválida").nullable().optional(),
});

/* ---------- user ---------- */
export const userSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  role: z.enum(USER_ROLES, { errorMap: () => ({ message: "Perfil inválido" }) }),
  creci: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

/* ---------- commission ---------- */
export const commissionSchema = z.object({
  dealId: uuid,
  grossValueCents: positiveMoney,
  pct: z.number().min(0, "Percentual não pode ser negativo").max(100, "Percentual máximo 100"),
  totalCents: money,
  status: z.enum(COMMISSION_STATUSES).default("prevista"),
  expectedAt: isoDate,
  receivedAt: isoDate,
});

/* ---------- regras condicionais do deal (SPEC §5, regras 3 e 4) ---------- */
export const OPEN_STAGES: Stage[] = [
  "novo_lead",
  "contato_feito",
  "qualificado",
  "visita_agendada",
  "proposta",
  "negociacao",
  "reserva",
  "contrato",
];

export function validateDealRules(deal: {
  stage: Stage;
  valueCents: number;
  closedAt: string | null | undefined;
  lostReason?: string | null;
}): void {
  const stage: Stage = deal.stage;
  if (stage === "ganho" || stage === "perdido") {
    if (!deal.closedAt) {
      throw new Error("closedAt é obrigatório quando o negócio está em ganho/perdido.");
    }
  } else if (deal.closedAt) {
    throw new Error("closedAt só é permitido quando o negócio está ganho ou perdido.");
  }
  if (stage === "perdido" && !deal.lostReason) {
    throw new Error("lostReason é obrigatório quando o negócio está perdido.");
  }
  if (deal.lostReason && stage !== "perdido") {
    throw new Error("lostReason só pode existir quando o negócio está perdido.");
  }
  if (OPEN_STAGES.indexOf(stage) >= 3 && deal.valueCents <= 0) {
    // inícios em: proposta(3) — até contrato(7)
    throw new Error("valueCents deve ser maior que zero a partir da etapa proposta.");
  }
}
