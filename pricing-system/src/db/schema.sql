-- OneAlphaMed Pricing Intelligence System — database schema (SQLite)
-- Principles:
--   * rate_records is append-only (triggers block UPDATE and DELETE). A correction is a new
--     record plus a row in rate_corrections that links old -> new. History is never lost.
--   * rate_type separates client-facing actual rates, internal costs, estimates and pass-through
--     amounts (billed at actuals). An 'actual' rate must cite a source document.
--   * Source documents keep their Drive reference and, for uploads, the archived original + SHA-256.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE CHECK (length(code) BETWEEN 2 AND 8 AND code = upper(code)),
  name        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  description TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS services (
  id            INTEGER PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  category_id   INTEGER NOT NULL REFERENCES categories(id),
  name          TEXT NOT NULL CHECK (length(trim(name)) > 0),
  unit          TEXT NOT NULL CHECK (length(trim(unit)) > 0),
  pricing_basis TEXT NOT NULL CHECK (pricing_basis IN ('fixed','percent','at_actuals','quoted_separately')),
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS service_aliases (
  id         INTEGER PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id),
  alias      TEXT NOT NULL CHECK (length(trim(alias)) > 0),
  UNIQUE (service_id, alias)
);

CREATE TABLE IF NOT EXISTS clients (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS source_documents (
  id                 INTEGER PRIMARY KEY,
  doc_key            TEXT NOT NULL UNIQUE,
  title              TEXT NOT NULL,
  file_type          TEXT,
  client_id          INTEGER REFERENCES clients(id),
  project            TEXT,
  document_date      TEXT NOT NULL CHECK (date(document_date) = document_date),
  date_precision     TEXT NOT NULL DEFAULT 'day' CHECK (date_precision IN ('day','month')),
  reference_no       TEXT,
  currency           TEXT NOT NULL DEFAULT 'INR',
  quoted_subtotal    REAL CHECK (quoted_subtotal IS NULL OR quoted_subtotal >= 0),
  quoted_gst         REAL CHECK (quoted_gst IS NULL OR quoted_gst >= 0),
  quoted_grand_total REAL CHECK (quoted_grand_total IS NULL OR quoted_grand_total >= 0),
  payment_terms      TEXT,
  validity_days      INTEGER CHECK (validity_days IS NULL OR validity_days > 0),
  status             TEXT NOT NULL DEFAULT 'proposal'
                     CHECK (status IN ('proposal','accepted','rejected','invoice','rate_card','other')),
  origin             TEXT NOT NULL CHECK (origin IN ('drive_seed','upload','manual')),
  drive_file_id      TEXT,
  drive_url          TEXT,
  drive_modified     TEXT,
  file_size_bytes    INTEGER,
  original_filename  TEXT,
  stored_file        TEXT,
  mime_type          TEXT,
  sha256             TEXT UNIQUE,
  extracted_text     TEXT,
  extraction_status  TEXT,
  notes              TEXT,
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS rate_records (
  id                   INTEGER PRIMARY KEY,
  service_id           INTEGER NOT NULL REFERENCES services(id),
  document_id          INTEGER REFERENCES source_documents(id),
  client_id            INTEGER REFERENCES clients(id),
  rate_type            TEXT NOT NULL CHECK (rate_type IN ('actual','internal_cost','estimated','pass_through')),
  pricing_basis        TEXT NOT NULL CHECK (pricing_basis IN ('fixed','percent','at_actuals')),
  unit                 TEXT NOT NULL,
  quantity             REAL NOT NULL CHECK (quantity > 0),
  unit_rate            REAL NOT NULL CHECK (unit_rate >= 0),
  amount               REAL CHECK (amount IS NULL OR amount >= 0),
  currency             TEXT NOT NULL DEFAULT 'INR' CHECK (length(currency) = 3),
  original_currency    TEXT CHECK (original_currency IS NULL OR length(original_currency) = 3),
  original_unit_amount REAL CHECK (original_unit_amount IS NULL OR original_unit_amount >= 0),
  fx_rate              REAL CHECK (fx_rate IS NULL OR fx_rate > 0),
  package_size         INTEGER CHECK (package_size IS NULL OR package_size > 0),
  is_optional          INTEGER NOT NULL DEFAULT 0 CHECK (is_optional IN (0,1)),
  effective_date       TEXT NOT NULL CHECK (date(effective_date) = effective_date),
  description          TEXT,
  source_excerpt       TEXT,
  notes                TEXT,
  entered_by           TEXT NOT NULL DEFAULT 'system',
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (rate_type <> 'actual' OR document_id IS NOT NULL),
  CHECK (pricing_basis <> 'percent' OR unit_rate <= 100)
);
CREATE INDEX IF NOT EXISTS ix_rates_service ON rate_records(service_id);
CREATE INDEX IF NOT EXISTS ix_rates_document ON rate_records(document_id);
CREATE INDEX IF NOT EXISTS ix_rates_client ON rate_records(client_id);

CREATE TRIGGER IF NOT EXISTS rate_records_no_update BEFORE UPDATE ON rate_records
BEGIN SELECT RAISE(ABORT, 'rate_records are append-only: record a correction instead'); END;
CREATE TRIGGER IF NOT EXISTS rate_records_no_delete BEFORE DELETE ON rate_records
BEGIN SELECT RAISE(ABORT, 'rate_records are append-only: history cannot be deleted'); END;

CREATE TABLE IF NOT EXISTS rate_corrections (
  id          INTEGER PRIMARY KEY,
  old_rate_id INTEGER NOT NULL UNIQUE REFERENCES rate_records(id),
  new_rate_id INTEGER NOT NULL UNIQUE REFERENCES rate_records(id),
  reason      TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (old_rate_id <> new_rate_id)
);
CREATE TRIGGER IF NOT EXISTS rate_corrections_no_update BEFORE UPDATE ON rate_corrections
BEGIN SELECT RAISE(ABORT, 'rate_corrections are append-only'); END;
CREATE TRIGGER IF NOT EXISTS rate_corrections_no_delete BEFORE DELETE ON rate_corrections
BEGIN SELECT RAISE(ABORT, 'rate_corrections are append-only'); END;

CREATE VIEW IF NOT EXISTS current_rates AS
  SELECT r.* FROM rate_records r
  WHERE NOT EXISTS (SELECT 1 FROM rate_corrections c WHERE c.old_rate_id = r.id);

CREATE TABLE IF NOT EXISTS review_notes (
  id          INTEGER PRIMARY KEY,
  severity    TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('service','document','rate','general')),
  entity_id   INTEGER,
  message     TEXT NOT NULL CHECK (length(trim(message)) > 0),
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  resolution  TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS flag_reviews (
  id         INTEGER PRIMARY KEY,
  flag_key   TEXT NOT NULL UNIQUE,
  decision   TEXT NOT NULL CHECK (decision IN ('confirmed_issue','not_an_issue')),
  note       TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS quotations (
  id          INTEGER PRIMARY KEY,
  quote_no    TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL CHECK (length(trim(client_name)) > 0),
  project     TEXT,
  quote_date  TEXT NOT NULL CHECK (date(quote_date) = quote_date),
  gst_rate    REAL NOT NULL DEFAULT 18 CHECK (gst_rate >= 0 AND gst_rate <= 100),
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected')),
  notes       TEXT,
  subtotal    REAL NOT NULL DEFAULT 0,
  gst_amount  REAL NOT NULL DEFAULT 0,
  total       REAL NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id             INTEGER PRIMARY KEY,
  quotation_id   INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  line_no        INTEGER NOT NULL,
  service_id     INTEGER REFERENCES services(id),
  description    TEXT NOT NULL,
  unit           TEXT,
  pricing_basis  TEXT NOT NULL DEFAULT 'fixed' CHECK (pricing_basis IN ('fixed','percent','at_actuals')),
  quantity       REAL NOT NULL CHECK (quantity > 0),
  unit_rate      REAL NOT NULL CHECK (unit_rate >= 0),
  rate_source    TEXT NOT NULL CHECK (rate_source IN ('latest_actual','median_actual','recommended','manual','pass_through_actuals')),
  rate_record_id INTEGER REFERENCES rate_records(id),
  amount         REAL NOT NULL,
  UNIQUE (quotation_id, line_no)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY,
  at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   INTEGER,
  detail      TEXT
);
