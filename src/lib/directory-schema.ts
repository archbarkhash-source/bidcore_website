// The directory's tables, one statement per entry (Prisma runs one statement per raw call). Idempotent: safe to run again.
// Created by `npm run directory:import`; not part of prisma/schema.prisma on purpose, so `prisma db push` never touches them.
export const DIRECTORY_SCHEMA_SQL: string[] = [
  `CREATE TABLE IF NOT EXISTS directory_companies (
     id          SERIAL PRIMARY KEY,
     key         TEXT NOT NULL UNIQUE,
     slug        TEXT NOT NULL UNIQUE,
     name        TEXT NOT NULL,
     type        TEXT NOT NULL,
     city        TEXT NOT NULL,
     state       TEXT,
     trades      TEXT[] NOT NULL DEFAULT '{}',
     website     TEXT,
     email       TEXT,
     phone       TEXT,
     address     TEXT,
     source_url  TEXT,
     verified_on DATE,
     listed      BOOLEAN NOT NULL DEFAULT TRUE,
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS directory_companies_city_type ON directory_companies (city, type)`,
  `CREATE TABLE IF NOT EXISTS directory_contact_views (
     member_id  TEXT NOT NULL,
     company_id INTEGER NOT NULL REFERENCES directory_companies(id) ON DELETE CASCADE,
     day        DATE NOT NULL DEFAULT CURRENT_DATE,
     PRIMARY KEY (member_id, company_id, day)
   )`,
];
