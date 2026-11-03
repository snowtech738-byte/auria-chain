import { wrapFetchWithPayment, x402HTTPClient } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

// Builds a buyer agent that can pay any x402-protected endpoint. Registers
// "eip155:*" so it follows whatever EVM network the seller's challenge
// actually asks for, rather than hardcoding one up front.
export function createBuyer({ privateKey }) {
  if (!privateKey) throw new Error("createBuyer requires `privateKey` — the wallet that pays.");

  const account = privateKeyToAccount(privateKey);

  const client = new x402Client();
  client.register("eip155:*", new ExactEvmScheme(account));

  const fetchWithPayment = wrapFetchWithPayment(fetch, client);
  const httpClient = new x402HTTPClient(client);

  async function pay(url, options = {}) {
    const response = await fetchWithPayment(url, options);
    return httpClient.processResponse(response);
  }

  return { address: account.address, pay, fetchWithPayment, httpClient };
}
