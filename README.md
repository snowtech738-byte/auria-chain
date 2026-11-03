# Auria Chain

Infrastructure so AI agents can pay other AI agents over plain HTTP,
settled on-chain, with no human in the loop and no new token.

## Layout

- `packages/auria-chain/` — the SDK. `createSellerMiddleware` to paywall an
  Express route, `createBuyer` to pay one. See its README for the API.
- `examples/demo/` — a working two-agent demo built on the SDK: a seller
  that does real paid Claude work, a buyer that pays for it in testnet
  USDC. See its README to run it.

This is an npm workspaces monorepo — `npm install` at the root links
`auria-chain` into `examples/demo` automatically.

## Status

Q1 demo stage. Testnet only (Base Sepolia), via the public x402.org
facilitator. Not yet published to npm. No token — see the founder dossier
for why that's deliberate.
