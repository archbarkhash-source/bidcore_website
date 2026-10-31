// Unit tests for the contractor directory's pure rules (no database, no network). Run: npm run test:directory
import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanEmail, cleanPhone, keyOf, maskAddress, maskEmail, maskPhone, normaliseWebsite, publicContact, slugify } from "../src/lib/directory-core";

test("masks hide the real values", () => {
  assert.equal(maskPhone("+91 22 2575 1000"), "+91 22******00");
  assert.equal(maskPhone("98765 43210"), "+91 98******10");
  assert.equal(maskPhone("12"), null);
  assert.equal(maskEmail("info@acme-builders.com"), "i***@a***.com");
  assert.equal(maskEmail("not-an-email"), null);
  assert.equal(maskAddress("14 Marine Drive", "Mumbai"), "**** **** ****, Mumbai");
  assert.equal(maskAddress(null, "Mumbai"), null);
  for (const masked of [maskPhone("9876543210"), maskEmail("sales@acme-builders.com")]) {
    assert.ok(masked && !masked.includes("98765") && !masked.includes("sales") && !masked.includes("builders"));
  }
});

test("public contact carries masked values only, and nothing when the company has none", () => {
  const c = publicContact({ phone: "+91 2225751000", email: "info@acme.com", address: "Plot 4, Andheri East", city: "Mumbai" });
  assert.deepEqual(c, { available: true, phone: "+91 22******00", email: "i***@a***.com", address: "**** **** ****, Mumbai" });
  const text = JSON.stringify(c);
  assert.ok(!text.includes("2575") && !text.includes("Andheri") && !text.includes("info@"));
  assert.equal(publicContact({ phone: null, email: null, address: null, city: "Mumbai" }), null);
});

test("phones, e-mails and websites are cleaned", () => {
  assert.equal(cleanPhone("091 22 2575 1000"), "+91 2225751000");
  assert.equal(cleanPhone("022-25751000"), "+91 2225751000");
  assert.equal(cleanPhone("+91-98765-43210"), "+91 9876543210");
  assert.equal(cleanPhone("n/a"), null);
  assert.equal(cleanEmail(" Info@Acme.COM "), "info@acme.com");
  assert.equal(cleanEmail("info at acme"), null);
  assert.equal(normaliseWebsite("http://www.Acme.com/about"), "https://acme.com");
  assert.equal(normaliseWebsite(""), null);
});

test("a company is one row by website host, else by name + city", () => {
  assert.equal(keyOf("Acme Builders", "https://www.acme.com", "Mumbai"), "acme.com");
  assert.equal(keyOf("Acme Builders", "", "Mumbai"), "acme-builders-mumbai");
  assert.equal(slugify("Larsen & Toubro Limited"), "larsen-and-toubro-limited");
  assert.equal(slugify("!!!"), "company");
});
