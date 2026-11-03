import { writeFileSync } from "fs";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const sellerKey = generatePrivateKey();
const buyerKey = generatePrivateKey();
const seller = privateKeyToAccount(sellerKey);
const buyer = privateKeyToAccount(buyerKey);

// Private keys stay in a local, gitignored file — never printed to the console.
writeFileSync(
  "demo-wallets.SECRET.txt",
  [
    "Auria Chain demo wallets — Base Sepolia TESTNET ONLY. No real funds. Do not reuse these keys for anything real.",
    "",
    `SELLER address: ${seller.address}`,
    `SELLER private key: ${sellerKey}`,
    "",
    `BUYER address: ${buyer.address}`,
    `BUYER private key: ${buyerKey}`,
  ].join("\n"),
  "utf8",
);

writeFileSync(
  ".env",
  [
    `SELLER_ADDRESS=${seller.address}`,
    `BUYER_PRIVATE_KEY=${buyerKey}`,
    "SELLER_BASE_URL=http://localhost:4021",
    "PORT=4021",
    "ANTHROPIC_API_KEY=",
  ].join("\n"),
  "utf8",
);

console.log("Generated. Public addresses only:");
console.log("SELLER:", seller.address);
console.log("BUYER: ", buyer.address);
console.log("Private keys written to demo-wallets.SECRET.txt and .env (not printed here).");
