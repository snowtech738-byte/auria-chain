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

const buyer = createBuyer({ privateKey: process.env.BUYER_PRIVATE_KEY });

const result = await buyer.pay("http://localhost:4021/agent/summarize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "..." }),
});

if (result.paymentStatus === "settled") console.log(result.body);
```

## Networks

Defaults to `"base-sepolia"` (testnet). Pass `network: "base"` for mainnet,
or a raw `"eip155:<id>"` CAIP-2 id for anything else.

## What this doesn't do yet

No production facilitator config (Coinbase CDP) — both sides use the public
`x402.org/facilitator` testnet facilitator by default. Pass `facilitatorUrl`
to `createSellerMiddleware` once there's a production facilitator to point at.
