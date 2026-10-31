// Tables of the software gateway (src/lib/software-gateway.ts), one statement per entry. Idempotent. Kept out of prisma/schema.prisma on purpose.
export const SOFTWARE_SCHEMA_SQL: string[] = [
  `CREATE TABLE IF NOT EXISTS software_activations (
     id                 SERIAL PRIMARY KEY,
     licence_id         TEXT NOT NULL,
     product            TEXT NOT NULL,
     licensee           TEXT,
     machine            TEXT NOT NULL,
     install_id         TEXT,
     app_version        TEXT,
     licence_expires_at TIMESTAMPTZ NOT NULL,
     token_hash         TEXT UNIQUE,
     token_expires_at   TIMESTAMPTZ,
     created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
     last_seen_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
     deactivated_at     TIMESTAMPTZ,
     UNIQUE (licence_id, machine)
   )`,
  `CREATE TABLE IF NOT EXISTS software_licence_revocations (
     licence_id TEXT PRIMARY KEY,
     reason     TEXT,
     revoked_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS software_api_log (
     id            BIGSERIAL PRIMARY KEY,
     at            TIMESTAMPTZ NOT NULL DEFAULT now(),
     endpoint      TEXT NOT NULL,
     status        INTEGER NOT NULL,
     activation_id INTEGER,
     licence_id    TEXT,
     ip_hash       TEXT,
     detail        TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS software_api_log_activation ON software_api_log (activation_id, endpoint, at)`,
  `CREATE INDEX IF NOT EXISTS software_api_log_ip ON software_api_log (ip_hash, endpoint, at)`,
  `CREATE INDEX IF NOT EXISTS software_api_log_licence ON software_api_log (licence_id, endpoint, at)`,
];
