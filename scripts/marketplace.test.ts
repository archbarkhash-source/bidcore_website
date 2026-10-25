// Unit tests for the marketplace's pure logic (no database, no network). Run: npm run test:marketplace
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCsv, toCsv } from "../src/lib/marketplace/csv";
import { domainOf, normalizeCin, normalizeEmail, normalizeGstin, normalizeName, normalizePhone, normalizeWebsite, safeUrl } from "../src/lib/marketplace/identity";
import { DEFAULT_CATEGORIES, SHOP_GROUPS, slugifyText, splitList } from "../src/lib/marketplace/constants";

test("normalizeName treats legal-form variants as the same business", () => {
  assert.equal(normalizeName("ABC Constructions Pvt. Ltd."), normalizeName("A.B.C. Constructions Private Limited"));
  assert.equal(normalizeName("Larsen & Toubro Limited"), normalizeName("Larsen and Toubro Ltd"));
  assert.notEqual(normalizeName("Alpha Infra Pvt Ltd"), normalizeName("Beta Infra Pvt Ltd"));
});

test("domainOf / normalizeWebsite", () => {
  assert.equal(domainOf("https://www.Example.co.in/about"), "example.co.in");
  assert.equal(domainOf("example.com"), "example.com");
  assert.equal(domainOf("not a url"), null);
  assert.equal(normalizeWebsite("example.com/"), "https://example.com");
  assert.equal(normalizeWebsite("localhost"), null);
});

test("identifier validation", () => {
  assert.equal(normalizeGstin("27aapfu0939f1zv"), "27AAPFU0939F1ZV");
  assert.equal(normalizeGstin("12345"), null);
  assert.equal(normalizeCin("l17110mh1973plc019786"), "L17110MH1973PLC019786");
  assert.equal(normalizeCin("nope"), null);
  assert.equal(normalizeEmail(" Sales@Example.com "), "sales@example.com");
  assert.equal(normalizeEmail("bad@"), null);
  assert.equal(normalizePhone("+91 98765 43210"), "+919876543210");
  assert.equal(normalizePhone("123"), null);
});

test("safeUrl only accepts http(s)", () => {
  assert.ok(safeUrl("https://example.com/a.png"));
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("data:text/html;base64,AAAA"), null);
  assert.equal(safeUrl(42), null);
});

test("CSV: quotes, commas, newlines and BOM round-trip", () => {
  const rows = [["name", "about"], ['Acme, "Best" Infra', "line one\nline two"], ["Plain", ""]];
  assert.deepEqual(parseCsv(toCsv(rows)), [rows[0], rows[1], ["Plain", ""]]);
  assert.deepEqual(parseCsv("﻿a,b\r\n1,2\r\n"), [["a", "b"], ["1", "2"]]);
  assert.deepEqual(parseCsv("a,b\n\n\n1,2"), [["a", "b"], ["1", "2"]]);
});

test("slugifyText / splitList", () => {
  assert.equal(slugifyText("Electrical & Mechanical Products"), "electrical-and-mechanical-products");
  assert.deepEqual(splitList("Civil, civil ,Roads;\nWater,,"), ["Civil", "Roads", "Water"]);
});

test("default categories: the 12 required plus tools/safety, unique slugs, valid attribute definitions, shop groups resolve", () => {
  assert.equal(DEFAULT_CATEGORIES.length, 13);
  for (const g of SHOP_GROUPS) for (const slug of g.slugs) assert.ok(DEFAULT_CATEGORIES.some((c) => c.slug === slug), `${g.key}: unknown category ${slug}`);
  const slugs = DEFAULT_CATEGORIES.flatMap((c) => [c.slug, ...(c.children ?? []).map((x) => x.slug)]);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate category slug");
  for (const a of DEFAULT_CATEGORIES.flatMap((c) => [...(c.attributes ?? []), ...(c.children ?? []).flatMap((x) => x.attributes ?? [])])) {
    assert.ok(a.key && a.label);
    if (a.type === "select") assert.ok(a.options?.length, `${a.key} needs options`);
  }
});
