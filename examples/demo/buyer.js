import "dotenv/config";
import { createBuyer } from "auria-chain";

const BASE_URL = process.env.SELLER_BASE_URL || "http://localhost:4021";
const privateKey = process.env.BUYER_PRIVATE_KEY;

if (!privateKey) {
  console.error("Missing BUYER_PRIVATE_KEY in .env — this is the wallet that pays.");
  process.exit(1);
}

// Usage: node buyer.js summarize   OR   node buyer.js analyze
const service = process.argv[2] === "analyze" ? "analyze" : "summarize";

const buyer = createBuyer({ privateKey });

const task = {
  text: "Our seller API currently charges a flat $0.01 per call regardless of task complexity. Buyer agents are starting to send much longer documents than expected, and our Claude costs for those calls are eating most of the margin.",
  question: "Should pricing move to usage-based tiers, and what's the risk if we don't?",
};

const url = `${BASE_URL}/agent/${service}`;
console.log(`Buyer agent (${buyer.address}) requesting a paid "${service}" from ${url}...`);

try {
  const result = await buyer.pay(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });

  if (result.paymentStatus === "settled") {
    console.log("Payment settled. Seller responded:");
  } else if (result.paymentStatus === "settle_failed") {
    console.log("Settlement failed — x402 does not charge on a failed settlement:");
  } else {
    console.log("Seller returned an error:");
  }
  console.log(result.body);
} catch (err) {
  console.error("Payment or request failed:", err.message || err);
}
