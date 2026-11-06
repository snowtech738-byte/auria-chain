import { AuriaError } from "./errors.js";

// Friendly network names -> CAIP-2 chain ids that x402 v2 requires.
export const NETWORKS = {
  "base-sepolia": "eip155:84532",
  base: "eip155:8453",
};

/**
 * Resolves a friendly network name (or a raw CAIP-2 id) to the CAIP-2 id
 * x402 v2 needs.
 *
 * @param {string} name - e.g. "base-sepolia", "base", or "eip155:8453"
 * @returns {string} CAIP-2 network id
 * @throws {AuriaError} code "UNKNOWN_NETWORK" if `name` isn't recognized
 */
export function resolveNetwork(name) {
  if (typeof name === "string" && name.startsWith("eip155:")) return name;
  const resolved = NETWORKS[name];
  if (!resolved) {
    throw new AuriaError(
      "UNKNOWN_NETWORK",
      `Unknown network "${name}". Known names: ${Object.keys(NETWORKS).join(", ")} (or pass a raw "eip155:<id>" CAIP-2 id).`,
    );
  }
  return resolved;
}
