// The table of software subscription requests, one statement per entry (Prisma runs one statement per raw call). Idempotent. Not part of prisma/schema.prisma on purpose,
// so `prisma db push` never touches it. Shared by the website (src/lib/software-requests.ts) and the owner's command line (scripts/software-requests.ts).
export const REQUESTS_SQL: string[] = [
  `CREATE TABLE IF NOT EXISTS software_requests (
     id             SERIAL PRIMARY KEY,
     created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
     product        TEXT NOT NULL,
     years          INTEGER NOT NULL DEFAULT 1,
     name           TEXT NOT NULL,
     email          TEXT NOT NULL,
     phone          TEXT NOT NULL,
     company        TEXT NOT NULL,
     country        TEXT NOT NULL,
     machine_code   TEXT,
     message        TEXT,
     status         TEXT NOT NULL DEFAULT 'new',
     payment_status TEXT NOT NULL DEFAULT 'unpaid',
     payment_ref    TEXT,
     license_id     TEXT,
     issued_at      TIMESTAMPTZ,
     notes          TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS software_requests_status ON software_requests (status, created_at)`,
];

// The computer code a licence can be tied to: shown in the program under Settings > Product Licence, five groups of four letters / digits.
export const MACHINE_CODE = /^[A-Z0-9]{4}(-[A-Z0-9]{4}){4}$/;
