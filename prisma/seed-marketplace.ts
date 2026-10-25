import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_CATEGORIES } from "../src/lib/marketplace/constants";

// Copies the standard marketplace categories into the database. Idempotent: a category whose slug already exists is left exactly as it is (an admin may have edited it).
// Same result as the "Add default categories" button on /admin/marketplace/categories.
const db = new PrismaClient();

async function main() {
  let created = 0;
  for (const [i, c] of DEFAULT_CATEGORIES.entries()) {
    let parent = await db.marketplaceCategory.findUnique({ where: { slug: c.slug } });
    if (!parent) {
      parent = await db.marketplaceCategory.create({ data: { slug: c.slug, name: c.name, description: c.description, kind: c.kind, sortOrder: i, attributes: JSON.parse(JSON.stringify(c.attributes ?? [])) } });
      created++;
    }
    for (const [j, ch] of (c.children ?? []).entries()) {
      if (await db.marketplaceCategory.findUnique({ where: { slug: ch.slug }, select: { id: true } })) continue;
      await db.marketplaceCategory.create({ data: { slug: ch.slug, name: ch.name, kind: c.kind, parentId: parent.id, sortOrder: j, attributes: JSON.parse(JSON.stringify(ch.attributes ?? [])) } });
      created++;
    }
  }
  console.log(`Marketplace categories: ${created} created, the rest already existed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
