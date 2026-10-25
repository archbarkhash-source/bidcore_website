# Bidcore Marketplace — implementation notes

Built inside the existing Next.js app (same database, same sign-in, same `Company` table). Nothing here creates a second company table or a second account system.

## Go-live steps (the database has NOT been changed yet)

1. Review `docs/marketplace-migration.sql` — 9 new tables, 23 new nullable/defaulted columns on `companies`, **no drops**. Equivalent to `prisma db push` (Prisma warns about the new unique index on `companies.marketplaceSlug`; the column is new and all-NULL, so it cannot conflict).
2. `npm run db:push` (add `--accept-data-loss` only to acknowledge that one warning), then `npm run db:seed:marketplace` (or press "Add default categories" in `/admin/marketplace/categories`).
3. Set `ADMIN_EMAILS` (comma-separated, lowercase) in the host environment. Admins are existing signed-in members whose email is on that list.
4. Existing company rows stay `marketplaceStatus = unlisted`; nothing becomes public until an admin publishes it (`/admin/marketplace/companies`, bulk publish supported).
5. SMTP (already used for OTP mail) is reused for enquiry notifications; if it is not configured, enquiries are still saved and shown in the dashboard.

## Status vocabulary (never interchangeable)

| Field | Meaning |
|---|---|
| `sourceType` | `registry` (MCA import) · `imported` (admin bulk import) · `member` (company-submitted) · `admin` |
| `claimed` / `claimedById` | A representative proved control (company-domain email) or an admin approved a claim |
| `verificationStatus = verified` | An admin reviewed evidence; basis recorded in `verifiedBasis`. The legacy `verified` flag is not used |
| `featured` | Editorial placement by an admin. Not paid, not verification |
| `marketplaceStatus` | `unlisted` · `pending` · `published` · `rejected` · `suspended` — controls public visibility |
| Sponsored | Not built (phase 4). No field or UI exists |

## Routes

Public: `/marketplace`, `/marketplace/companies`, `/marketplace/companies/[slug]`, `/marketplace/products`, `/marketplace/products/[slug]`, `/marketplace/services`, `/marketplace/services/[slug]`, `/marketplace/categories/[slug]`, `/marketplace/search` (redirect used by the search bar).
Business: `/marketplace/list-your-business` (search → claim or create), `/marketplace/dashboard` (+ `/profile`, `/listings`, `/listings/[id|new]`, `/enquiries`, `/enquiries/[id]`, `/settings`).
Admin (404 for non-admins, `noindex`, disallowed in robots): `/admin/marketplace` (+ `companies`, `companies/[id|new]`, `listings`, `claims`, `enquiries`, `reports`, `categories`, `duplicates`, `import`, `audit`).
API: `POST /api/marketplace/enquiries`, `/track`, `/reports`; `GET /api/marketplace/contact` (signed-in only); `POST /api/admin/marketplace/import` (admin only).

## Behaviour worth knowing

- **Contact data**: phone/email/address are shown to signed-in members only (same rule as the rest of the site) unless the company ticks "show publicly". They are never in the cached page HTML for private companies (loaded by `/api/marketplace/contact`).
- **Claiming**: company-domain email → instant claim. Otherwise a claim request is queued for admin review. A claim never sets `verified`.
- **Duplicates**: registration and import check CIN, GSTIN, website domain, and normalised name + state before creating; `/admin/marketplace/duplicates` lists existing groups and merges them (listings/enquiries/claims move; the merged record is deactivated, not deleted; audit-logged).
- **Listings**: free plan = 10 active listings per company. Specification fields come from the category (`attributes` JSON, editable by admins). New listings and company profiles go through admin approval; edits to an already-published listing stay live and are audit-logged. Approved listings expire after 12 months unless renewed.
- **Enquiries**: honeypot, per-IP (5/hour) and per-email (10/day) limits, link/keyword hold queue (held enquiries are not delivered until an admin releases them), supplier + buyer email, activity history, status New → Responded → In discussion → Converted → Closed.
- **Analytics**: only `company_view`, `listing_view` and `enquiry` events (browser beacon; bots and repeat views in a session are ignored).
- **SEO**: per-page titles/descriptions/canonicals, JSON-LD (Organization, Product, Service — no ratings/prices invented), sitemap includes only published companies/listings and categories that contain listings; filtered and empty pages are `noindex,follow`.

## Known limitations / remaining dependencies

- **No file upload infrastructure exists**, so logos, product images and datasheets are https links, not uploads.
- **Tender Connect integration (phase 3) is not built.** Tender invitations live in the BidcoreAI backend and the website's `/send-tender-invite` form is currently a client-side stub that does not send anything; marketplace pages link only to the Tender Connect product page. Needs a BidcoreAI API for supplier invitations before a real "invite to tender" button can exist.
- Single manager per company (`claimedById`); inviting colleagues needs a roles model. Multiple offices/branches are not modelled.
- Search is Postgres `ILIKE`/array matching — fine at current volume; move to full-text/trigram if the directory grows large.
- No payments, featured/sponsored purchase flow, or advanced analytics (phase 4).
- Buyers have no account area; they receive a reference and email confirmation only.
- Not yet exercised against a live database: pages were type-checked, linted, built, and the pure logic is unit-tested (`npm run test:marketplace`), but end-to-end flows need the schema applied first.
