// Tables of the tender invitation gateway (Phase 2; src/lib/tc-*.ts). One statement per entry, idempotent, created on first use - not in prisma/schema.prisma on purpose.
// Every tender row carries the tenant (the company account behind an installed program: "lic:<licence id>" or "trial:<product>:<computer>"); everything below a
// tender (invitations, bids, documents, messages, contact requests) is reached only through its tender, so one company can never read another's.
// Contractor e-mail addresses are never stored here: they are read from the directory when an e-mail is sent; only a hash is kept for the suppression list.
export const TC_SCHEMA_SQL: string[] = [
  `ALTER TABLE software_activations ADD COLUMN IF NOT EXISTS tenant_id TEXT`,
  `CREATE TABLE IF NOT EXISTS software_trials (
     product    TEXT NOT NULL,
     machine    TEXT NOT NULL,
     started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
     expires_at TIMESTAMPTZ NOT NULL,
     ip_hash    TEXT,
     PRIMARY KEY (product, machine)
   )`,
  `CREATE TABLE IF NOT EXISTS tc_tenders (
     id              UUID PRIMARY KEY,
     tenant_id       TEXT NOT NULL,
     local_ref       TEXT NOT NULL,
     title           TEXT NOT NULL,
     package_number  TEXT,
     project_name    TEXT,
     trade           TEXT,
     location        TEXT,
     description     TEXT,
     inviter_company TEXT NOT NULL,
     inviter_name    TEXT,
     currency        TEXT NOT NULL DEFAULT 'INR',
     due_at          TIMESTAMPTZ,
     bid_form        JSONB,
     status          TEXT NOT NULL DEFAULT 'open',
     created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (tenant_id, local_ref)
   )`,
  // a file is stored as chunks of at most 4 MB (Vercel functions take about 4.5 MB per request)
  `CREATE TABLE IF NOT EXISTS tc_files (
     id         UUID PRIMARY KEY,
     tenant_id  TEXT NOT NULL,
     tender_id  UUID NOT NULL REFERENCES tc_tenders(id) ON DELETE CASCADE,
     owner      TEXT NOT NULL,
     bid_id     UUID,
     invitation_id UUID,
     name       TEXT NOT NULL,
     mime       TEXT NOT NULL,
     size       BIGINT NOT NULL,
     sha256     TEXT NOT NULL,
     chunks     INTEGER NOT NULL,
     status     TEXT NOT NULL DEFAULT 'uploading',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS tc_files_tender ON tc_files (tender_id, owner)`,
  `CREATE TABLE IF NOT EXISTS tc_file_chunks (
     file_id UUID NOT NULL REFERENCES tc_files(id) ON DELETE CASCADE,
     idx     INTEGER NOT NULL,
     data    BYTEA NOT NULL,
     PRIMARY KEY (file_id, idx)
   )`,
  `CREATE TABLE IF NOT EXISTS tc_invitations (
     id            UUID PRIMARY KEY,
     tender_id     UUID NOT NULL REFERENCES tc_tenders(id) ON DELETE CASCADE,
     tenant_id     TEXT NOT NULL,
     company_key   TEXT NOT NULL,
     company_name  TEXT NOT NULL,
     token_hash    TEXT NOT NULL UNIQUE,
     expires_at    TIMESTAMPTZ NOT NULL,
     status        TEXT NOT NULL DEFAULT 'sent',
     answer        TEXT,
     answered_at   TIMESTAMPTZ,
     viewed_at     TIMESTAMPTZ,
     email_hash    TEXT,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (tender_id, company_key)
   )`,
  `CREATE INDEX IF NOT EXISTS tc_invitations_tenant ON tc_invitations (tenant_id, updated_at, id)`,
  `CREATE TABLE IF NOT EXISTS tc_bids (
     id            UUID PRIMARY KEY,
     invitation_id UUID NOT NULL REFERENCES tc_invitations(id) ON DELETE CASCADE,
     revision      INTEGER NOT NULL,
     request_key   TEXT NOT NULL,
     payload       JSONB NOT NULL,
     submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (invitation_id, revision),
     UNIQUE (invitation_id, request_key)
   )`,
  `CREATE TABLE IF NOT EXISTS tc_messages (
     id            UUID PRIMARY KEY,
     invitation_id UUID NOT NULL REFERENCES tc_invitations(id) ON DELETE CASCADE,
     sender        TEXT NOT NULL,
     body          TEXT NOT NULL,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS tc_messages_inv ON tc_messages (invitation_id, created_at)`,
  // consent record: who asked, when the contractor decided, what was shared with which company account
  `CREATE TABLE IF NOT EXISTS tc_contact_requests (
     id            UUID PRIMARY KEY,
     invitation_id UUID NOT NULL REFERENCES tc_invitations(id) ON DELETE CASCADE,
     tenant_id     TEXT NOT NULL,
     requested_by  TEXT,
     requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
     status        TEXT NOT NULL DEFAULT 'pending',
     decided_at    TIMESTAMPTZ,
     decided_ip    TEXT,
     shared        JSONB,
     UNIQUE (invitation_id)
   )`,
  `CREATE TABLE IF NOT EXISTS tc_portal_codes (
     invitation_id UUID PRIMARY KEY REFERENCES tc_invitations(id) ON DELETE CASCADE,
     code_hash     TEXT NOT NULL,
     expires_at    TIMESTAMPTZ NOT NULL,
     attempts      INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS tc_suppressions (
     email_hash TEXT PRIMARY KEY,
     reason     TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS tc_abuse_reports (
     id            BIGSERIAL PRIMARY KEY,
     invitation_id UUID,
     tenant_id     TEXT NOT NULL,
     reason        TEXT,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS tc_events (
     id            BIGSERIAL PRIMARY KEY,
     at            TIMESTAMPTZ NOT NULL DEFAULT now(),
     tenant_id     TEXT,
     invitation_id UUID,
     actor         TEXT NOT NULL,
     event         TEXT NOT NULL,
     detail        TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS tc_events_tenant ON tc_events (tenant_id, event, at)`,
];
