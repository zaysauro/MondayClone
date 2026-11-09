export const STAGES = [
  "novo_lead",
  "contato_feito",
  "qualificado",
  "visita_agendada",
  "proposta",
  "negociacao",
  "reserva",
  "contrato",
  "ganho",
  "perdido",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_KINDS = ["open", "won", "lost"] as const;
export type StageKind = (typeof STAGE_KINDS)[number];

export const PERSON_TYPES = [
  "comprador",
  "proprietario",
  "inquilino",
  "fiador",
  "corretor_parceiro",
] as const;
export type PersonType = (typeof PERSON_TYPES)[number];

export const PROPERTY_TYPES = [
  "apartamento",
  "casa",
  "terreno",
  "comercial",
  "rural",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_PURPOSES = ["venda", "aluguel", "venda_aluguel"] as const;
export type PropertyPurpose = (typeof PROPERTY_PURPOSES)[number];

export const PROPERTY_STATUSES = [
  "captacao",
  "disponivel",
  "reservado",
  "vendido",
  "alugado",
  "inativo",
] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const DEVELOPMENT_STATUSES = [
  "lancamento",
  "em_obras",
  "pronto",
  "entregue",
] as const;
export type DevelopmentStatus = (typeof DEVELOPMENT_STATUSES)[number];

export const LEAD_SOURCES = [
  "indicacao",
  "site",
  "portal",
  "whatsapp",
  "instagram",
  "facebook",
  "placa",
  "plantao",
  "telefone",
  "outro",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_TEMPERATURES = ["quente", "morno", "frio"] as const;
export type LeadTemperature = (typeof LEAD_TEMPERATURES)[number];

export const URGENCIES = ["imediata", "30_dias", "90_dias", "sem_pressa"] as const;
export type Urgency = (typeof URGENCIES)[number];

export const PAYMENT_METHODS = [
  "financiamento",
  "fgts",
  "subsidio",
  "a_vista",
  "permuta",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PROPOSAL_STATUSES = [
  "rascunho",
  "enviada",
  "contraproposta",
  "aceita",
  "recusada",
  "expirada",
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const ACTIVITY_TYPES = [
  "ligacao",
  "whatsapp",
  "email",
  "visita",
  "reuniao",
  "tarefa",
  "nota",
  "sistema",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const LOST_REASONS = [
  "preco",
  "financiamento_recusado",
  "desistiu",
  "comprou_concorrente",
  "imovel_indisponivel",
  "sem_resposta",
  "outro",
] as const;
export type LostReason = (typeof LOST_REASONS)[number];

export const COMMISSION_STATUSES = [
  "prevista",
  "faturada",
  "recebida",
  "cancelada",
] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export const USER_ROLES = ["admin", "gestor", "corretor", "assistente"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MARITAL_STATUSES = [
  "solteiro",
  "casado",
  "divorciado",
  "viuvo",
  "uniao_estavel",
] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  novo_lead: "Novo lead",
  contato_feito: "Contato feito",
  qualificado: "Qualificado",
  visita_agendada: "Visita agendada",
  proposta: "Proposta enviada",
  negociacao: "Em negociação",
  reserva: "Reserva assinada",
  contrato: "Contrato em assinatura",
  ganho: "Venda fechada",
  perdido: "Perdido",
};

export const STAGE_PROBABILITY: Record<Stage, number> = {
  novo_lead: 5,
  contato_feito: 10,
  qualificado: 20,
  visita_agendada: 35,
  proposta: 50,
  negociacao: 70,
  reserva: 85,
  contrato: 95,
  ganho: 100,
  perdido: 0,
};

export const STAGE_KIND: Record<Stage, StageKind> = {
  novo_lead: "open",
  contato_feito: "open",
  qualificado: "open",
  visita_agendada: "open",
  proposta: "open",
  negociacao: "open",
  reserva: "open",
  contrato: "open",
  ganho: "won",
  perdido: "lost",
};

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  comprador: "Comprador",
  proprietario: "Proprietário",
  inquilino: "Inquilino",
  fiador: "Fiador",
  corretor_parceiro: "Corretor parceiro",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  terreno: "Terreno",
  comercial: "Comercial",
  rural: "Rural",
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  captacao: "Captação",
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
  alugado: "Alugado",
  inativo: "Inativo",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  financiamento: "Financiamento",
  fgts: "FGTS",
  subsidio: "Subsídio",
  a_vista: "À vista",
  permuta: "Permuta",
};

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  preco: "Preço",
  financiamento_recusado: "Financiamento recusado",
  desistiu: "Desistiu",
  comprou_concorrente: "Comprou do concorrente",
  imovel_indisponivel: "Imóvel indisponível",
  sem_resposta: "Sem resposta",
  outro: "Outro",
};

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  contraproposta: "Contraproposta",
  aceita: "Aceita",
  recusada: "Recusada",
  expirada: "Expirada",
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  email: "E-mail",
  visita: "Visita",
  reuniao: "Reunião",
  tarefa: "Tarefa",
  nota: "Nota",
  sistema: "Sistema",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  indicacao: "Indicação",
  site: "Site",
  portal: "Portal",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  placa: "Placa",
  plantao: "Plantão",
  telefone: "Telefone",
  outro: "Outro",
};

export const DEVELOPMENT_STATUS_LABELS: Record<DevelopmentStatus, string> = {
  lancamento: "Lançamento",
  em_obras: "Em obras",
  pronto: "Pronto",
  entregue: "Entregue",
};

export const LEAD_TEMPERATURE_LABELS: Record<LeadTemperature, string> = {
  quente: "Quente",
  morno: "Morno",
  frio: "Frio",
};

export const PROPERTY_PURPOSE_LABELS: Record<PropertyPurpose, string> = {
  venda: "Venda",
  aluguel: "Aluguel",
  venda_aluguel: "Venda e aluguel",
};

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  prevista: "Prevista",
  faturada: "Faturada",
  recebida: "Recebida",
  cancelada: "Cancelada",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  corretor: "Corretor",
  assistente: "Assistente",
};

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
  uniao_estavel: "União estável",
};
