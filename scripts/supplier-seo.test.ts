// Search wording and indexing rules of the suppliers and vendors pages. Run: npx tsx --test scripts/supplier-seo.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { canonicalQuery, filterHeading, indexableFilters, supplierMeta } from "../src/lib/supplier-seo";

test("the default page and filtered pages get search-friendly titles", () => {
  assert.match(supplierMeta({}, 0).title, /^Construction Suppliers and Vendors in India \| Bidcore$/);
  assert.equal(filterHeading({ category: "steel-tmt", city: "Mumbai" }), "Steel and TMT Bar Suppliers in Mumbai");
  assert.equal(filterHeading({ category: "ready-mix-concrete" }), "Ready-Mix Concrete (RMC) Suppliers");
  assert.equal(filterHeading({ type: "Supplier", state: "maharashtra" }, "Maharashtra"), "Construction Material Suppliers in Maharashtra");
  assert.equal(filterHeading({ type: "Equipment Rental Provider" }), "Construction Equipment Rental Providers");
  assert.equal(filterHeading({}), null);
});

test("titles stay short enough for search results", () => {
  for (const f of [{}, { category: "waterproofing-chemicals", city: "Visakhapatnam" }, { type: "Distributor / Dealer", city: "Thiruvananthapuram" }]) {
    assert.ok(supplierMeta(f, 3).title.length <= 85, supplierMeta(f, 3).title);
    assert.ok(supplierMeta(f, 3).description.length <= 175);
  }
});

test("only one product group or type plus one place is indexed, and only when it has companies", () => {
  assert.equal(supplierMeta({ category: "cement", city: "Pune" }, 4).index, true);
  assert.equal(supplierMeta({ category: "cement", city: "Pune" }, 0).index, false, "an empty page is not indexed");
  assert.equal(supplierMeta({}, 0).index, true, "the main page always is");
  for (const f of [{ q: "tmt" }, { category: "cement", sort: "name" }, { type: "Supplier", category: "cement" }, { state: "kerala", city: "Kochi" }, { status: "verified" }, { industry: "Roads" }])
    assert.equal(indexableFilters(f), false, JSON.stringify(f));
});

test("the canonical address has a fixed parameter order", () => {
  assert.equal(canonicalQuery({ city: "Pune", category: "cement" }), "?category=cement&city=Pune");
  assert.equal(canonicalQuery({}), "");
  assert.equal(canonicalQuery({ category: "cement", page: 3 }), "?category=cement&page=3");
});
