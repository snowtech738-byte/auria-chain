import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { resolveNetwork } from "./networks.js";
import { AuriaError } from "./errors.js";

/**
 * @typedef {Object} RouteConfig
 * @property {string} price - e.g. "$0.01"
 * @property {string} [description]
 */

/**
 * Builds an Express middleware that puts an x402 paywall in front of the
 * given routes, so unpaid requests never reach your handlers. Thin wrapper
 * around @x402/express — the only job here is agent-commerce-shaped
 * defaults (friendly network names, resource URLs built for you).
 *
 * @param {Object} config
 * @param {string} config.payTo - wallet address that receives payment
 * @param {string} config.baseUrl - e.g. "http://localhost:4021", used to build each route's resource URL
 * @param {Object<string, RouteConfig>} config.routes - keyed `"METHOD /path"`, e.g. { "POST /agent/summarize": { price: "$0.01" } }
 * @param {string} [config.network="base-sepolia"] - friendly name or raw CAIP-2 id
 * @param {string} [config.facilitatorUrl="https://x402.org/facilitator"] - testnet by default; pass a production (e.g. Coinbase CDP) facilitator URL for mainnet
 * @returns {import("express").RequestHandler}
 * @throws {AuriaError} codes "MISSING_PAY_TO" | "MISSING_BASE_URL" | "MISSING_ROUTES" | "MISSING_ROUTE_PRICE" | "UNKNOWN_NETWORK"
 */
export function createSellerMiddleware({
  payTo,
  baseUrl,
  routes,
  network = "base-sepolia",
  facilitatorUrl = "https://x402.org/facilitator",
}) {
  if (!payTo) {
    throw new AuriaError("MISSING_PAY_TO", "createSellerMiddleware requires `payTo` — the wallet address that gets paid.");
  }
  if (!baseUrl) {
    throw new AuriaError("MISSING_BASE_URL", "createSellerMiddleware requires `baseUrl` (e.g. http://localhost:4021) to build each route's resource URL.");
  }
  if (!routes || Object.keys(routes).length === 0) {
    throw new AuriaError("MISSING_ROUTES", 'createSellerMiddleware requires `routes`, e.g. { "POST /agent/summarize": { price: "$0.01" } }.');
  }

  const caip2Network = resolveNetwork(network);
  const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
  const resourceServer = new x402ResourceServer(facilitatorClient).register(caip2Network, new ExactEvmScheme());

  const config = {};
  for (const [methodAndPath, route] of Object.entries(routes)) {
    const path = methodAndPath.split(" ")[1];
    if (!route?.price) {
      throw new AuriaError("MISSING_ROUTE_PRICE", `Route "${methodAndPath}" is missing \`price\` (e.g. "$0.01").`);
    }
    config[methodAndPath] = {
      accepts: [{ scheme: "exact", price: route.price, network: caip2Network, payTo }],
      resource: `${baseUrl}${path}`,
      description: route.description || "",
    };
  }

  return paymentMiddleware(config, resourceServer);
}
