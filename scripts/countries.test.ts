// The country / dial-code list used by the sign-up and Add company forms. Run: npx tsx --test scripts/countries.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { COUNTRIES, dialCodeFor, marketForCountry } from "../src/lib/roles";

test("India is first and the default dial code is +91", () => {
  assert.equal(COUNTRIES[0].code, "IN");
  assert.equal(dialCodeFor("IN"), "+91");
});

test("every country has a two-letter code, a name and a dial code that is + and digits", () => {
  assert.ok(COUNTRIES.length >= 190, `only ${COUNTRIES.length} countries`);
  const seen = new Set<string>();
  for (const c of COUNTRIES) {
    assert.ok(!seen.has(c.code), `duplicate ${c.code}`);
    seen.add(c.code);
    if (c.code === "OTHER") continue; // the catch-all has no ISO code and no dial code
    assert.match(c.code, /^[A-Z]{2}$/, c.label);
    assert.match(c.dial, /^\+\d{1,4}$/, c.label);
  }
});

test("well-known countries have the right dial code", () => {
  const want: Record<string, string> = { US: "+1", GB: "+44", AE: "+971", SG: "+65", AU: "+61", CN: "+86", BD: "+880", NP: "+977", LK: "+94", SA: "+968".replace("968", "966"), DE: "+49" };
  for (const [code, dial] of Object.entries(want)) assert.equal(dialCodeFor(code), dial, code);
});

test("markets stay IN / US / OTHER", () => {
  assert.equal(marketForCountry("IN"), "IN");
  assert.equal(marketForCountry("US"), "US");
  assert.equal(marketForCountry("SG"), "OTHER");
});
