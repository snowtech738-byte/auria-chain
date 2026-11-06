import { wrapFetchWithPayment, x402HTTPClient } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import { AuriaError } from "./errors.js";

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Builds a buyer agent that can pay any x402-protected endpoint. Registers
 * "eip155:*" so it follows whatever EVM network the seller's challenge
 * actually asks for, rather than hardcoding one up front.
 *
 * Spend is capped by default (the underlying x402 client refuses to pay more
 * than $1 per request unless told otherwise) — pass `maxPricePerPayment` to
 * tighten or raise that, since an autonomous agent should never be able to
 * silently pay whatever a seller's 402 challenge happens to ask for.
 *
 * @param {Object} config
 * @param {`0x${string}`} config.privateKey - the wallet that pays
 * @param {string} [config.maxPricePerPayment] - e.g. "$0.10"; omit to keep the x402 client's own default ($1)
 * @returns {{ address: string, pay: (url: string, options?: RequestInit & { timeoutMs?: number }) => Promise<any>, fetchWithPayment: typeof fetch, httpClient: x402HTTPClient }}
 * @throws {AuriaError} code "MISSING_PRIVATE_KEY"
 */
export function createBuyer({ privateKey, maxPricePerPayment }) {
  if (!privateKey) {
    throw new AuriaError("MISSING_PRIVATE_KEY", "createBuyer requires `privateKey` — the wallet that pays.");
  }

  const account = privateKeyToAccount(privateKey);

  const client = new x402Client();
  client.register("eip155:*", new ExactEvmScheme(account));
  if (maxPricePerPayment !== undefined) {
    client.setSpendControls({ maxAmountPerPayment: maxPricePerPayment });
  }

  const fetchWithPayment = wrapFetchWithPayment(fetch, client);
  const httpClient = new x402HTTPClient(client);

  /**
   * Pays an x402-protected endpoint and returns the settled response.
   *
   * @param {string} url
   * @param {RequestInit & { timeoutMs?: number }} [options]
   * @throws {AuriaError} code "PRICE_EXCEEDS_MAX" if the seller's price exceeds `maxPricePerPayment`,
   *   "PAYMENT_TIMEOUT" if the request exceeds `timeoutMs` (default 30s),
   *   or "PAYMENT_FAILED" for any other failure (see `error.cause`)
   */
  async function pay(url, options = {}) {
    const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
    const usingOwnTimeout = !fetchOptions.signal;
    const timeoutController = usingOwnTimeout ? new AbortController() : null;
    const timer = usingOwnTimeout ? setTimeout(() => timeoutController.abort(), timeoutMs) : null;

    try {
      const response = await fetchWithPayment(url, {
        ...fetchOptions,
        signal: usingOwnTimeout ? timeoutController.signal : fetchOptions.signal,
      });
      return await httpClient.processResponse(response);
    } catch (error) {
      if (usingOwnTimeout && error?.name === "AbortError") {
        throw new AuriaError("PAYMENT_TIMEOUT", `Payment to ${url} timed out after ${timeoutMs}ms.`, { cause: error });
      }
      if (error instanceof Error && error.message.includes("spendControls")) {
        throw new AuriaError("PRICE_EXCEEDS_MAX", `Seller's price for ${url} exceeds the buyer's spend cap: ${error.message}`, { cause: error });
      }
      throw new AuriaError("PAYMENT_FAILED", `Payment to ${url} failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  return { address: account.address, pay, fetchWithPayment, httpClient };
}
