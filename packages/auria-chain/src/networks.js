// Friendly network names -> CAIP-2 chain ids that x402 v2 requires.
export const NETWORKS = {
  "base-sepolia": "eip155:84532",
  base: "eip155:8453",
};

export function resolveNetwork(name) {
  if (typeof name === "string" && name.startsWith("eip155:")) return name;
  const resolved = NETWORKS[name];
  if (!resolved) {
    throw new Error(`Unknown network "${name}". Known names: ${Object.keys(NETWORKS).join(", ")} (or pass a raw "eip155:<id>" CAIP-2 id).`);
  }
  return resolved;
}
