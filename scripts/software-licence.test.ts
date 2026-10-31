// Unit tests for the software gateway's pure rules (no database, no network). Run: npm run test:software
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { test } from "node:test";
import { bearer, decodeCursor, encodeCursor, isMachineCode, toCard, verifyLicence } from "../src/lib/software-licence-core";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const other = generateKeyPairSync("ed25519");
const KEYS = { "bidcore-india": { pem: publicKey.export({ type: "spki", format: "pem" }).toString() } };
const MACHINE = "AAAA-BBBB-CCCC-DDDD-EEEE";
const NOW = Date.parse("2026-11-01T00:00:00Z");

function licence(over: Record<string, unknown> = {}, key = privateKey) {
  const payload = { licenseId: "BC-TEST01", product: "bidcore-india", licensee: "Test Co", issuedAt: "2026-10-01T00:00:00Z", expiresAt: "2027-10-01T00:00:00Z", deviceLimit: 1, ...over };
  const bytes = Buffer.from(JSON.stringify(payload));
  return { format: 1, payload: bytes.toString("base64url"), signature: sign(null, bytes, key).toString("base64url") };
}

test("a licence signed by the product's key, inside its dates, is accepted", () => {
  const r = verifyLicence(licence(), MACHINE, NOW, KEYS);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.payload.licenseId, "BC-TEST01");
    assert.equal(r.deviceLimit, 1);
  }
});

test("a changed payload, another key, an unknown product or a broken file is refused", () => {
  const l = licence();
  const tampered = { ...l, payload: Buffer.from(Buffer.from(l.payload, "base64url").toString().replace("2027", "2099")).toString("base64url") };
  assert.deepEqual(pick(verifyLicence(tampered, MACHINE, NOW, KEYS)), "invalid_signature");
  assert.deepEqual(pick(verifyLicence(licence({}, other.privateKey), MACHINE, NOW, KEYS)), "invalid_signature");
  assert.deepEqual(pick(verifyLicence(licence({ product: "someone-else" }), MACHINE, NOW, KEYS)), "unknown_product");
  for (const bad of [null, {}, { format: 2, payload: "x", signature: "y" }, { format: 1, payload: "!!", signature: "y" }, "text"])
    assert.equal(pick(verifyLicence(bad, MACHINE, NOW, KEYS)), "malformed");
});

test("dates and the computer a licence was issued to are enforced", () => {
  assert.equal(pick(verifyLicence(licence({ expiresAt: "2026-10-30T00:00:00Z" }), MACHINE, NOW, KEYS)), "expired");
  assert.equal(pick(verifyLicence(licence({ issuedAt: "2026-12-01T00:00:00Z" }), MACHINE, NOW, KEYS)), "not_yet_valid");
  assert.equal(pick(verifyLicence(licence({ machineId: "FFFF-FFFF-FFFF-FFFF-FFFF" }), MACHINE, NOW, KEYS)), "wrong_machine");
  assert.equal(verifyLicence(licence({ machineId: MACHINE.toLowerCase() }), MACHINE, NOW, KEYS).ok, true);
});

test("the real product keys are used by default", () => {
  assert.equal(pick(verifyLicence(licence(), MACHINE, NOW)), "invalid_signature"); // a test key is not Bidcore's key
});

test("a directory card carries only the approved fields", () => {
  const row = { id: 7, listed: true, updated_at: "2026-10-31T10:00:00.123456Z", slug: "acme", name: "Acme", type: "EPC Contractor", city: "Mumbai", state: "Maharashtra", trades: ["Civil"], website: "https://acme.example" };
  const withSecrets = { ...row, email: "info@acme.example", phone: "+91 22 2575 1000", address: "14 Marine Drive", source_url: "https://acme.example/contact" };
  const card = toCard(withSecrets);
  assert.deepEqual(Object.keys(card).sort(), ["city", "id", "listed", "name", "slug", "state", "trades", "type", "updatedAt", "website"]);
  assert.ok(!JSON.stringify(card).includes("acme.example/contact") && !JSON.stringify(card).includes("2575") && !JSON.stringify(card).includes("info@"));
  assert.deepEqual(toCard({ ...withSecrets, listed: false }), { id: "dc-7", listed: false, updatedAt: row.updated_at });
});

test("cursors round-trip and junk is refused", () => {
  const c = encodeCursor("2026-10-31T10:00:00.123456Z", 42);
  assert.deepEqual(decodeCursor(c), { updatedAt: "2026-10-31T10:00:00.123456Z", id: 42 });
  for (const bad of ["x", Buffer.from('["2026-10-31; DROP TABLE x", 1]').toString("base64url"), Buffer.from('["2026-10-31T10:00:00.123456Z", -1]').toString("base64url")])
    assert.equal(decodeCursor(bad), null);
  assert.equal(decodeCursor(null), null);
});

test("machine codes and bearer tokens are parsed strictly", () => {
  assert.equal(isMachineCode(MACHINE), true);
  assert.equal(isMachineCode("AAAA-BBBB"), false);
  assert.equal(bearer("Bearer abcdefghijklmnopqrstuvwxyz012345"), "abcdefghijklmnopqrstuvwxyz012345");
  assert.equal(bearer("Bearer short"), null);
  assert.equal(bearer("Basic abcdefghijklmnopqrstuvwxyz012345"), null);
  assert.equal(bearer(null), null);
});

function pick(r: ReturnType<typeof verifyLicence>) {
  return r.ok ? "ok" : r.status;
}
