# auria-chain

Thin, opinionated SDK on top of the [x402 protocol](https://x402.org) v2 for
the specific case of one AI agent paying another: friendly network names
instead of raw CAIP-2 ids, and a few lines to protect a route or pay for one.

## Selling (Express)

```js
import express from "express";
import { createSellerMiddleware } from "auria-chain";

const app = express();
app.use(express.json());
app.use(
  createSellerMiddleware({
    payTo: "0xYourWalletAddress",
    baseUrl: "http://localhost:4021",
    routes: {
      "POST /agent/summarize": { price: "$0.01", description: "Summarize text." },
    },
  }),
);

app.post("/agent/summarize", (req, res) => {
  // Only runs once payment has settled — unpaid requests never get here.
  res.json({ summary: "..." });
});

app.listen(4021);
```

## Buying

```js
import { createBuyer } from "auria-chain";

const buyer = createBuyer({
  privateKey: process.env.BUYER_PRIVATE_KEY,
  maxPricePerPayment: "$0.10", // refuse to pay a seller asking for more than this
});

const result = await buyer.pay("http://localhost:4021/agent/summarize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "..." }),
  timeoutMs: 30_000, // default; raise for a seller that does slow work before responding
});

if (result.paymentStatus === "settled") console.log(result.body);
```

### Spend cap

An autonomous buyer agent should never silently pay whatever a seller's 402
challenge happens to ask for. `maxPricePerPayment` is enforced by the
underlying x402 client itself (not a bolt-on check here) — if you omit it,
the client's own default of **$1/payment** still applies, so a buyer is
never uncapped by accident.

### Errors

Every failure `createSellerMiddleware`/`createBuyer` can throw is an
`AuriaError` with a stable `.code` you can branch on, instead of matching
`.message` text:

| code | thrown by | meaning |
| --- | --- | --- |
| `MISSING_PAY_TO`, `MISSING_BASE_URL`, `MISSING_ROUTES`, `MISSING_ROUTE_PRICE` | `createSellerMiddleware` | invalid seller config |
| `MISSING_PRIVATE_KEY` | `createBuyer` | invalid buyer config |
| `UNKNOWN_NETWORK` | either | unrecognized network name |
| `PRICE_EXCEEDS_MAX` | `buyer.pay()` | seller's price exceeded `maxPricePerPayment` |
| `PAYMENT_TIMEOUT` | `buyer.pay()` | request exceeded `timeoutMs` |
| `PAYMENT_FAILED` | `buyer.pay()` | anything else (see `error.cause`) |

```js
import { AuriaError } from "auria-chain";

try {
  await buyer.pay(url, options);
} catch (error) {
  if (error instanceof AuriaError && error.code === "PRICE_EXCEEDS_MAX") {
    // the seller is asking for more than this agent is willing to pay — skip it
  }
  throw error;
}
```

## Networks

Defaults to `"base-sepolia"` (testnet). Pass `network: "base"` for mainnet,
or a raw `"eip155:<id>"` CAIP-2 id for anything else.

## What this doesn't do yet

No production facilitator config (Coinbase CDP) — both sides use the public
`x402.org/facilitator` testnet facilitator by default. Pass `facilitatorUrl`
to `createSellerMiddleware` once there's a production facilitator to point at.

## Tests

```
npm test
```

Covers config validation and construction for both `createSellerMiddleware`
and `createBuyer`. Does not hit the network — the demo in `examples/demo` is
what's run against a live facilitator.
