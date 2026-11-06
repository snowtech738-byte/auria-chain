import { test } from "node:test";
import assert from "node:assert/strict";
import { createBuyer } from "../src/buyer.js";
import { AuriaError } from "../src/errors.js";

// Well-known publicly-documented test key (Hardhat/Anvil default account #0).
// No real funds are ever associated with it — safe to hardcode in tests.
const TEST_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

test("createBuyer throws MISSING_PRIVATE_KEY when privateKey is absent", () => {
  assert.throws(
    () => createBuyer({}),
    (error) => error instanceof AuriaError && error.code === "MISSING_PRIVATE_KEY",
  );
});

test("createBuyer derives a deterministic checksummed address from the private key", () => {
  const buyer = createBuyer({ privateKey: TEST_PRIVATE_KEY });
  assert.match(buyer.address, /^0x[0-9a-fA-F]{40}$/);
  assert.equal(createBuyer({ privateKey: TEST_PRIVATE_KEY }).address, buyer.address);
});

test("createBuyer returns a pay function and exposes the underlying fetch/http client", () => {
  const buyer = createBuyer({ privateKey: TEST_PRIVATE_KEY });
  assert.equal(typeof buyer.pay, "function");
  assert.equal(typeof buyer.fetchWithPayment, "function");
  assert.ok(buyer.httpClient);
});

test("createBuyer accepts an optional maxPricePerPayment spend cap without throwing", () => {
  assert.doesNotThrow(() => createBuyer({ privateKey: TEST_PRIVATE_KEY, maxPricePerPayment: "$0.05" }));
});
