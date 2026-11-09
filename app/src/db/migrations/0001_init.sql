-- CRM Imobiliário — migração inicial
PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  creci TEXT,
  phone TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE persons (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  birth_date TEXT,
  marital_status TEXT,
  profession TEXT,
  income_cents INTEGER,
  credit_score INTEGER,
  preferences TEXT,
  address TEXT,
  source TEXT,
  tags TEXT,
  notes TEXT,
  lgpd_accepted_at TEXT,
  marketing_opt_in INTEGER NOT NULL DEFAULT 0,
  consent_source TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX idx_person_document ON persons(document);

CREATE TABLE developments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  builder TEXT,
  status TEXT NOT NULL,
  delivery_date TEXT,
  address TEXT,
  price_from_cents INTEGER,
  price_to_cents INTEGER,
  bedrooms_options TEXT,
  area_options_m2 TEXT,
  amenities TEXT,
  brochure_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE properties (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL,
  development_id TEXT REFERENCES developments(id),
  owner_person_id TEXT REFERENCES persons(id),
  address TEXT,
  price_cents INTEGER NOT NULL,
  condo_fee_cents INTEGER,
  iptu_annual_cents INTEGER,
  bedrooms INTEGER NOT NULL DEFAULT 0,
  suites INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  parking_spots INTEGER NOT NULL DEFAULT 0,
  area_m2 REAL NOT NULL DEFAULT 0,
  land_area_m2 REAL,
  floor INTEGER,
  age_years INTEGER,
  features TEXT,
  description TEXT,
  photos TEXT,
  exclusive INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE UNIQUE INDEX idx_property_code ON properties(code);

CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES persons(id),
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  source TEXT NOT NULL,
  interest TEXT,
  temperature TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  qualified INTEGER NOT NULL DEFAULT 0,
  disqualified_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX idx_lead_owner_temperature ON leads(owner_user_id, temperature);

CREATE TABLE deals (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  lead_id TEXT,
  buyer_person_id TEXT NOT NULL REFERENCES persons(id),
  property_id TEXT NOT NULL REFERENCES properties(id),
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  stage TEXT NOT NULL DEFAULT 'novo_lead',
  value_cents INTEGER NOT NULL DEFAULT 0,
  expected_close_at TEXT,
  closed_at TEXT,
  lost_reason TEXT,
  lost_notes TEXT,
  payment_method TEXT,
  commission_pct REAL,
  last_activity_at TEXT NOT NULL,
  stage_entered_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX idx_deal_stage_owner ON deals(stage, owner_user_id);
CREATE INDEX idx_deal_property ON deals(property_id);

CREATE TABLE deal_stage_history (
  id TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL REFERENCES deals(id),
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_by_user_id TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_dsh_deal ON deal_stage_history(deal_id);

CREATE TABLE proposals (
  id TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL REFERENCES deals(id),
  version INTEGER NOT NULL DEFAULT 1,
  amount_cents INTEGER NOT NULL,
  payment_method TEXT,
  down_payment_cents INTEGER,
  financing_months INTEGER,
  conditions TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  sent_at TEXT,
  expires_at TEXT,
  decided_at TEXT,
  document_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_proposal_deal_version ON proposals(deal_id, version);

CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  deal_id TEXT REFERENCES deals(id),
  lead_id TEXT REFERENCES leads(id),
  person_id TEXT REFERENCES persons(id),
  property_id TEXT REFERENCES properties(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT,
  due_at TEXT,
  done_at TEXT,
  outcome TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_activity_due_done ON activities(due_at, done_at);

CREATE TABLE commissions (
  id TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL REFERENCES deals(id),
  gross_value_cents INTEGER NOT NULL,
  pct REAL NOT NULL,
  total_cents INTEGER NOT NULL,
  split TEXT,
  status TEXT NOT NULL DEFAULT 'prevista',
  expected_at TEXT,
  received_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_commission_deal ON commissions(deal_id);

CREATE TABLE IF NOT EXISTS _migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

-- Regra 5 do SPEC: lastActivityAt atualizado ao inserir activity de deal.
CREATE TRIGGER trg_activity_updates_deal
AFTER INSERT ON activities
WHEN NEW.deal_id IS NOT NULL
BEGIN
  UPDATE deals SET last_activity_at = NEW.created_at WHERE id = NEW.deal_id;
END;
