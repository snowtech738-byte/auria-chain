# Auria Chain — Q1 demo

Two AI agents, one paying the other, settled in testnet USDC, with no human
clicking a payment button. The seller does real, paid-for work — actual
Claude calls, not a canned response.

This example now runs on the `auria-chain` SDK (`../../packages/auria-chain`)
instead of talking to `@x402/*` directly — see that package's README for the
API. This folder is a workspace in the root `auria-chain-monorepo`.

- `seller.js` — an agent selling two real services behind an
  [x402](https://x402.org) paywall (via `createSellerMiddleware`):
  - `POST /agent/summarize` — $0.01 USDC — Claude Haiku summarization
  - `POST /agent/analyze` — $0.05 USDC — Claude Sonnet analysis/reasoning
- `buyer.js` — an agent that needs one of those services, hits the paywall,
  signs a USDC payment with its own wallet (via `createBuyer`), and gets the
  real result back. Run `node buyer.js summarize` or `node buyer.js analyze`.

Runs on x402 protocol v2 under the hood. Payment verification and
settlement are handled by the public x402.org testnet facilitator, which
supports v2 — no facilitator infrastructure of our own yet, and no
Coinbase account needed. That's deliberate: it's the lowest-friction way
to prove the flow works, per Option A in the dossier.

## One-time setup

1. **Two wallets.** You need two Base Sepolia addresses — one for the
   seller (just the address), one for the buyer (needs the private key,
   since it has to sign payments). Any EVM wallet (e.g. a throwaway
   MetaMask account) works. **Use test wallets only — never a wallet
   holding real funds.**
2. **Fund the buyer wallet** with:
   - A little Base Sepolia ETH for gas — [Coinbase faucet](https://portal.cdp.coinbase.com/products/faucet) or [Alchemy faucet](https://www.alchemy.com/faucets/base-sepolia).
   - Test USDC on Base Sepolia — same Coinbase faucet, select USDC.
3. **Copy `.env.example` to `.env`** and fill in:
   - `SELLER_ADDRESS` — the seller wallet's address
   - `BUYER_PRIVATE_KEY` — the buyer wallet's private key
   - `ANTHROPIC_API_KEY` — your own key from console.anthropic.com. The
     seller uses this to actually do the paid work, so real usage costs
     real (small) money on top of whatever the buyer pays it in USDC.

## Run it

From the repo root:

```bash
npm run seller                      # terminal 1 — leave running
npm run buyer -- summarize          # terminal 2 — $0.01 call
npm run buyer -- analyze            # terminal 2 — $0.05 call
```

Or from this folder directly: `npm run seller`, `node buyer.js summarize`.

If it works, the buyer's terminal prints the seller's response along with
the settled summary. If the buyer wallet has no funds yet, you'll see a
clear payment/signing error instead of a silent hang.

## What this proves, and what it doesn't

Proves: one AI agent can autonomously pay another AI agent for a service
over plain HTTP, settled on-chain, with no new token and no human in the
loop.

Doesn't prove: that anyone other than us wants this yet. That's Q2 —
get this in front of a handful of real agent developers before building
anything further.

## Next steps (see the founder dossier for full detail)

- Publish `auria-chain` to npm (name is unclaimed as of 2026-11-03) once it's
  ready for outside developers to install instead of cloning this repo.
- Swap the toy `/agent/summarize` endpoint for a real service worth paying for.
- Move off the public testnet facilitator onto mainnet once there's a real
  counterparty to pay — this means a Coinbase CDP account and
  `createFacilitatorConfig(apiKeyId, apiKeySecret)` from `@coinbase/x402`
  instead of the public `x402.org/facilitator` URL.
- Do **not** introduce a tradeable `$AURIA` token until there's real usage
  data — see Section 03 of the dossier for why.
