Loaded Prisma config from "C:\Users\barkh\AI Assistant Project\Buildbot\bidcore-website\prisma.config.ts".
Prisma config detected, skipping environment variable loading.
-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "contactPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "domain" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "importBatchId" TEXT,
ADD COLUMN     "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "marketplaceSlug" TEXT,
ADD COLUMN     "marketplaceStatus" TEXT NOT NULL DEFAULT 'unlisted',
ADD COLUMN     "moderationNote" TEXT,
ADD COLUMN     "normalizedName" TEXT,
ADD COLUMN     "notifyEnquiries" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pinCode" TEXT,
ADD COLUMN     "projectExperience" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "sourceNote" TEXT,
ADD COLUMN     "sourceType" TEXT NOT NULL DEFAULT 'registry',
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBasis" TEXT;

-- CreateTable
CREATE TABLE "marketplace_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'both',
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "attributes" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_listings" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "brand" TEXT,
    "shortDescription" TEXT,
    "description" TEXT,
    "specs" JSONB NOT NULL DEFAULT '{}',
    "applications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "variants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unit" TEXT,
    "moq" TEXT,
    "priceMode" TEXT NOT NULL DEFAULT 'on_request',
    "priceText" TEXT,
    "supplyLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "availability" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documents" JSONB NOT NULL DEFAULT '[]',
    "scope" TEXT,
    "projectTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pricingBasis" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "rejectionReason" TEXT,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_enquiries" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "listingId" TEXT,
    "userId" TEXT,
    "buyerName" TEXT NOT NULL,
    "buyerCompany" TEXT,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT,
    "quantity" TEXT,
    "unit" TEXT,
    "location" TEXT,
    "projectType" TEXT,
    "timeline" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "marketplace_enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiry_events" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "actorId" TEXT,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_claims" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "roleAtCompany" TEXT,
    "evidence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "company_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_reports" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "detail" TEXT,
    "reporterEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "marketplace_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "companyId" TEXT,
    "listingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_audit" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "filename" TEXT,
    "sourceNote" TEXT NOT NULL,
    "actorEmail" TEXT,
    "total" INTEGER NOT NULL DEFAULT 0,
    "created" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_categories_slug_key" ON "marketplace_categories"("slug");

-- CreateIndex
CREATE INDEX "marketplace_categories_parentId_idx" ON "marketplace_categories"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_listings_slug_key" ON "marketplace_listings"("slug");

-- CreateIndex
CREATE INDEX "marketplace_listings_kind_status_idx" ON "marketplace_listings"("kind", "status");

-- CreateIndex
CREATE INDEX "marketplace_listings_companyId_idx" ON "marketplace_listings"("companyId");

-- CreateIndex
CREATE INDEX "marketplace_listings_categoryId_idx" ON "marketplace_listings"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_enquiries_ref_key" ON "marketplace_enquiries"("ref");

-- CreateIndex
CREATE INDEX "marketplace_enquiries_companyId_status_idx" ON "marketplace_enquiries"("companyId", "status");

-- CreateIndex
CREATE INDEX "marketplace_enquiries_buyerEmail_createdAt_idx" ON "marketplace_enquiries"("buyerEmail", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_enquiries_ipHash_createdAt_idx" ON "marketplace_enquiries"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "enquiry_events_enquiryId_idx" ON "enquiry_events"("enquiryId");

-- CreateIndex
CREATE INDEX "company_claims_status_idx" ON "company_claims"("status");

-- CreateIndex
CREATE INDEX "company_claims_companyId_idx" ON "company_claims"("companyId");

-- CreateIndex
CREATE INDEX "marketplace_reports_status_idx" ON "marketplace_reports"("status");

-- CreateIndex
CREATE INDEX "marketplace_events_companyId_type_createdAt_idx" ON "marketplace_events"("companyId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_events_listingId_type_createdAt_idx" ON "marketplace_events"("listingId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_audit_entityType_entityId_idx" ON "marketplace_audit"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "marketplace_audit_createdAt_idx" ON "marketplace_audit"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "companies_marketplaceSlug_key" ON "companies"("marketplaceSlug");

-- CreateIndex
CREATE INDEX "companies_marketplaceStatus_idx" ON "companies"("marketplaceStatus");

-- CreateIndex
CREATE INDEX "companies_gstin_idx" ON "companies"("gstin");

-- CreateIndex
CREATE INDEX "companies_domain_idx" ON "companies"("domain");

-- CreateIndex
CREATE INDEX "companies_normalizedName_idx" ON "companies"("normalizedName");

-- AddForeignKey
ALTER TABLE "marketplace_categories" ADD CONSTRAINT "marketplace_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "marketplace_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "marketplace_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_enquiries" ADD CONSTRAINT "marketplace_enquiries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_enquiries" ADD CONSTRAINT "marketplace_enquiries_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "marketplace_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_events" ADD CONSTRAINT "enquiry_events_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "marketplace_enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_claims" ADD CONSTRAINT "company_claims_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

