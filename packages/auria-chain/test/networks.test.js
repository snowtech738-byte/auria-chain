import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveNetwork, NETWORKS } from "../src/networks.js";
import { AuriaError } from "../src/errors.js";

test("resolveNetwork maps friendly names to CAIP-2 ids", () => {
  assert.equal(resolveNetwork("base-sepolia"), "eip155:84532");
  assert.equal(resolveNetwork("base"), "eip155:8453");
});

test("resolveNetwork passes through a raw CAIP-2 id unchanged", () => {
  assert.equal(resolveNetwork("eip155:1"), "eip155:1");
});

test("resolveNetwork throws AuriaError(UNKNOWN_NETWORK) for an unrecognized name", () => {
  assert.throws(
    () => resolveNetwork("polygon"),
    (error) => error instanceof AuriaError && error.code === "UNKNOWN_NETWORK",
  );
});

test("NETWORKS is exported and covers the documented defaults", () => {
  assert.deepEqual(Object.keys(NETWORKS).sort(), ["base", "base-sepolia"]);
});
