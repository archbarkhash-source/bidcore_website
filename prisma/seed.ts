import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { STATES, CITIES, COMPANIES } from "../src/lib/data";
import { isBusinessEmail } from "../src/lib/email-domain";

const db = new PrismaClient();

async function main() {
  console.log(`Seeding ${STATES.length} states, ${CITIES.length} cities, ${COMPANIES.length} companies...`);

  for (const state of STATES) {
    await db.state.upsert({
      where: { slug: state.slug },
      update: { name: state.name },
      create: { slug: state.slug, name: state.name },
    });
  }

  const stateIdBySlug = new Map(
    (await db.state.findMany()).map((s) => [s.slug, s.id]),
  );

  for (const city of CITIES) {
    const stateId = stateIdBySlug.get(city.stateSlug);
    if (!stateId) {
      console.warn(`Skipping city "${city.slug}" — unknown state "${city.stateSlug}"`);
      continue;
    }
    await db.city.upsert({
      where: { stateId_slug: { stateId, slug: city.slug } },
      update: { name: city.name },
      create: { slug: city.slug, name: city.name, stateId },
    });
  }

  const cityIdBySlug = new Map(
    (await db.city.findMany()).map((c) => [`${c.stateId}:${c.slug}`, c.id]),
  );

  for (const company of COMPANIES) {
    const stateId = stateIdBySlug.get(company.stateSlug);
    if (!stateId) {
      console.warn(`Skipping company "${company.slug}" — unknown state "${company.stateSlug}"`);
      continue;
    }
    const cityId = cityIdBySlug.get(`${stateId}:${company.citySlug}`);
    const cityName = CITIES.find((c) => c.slug === company.citySlug)?.name;
    if (!cityId) {
      console.warn(`Skipping company "${company.slug}" — unknown city "${company.citySlug}"`);
      continue;
    }

    await db.company.upsert({
      where: { stateId_slug: { stateId, slug: company.slug } },
      update: { cityName },
      create: {
        slug: company.slug,
        name: company.name,
        stateId,
        cityId,
        cityName,
        type: company.type,
        specializations: company.specializations,
        sizeRange: company.sizeRange,
        operatingLocations: company.operatingLocations ?? [],
        website: company.website,
        phone: company.phone,
        email: company.email,
        about: company.about,
        founded: company.founded,
        projectCount: company.projectCount,
        verified: company.verified,
        claimed: company.claimed,
      },
    });
  }

  // Public business contact details, researched from company sources. Kept
  // out of src/lib/data.ts on purpose so they never ship to anonymous
  // visitors — they're only served to signed-in members via the API.
  const contacts: Record<
    string,
    { address: string | null; phone: string | null; email: string | null; website: string | null }
  > = JSON.parse(readFileSync("prisma/contact-data.json", "utf-8"));

  let contactCount = 0;
  for (const [key, c] of Object.entries(contacts)) {
    const [stateSlug, slug] = key.split("/");
    const stateId = stateIdBySlug.get(stateSlug);
    if (!stateId) continue;
    const res = await db.company.updateMany({
      where: { stateId, slug },
      data: { address: c.address, phone: c.phone, email: c.email, website: c.website },
    });
    contactCount += res.count;
  }
  console.log(`Applied contact details to ${contactCount} companies.`);

  // Data-quality rule: a company must have a website or a company-domain
  // email to appear in the directory. Others are excluded, never deleted.
  const all = await db.company.findMany({ select: { id: true, website: true, email: true, active: true } });
  const eligible = (c: (typeof all)[number]) => !!c.website || (!!c.email && isBusinessEmail(c.email));
  const toExclude = all.filter((c) => !eligible(c) && c.active).map((c) => c.id);
  const toRestore = all.filter((c) => eligible(c) && !c.active).map((c) => c.id);
  await db.company.updateMany({
    where: { id: { in: toExclude } },
    data: { active: false, excludedReason: "No website or company-domain email" },
  });
  await db.company.updateMany({ where: { id: { in: toRestore } }, data: { active: true, excludedReason: null } });
  console.log(`Eligibility: excluded ${toExclude.length}, restored ${toRestore.length}.`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
