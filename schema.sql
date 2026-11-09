-- =====================================================================
--  CRM IMOBILIÁRIO — DDL de referência (SQLite 3.45+)
--  Fonte da verdade: ARQUITETURA.md + schemas/*.schema.json
--  Convenção: identificadores em snake_case; dinheiro em CENTAVOS (integer);
--  datas em TEXT ISO-8601 UTC; booleanos em INTEGER 0/1; listas em JSON TEXT.
-- =====================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ---------------------------------------------------------------- user
CREATE TABLE IF NOT EXISTS "user" (
  id          TEXT PRIMARY KEY,                      -- uuid v4
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL CHECK (role IN ('admin','gestor','corretor','assistente')),
  creci       TEXT,
  phone       TEXT,
  active      INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- -------------------------------------------------------------- person
CREATE TABLE IF NOT EXISTS person (
  id             TEXT PRIMARY KEY,
  type           TEXT NOT NULL CHECK (type IN ('comprador','proprietario','inquilino','fiador','corretor_parceiro')),
  name           TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 160),
  document       TEXT,                               -- CPF 11 / CNPJ 14 dígitos
  email          TEXT,
  phone          TEXT,                               -- E.164
  whatsapp       TEXT,
  birth_date     TEXT,
  marital_status TEXT CHECK (marital_status IN ('solteiro','casado','divorciado','viuvo','uniao_estavel')),
  profession     TEXT,
  income_cents   INTEGER CHECK (income_cents >= 0),
  credit_score   INTEGER CHECK (credit_score BETWEEN 0 AND 1000),
  pref_budget_min_cents INTEGER,
  pref_budget_max_cents INTEGER,
  pref_bedrooms_min     INTEGER,
  pref_neighborhoods    TEXT NOT NULL DEFAULT '[]',  -- JSON array<string>
  pref_property_types   TEXT NOT NULL DEFAULT '[]',  -- JSON array<PropertyType>
  pref_financing        TEXT,
  street         TEXT,
  number         TEXT,
  complement     TEXT,
  district       TEXT,
  city           TEXT,
  state          TEXT CHECK (state IS NULL OR length(state) = 2),
  zip            TEXT,
  source         TEXT NOT NULL CHECK (source IN ('indicacao','site','portal','whatsapp','instagram','facebook','placa','plantao','telefone','outro')),
  tags           TEXT NOT NULL DEFAULT '[]',         -- JSON array<string>
  notes          TEXT,
  lgpd_accepted_at TEXT,
  marketing_opt_in INTEGER NOT NULL DEFAULT 0 CHECK (marketing_opt_in IN (0,1)),
  consent_source TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  deleted_at     TEXT,
  CHECK (pref_budget_max_cents IS NULL OR pref_budget_min_cents IS NULL
         OR pref_budget_max_cents >= pref_budget_min_cents)
);
CREATE INDEX IF NOT EXISTS idx_person_document ON person(document);
CREATE INDEX IF NOT EXISTS idx_person_name     ON person(name);
CREATE INDEX IF NOT EXISTS idx_person_source   ON person(source);

-- --------------------------------------------------------- development
CREATE TABLE IF NOT EXISTS development (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  builder          TEXT,
  status           TEXT NOT NULL CHECK (status IN ('lancamento','em_obras','pronto','entregue')),
  delivery_date    TEXT,
  street TEXT, number TEXT, complement TEXT, district TEXT, city TEXT, state TEXT, zip TEXT,
  price_from_cents INTEGER CHECK (price_from_cents >= 0),
  price_to_cents   INTEGER CHECK (price_to_cents >= 0),
  bedrooms_options TEXT NOT NULL DEFAULT '[]',
  area_options_m2  TEXT NOT NULL DEFAULT '[]',
  amenities        TEXT NOT NULL DEFAULT '[]',
  brochure_url     TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL,
  CHECK (price_to_cents IS NULL OR price_from_cents IS NULL OR price_to_cents >= price_from_cents)
);

-- ------------------------------------------------------------ property
CREATE TABLE IF NOT EXISTS property (
  id               TEXT PRIMARY KEY,
  code             TEXT NOT NULL UNIQUE,             -- AP-1042
  type             TEXT NOT NULL CHECK (type IN ('apartamento','casa','terreno','comercial','rural')),
  purpose          TEXT NOT NULL CHECK (purpose IN ('venda','aluguel','venda_aluguel')),
  status           TEXT NOT NULL CHECK (status IN ('captacao','disponivel','reservado','vendido','alugado','inativo')),
  development_id   TEXT REFERENCES development(id) ON DELETE SET NULL,
  owner_person_id  TEXT REFERENCES person(id)      ON DELETE SET NULL,
  street TEXT, number TEXT, complement TEXT, district TEXT, city TEXT, state TEXT, zip TEXT,
  price_cents        INTEGER NOT NULL CHECK (price_cents > 0),   -- valor_imovel
  condo_fee_cents    INTEGER CHECK (condo_fee_cents >= 0),
  iptu_annual_cents  INTEGER CHECK (iptu_annual_cents >= 0),
  bedrooms      INTEGER NOT NULL DEFAULT 0 CHECK (bedrooms >= 0),
  suites        INTEGER NOT NULL DEFAULT 0 CHECK (suites >= 0),
  bathrooms     INTEGER NOT NULL DEFAULT 0 CHECK (bathrooms >= 0),
  parking_spots INTEGER NOT NULL DEFAULT 0 CHECK (parking_spots >= 0),
  area_m2       REAL NOT NULL CHECK (area_m2 > 0),
  land_area_m2  REAL CHECK (land_area_m2 >= 0),
  floor         INTEGER,
  age_years     INTEGER CHECK (age_years >= 0),
  features      TEXT NOT NULL DEFAULT '[]',
  description   TEXT,
  photos        TEXT NOT NULL DEFAULT '[]',          -- [{url,caption,order}]
  exclusive     INTEGER NOT NULL DEFAULT 0 CHECK (exclusive IN (0,1)),
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_property_status   ON property(status, purpose);
CREATE INDEX IF NOT EXISTS idx_property_price    ON property(price_cents);
CREATE INDEX IF NOT EXISTS idx_property_owner    ON property(owner_person_id);
CREATE INDEX IF NOT EXISTS idx_property_dev      ON property(development_id);

-- ---------------------------------------------------------------- lead
CREATE TABLE IF NOT EXISTS lead (
  id                TEXT PRIMARY KEY,
  person_id         TEXT NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  owner_user_id     TEXT NOT NULL REFERENCES "user"(id),
  source            TEXT NOT NULL,
  interest_property_id    TEXT REFERENCES property(id) ON DELETE SET NULL,
  interest_development_id TEXT REFERENCES development(id) ON DELETE SET NULL,
  interest_types    TEXT NOT NULL DEFAULT '[]',
  interest_budget_max_cents INTEGER CHECK (interest_budget_max_cents >= 0),
  interest_neighborhoods    TEXT NOT NULL DEFAULT '[]',
  urgency           TEXT NOT NULL CHECK (urgency IN ('imediata','30_dias','90_dias','sem_pressa')),
  temperature       TEXT NOT NULL CHECK (temperature IN ('quente','morno','frio')),
  score             INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  qualified         INTEGER NOT NULL DEFAULT 0 CHECK (qualified IN (0,1)),
  disqualified_reason TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  deleted_at        TEXT,
  CHECK (qualified = 1 OR disqualified_reason IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_lead_owner_temp ON lead(owner_user_id, temperature);
CREATE INDEX IF NOT EXISTS idx_lead_urgency    ON lead(urgency);

-- ---------------------------------------------------------------- deal
CREATE TABLE IF NOT EXISTS deal (
  id                 TEXT PRIMARY KEY,
  code               TEXT NOT NULL UNIQUE,           -- NEG-2026-0001
  title              TEXT NOT NULL,
  lead_id            TEXT REFERENCES lead(id)      ON DELETE SET NULL,
  buyer_person_id    TEXT NOT NULL REFERENCES person(id),
  property_id        TEXT NOT NULL REFERENCES property(id),
  owner_user_id      TEXT NOT NULL REFERENCES "user"(id),
  stage              TEXT NOT NULL CHECK (stage IN ('novo_lead','contato_feito','qualificado','visita_agendada','proposta','negociacao','reserva','contrato','ganho','perdido')),
  value_cents        INTEGER NOT NULL DEFAULT 0 CHECK (value_cents >= 0),   -- valor_negociado
  expected_close_at  TEXT,
  closed_at          TEXT,
  lost_reason        TEXT CHECK (lost_reason IN ('preco','financiamento_recusado','desistiu','comprou_concorrente','imovel_indisponivel','sem_resposta','outro')),
  lost_notes         TEXT,
  payment_method     TEXT CHECK (payment_method IN ('financiamento','fgts','subsidio','a_vista','permuta')),
  commission_pct     REAL CHECK (commission_pct BETWEEN 0 AND 20),
  last_activity_at   TEXT NOT NULL,
  stage_entered_at   TEXT NOT NULL,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL,
  deleted_at         TEXT,
  CHECK ((stage IN ('ganho','perdido')) = (closed_at IS NOT NULL)),
  CHECK (stage <> 'perdido' OR lost_reason IS NOT NULL),
  CHECK (stage NOT IN ('proposta','negociacao','reserva','contrato','ganho') OR value_cents > 0)
);
CREATE INDEX IF NOT EXISTS idx_deal_stage_owner ON deal(stage, owner_user_id);
CREATE INDEX IF NOT EXISTS idx_deal_property    ON deal(property_id);
CREATE INDEX IF NOT EXISTS idx_deal_last_act    ON deal(last_activity_at);

-- ---------------------------------------------------- deal_stage_history
CREATE TABLE IF NOT EXISTS deal_stage_history (
  id                TEXT PRIMARY KEY,
  deal_id           TEXT NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
  from_stage        TEXT,
  to_stage          TEXT NOT NULL,
  changed_by_user_id TEXT NOT NULL REFERENCES "user"(id),
  note              TEXT,
  created_at        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dsh_deal ON deal_stage_history(deal_id, created_at);

-- ------------------------------------------------------------ proposal
CREATE TABLE IF NOT EXISTS proposal (
  id                TEXT PRIMARY KEY,
  deal_id           TEXT NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
  version           INTEGER NOT NULL CHECK (version >= 1),
  amount_cents      INTEGER NOT NULL CHECK (amount_cents > 0),
  payment_method    TEXT,
  down_payment_cents INTEGER CHECK (down_payment_cents >= 0),
  financing_months  INTEGER CHECK (financing_months BETWEEN 1 AND 420),
  conditions        TEXT,
  status            TEXT NOT NULL CHECK (status IN ('rascunho','enviada','contraproposta','aceita','recusada','expirada')),
  sent_at           TEXT,
  expires_at        TEXT,
  decided_at        TEXT,
  document_url      TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  UNIQUE (deal_id, version)
);
CREATE INDEX IF NOT EXISTS idx_proposal_deal ON proposal(deal_id, status);

-- ------------------------------------------------------------ activity
CREATE TABLE IF NOT EXISTS activity (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('ligacao','whatsapp','email','visita','reuniao','tarefa','nota','sistema')),
  deal_id     TEXT REFERENCES deal(id)   ON DELETE CASCADE,
  lead_id     TEXT REFERENCES lead(id)   ON DELETE CASCADE,
  person_id   TEXT REFERENCES person(id) ON DELETE CASCADE,
  property_id TEXT REFERENCES property(id) ON DELETE SET NULL,
  user_id     TEXT NOT NULL REFERENCES "user"(id),
  title       TEXT NOT NULL,
  body        TEXT,
  due_at      TEXT,
  done_at     TEXT,
  outcome     TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  CHECK (deal_id IS NOT NULL OR lead_id IS NOT NULL OR person_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_activity_due  ON activity(due_at, done_at);
CREATE INDEX IF NOT EXISTS idx_activity_deal ON activity(deal_id, created_at);

-- Atualiza deal.last_activity_at automaticamente
CREATE TRIGGER IF NOT EXISTS trg_activity_touch_deal
AFTER INSERT ON activity
WHEN NEW.deal_id IS NOT NULL
BEGIN
  UPDATE deal SET last_activity_at = NEW.created_at, updated_at = NEW.created_at
  WHERE id = NEW.deal_id;
END;

-- Log automático de mudança de estágio
CREATE TRIGGER IF NOT EXISTS trg_deal_stage_history
AFTER UPDATE OF stage ON deal
WHEN NEW.stage <> OLD.stage
BEGIN
  INSERT INTO deal_stage_history (id, deal_id, from_stage, to_stage, changed_by_user_id, note, created_at)
  VALUES (lower(hex(randomblob(16))), NEW.id, OLD.stage, NEW.stage,
          COALESCE(NEW.owner_user_id, OLD.owner_user_id), NULL, NEW.updated_at);
END;

-- ---------------------------------------------------------- commission
CREATE TABLE IF NOT EXISTS commission (
  id               TEXT PRIMARY KEY,
  deal_id          TEXT NOT NULL UNIQUE REFERENCES deal(id) ON DELETE CASCADE,
  gross_value_cents INTEGER NOT NULL CHECK (gross_value_cents >= 0),
  pct              REAL NOT NULL CHECK (pct BETWEEN 0 AND 20),   -- comissao
  total_cents      INTEGER NOT NULL CHECK (total_cents >= 0),
  split            TEXT NOT NULL DEFAULT '[]',   -- [{userId,pct,amountCents}]
  status           TEXT NOT NULL CHECK (status IN ('prevista','faturada','recebida','cancelada')),
  expected_at      TEXT,
  received_at      TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_commission_status ON commission(status, expected_at);

-- ------------------------------------------------------------ document
CREATE TABLE IF NOT EXISTS document (
  id              TEXT PRIMARY KEY,
  deal_id         TEXT REFERENCES deal(id)     ON DELETE CASCADE,
  person_id       TEXT REFERENCES person(id)   ON DELETE CASCADE,
  property_id     TEXT REFERENCES property(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('rg','cpf','cnh','comprovante_renda','comprovante_residencia','certidao_estado_civil','matricula_imovel','iptu','condominio','contrato','proposta_assinada','distrato','outro')),
  title           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente','solicitado','recebido','em_analise','aprovado','reprovado','vencido')),
  file_url        TEXT,
  file_name       TEXT,
  mime_type       TEXT,
  size_bytes      INTEGER CHECK (size_bytes >= 0),
  issued_at       TEXT,
  expires_at      TEXT,
  requested_at    TEXT,
  received_at     TEXT,
  reviewed_at     TEXT,
  reviewed_by_user_id TEXT REFERENCES "user"(id),
  rejection_reason TEXT,
  notes           TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  CHECK (deal_id IS NOT NULL OR person_id IS NOT NULL OR property_id IS NOT NULL),
  CHECK (status <> 'aprovado' OR file_url IS NOT NULL),
  CHECK (status <> 'reprovado' OR rejection_reason IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_document_status ON document(status);
CREATE INDEX IF NOT EXISTS idx_document_deal   ON document(deal_id, type);
CREATE INDEX IF NOT EXISTS idx_document_expiry ON document(expires_at);

-- ------------------------------------------------------------ views
CREATE VIEW IF NOT EXISTS vw_pipeline AS
SELECT stage,
       COUNT(*)                              AS deal_count,
       COALESCE(SUM(value_cents), 0)         AS total_cents,
       CAST(AVG(julianday('now') - julianday(stage_entered_at)) AS INTEGER) AS avg_age_days
FROM deal
WHERE deleted_at IS NULL
GROUP BY stage;

CREATE VIEW IF NOT EXISTS vw_documentacao_pendente AS
SELECT d.id, d.deal_id, d.type, d.status, d.expires_at, d.rejection_reason
FROM document d
WHERE d.status IN ('pendente','solicitado','reprovado','vencido')
ORDER BY d.expires_at IS NULL, d.expires_at;
