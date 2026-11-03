import "dotenv/config";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { createSellerMiddleware } from "auria-chain";

const PORT = process.env.PORT || 4021;
const payTo = process.env.SELLER_ADDRESS;

if (!payTo) {
  console.error("Missing SELLER_ADDRESS in .env — this is the wallet that gets paid.");
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY in .env — the seller needs this to actually do the paid work.");
  process.exit(1);
}

const anthropic = new Anthropic();

const app = express();
app.use(express.json());

// Two real, tiered services. Price enforcement happens in the auria-chain
// middleware, before either route handler runs — unpaid requests never
// reach Claude.
app.use(
  createSellerMiddleware({
    payTo,
    baseUrl: `http://localhost:${PORT}`,
    routes: {
      "POST /agent/summarize": {
        price: "$0.01",
        description: "Auria Chain: condense text into a short summary (Claude Haiku).",
      },
      "POST /agent/analyze": {
        price: "$0.05",
        description: "Auria Chain: deeper analysis/reasoning over text (Claude Sonnet).",
      },
    },
  }),
);

async function askClaude(model, system, text) {
  const message = await anthropic.messages.create({
    model,
    max_tokens: 400,
    system,
    messages: [{ role: "user", content: text }],
  });
  return message.content.map((block) => (block.type === "text" ? block.text : "")).join("");
}

app.post("/agent/summarize", async (req, res) => {
  const text = req.body?.text || "";
  if (!text.trim()) return res.status(400).json({ error: "Missing 'text' in request body." });

  try {
    const summary = await askClaude(
      "claude-haiku-4-5-20251001",
      "Summarize the user's text in 2-3 sentences. Be concise and concrete.",
      text,
    );
    res.json({ seller: payTo, service: "summarize", model: "claude-haiku-4-5", summary });
  } catch (err) {
    res.status(502).json({ error: "Upstream model call failed.", detail: err.message });
  }
});

app.post("/agent/analyze", async (req, res) => {
  const text = req.body?.text || "";
  const question = req.body?.question || "What are the key risks or implications here?";
  if (!text.trim()) return res.status(400).json({ error: "Missing 'text' in request body." });

  try {
    const analysis = await askClaude(
      "claude-sonnet-5",
      "Analyze the user's text in response to their question. Be specific and structured.",
      `${text}\n\nQuestion: ${question}`,
    );
    res.json({ seller: payTo, service: "analyze", model: "claude-sonnet-5", question, analysis });
  } catch (err) {
    res.status(502).json({ error: "Upstream model call failed.", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Auria Chain seller agent listening on http://localhost:${PORT}`);
  console.log(`  POST /agent/summarize — $0.01 USDC — Claude Haiku`);
  console.log(`  POST /agent/analyze   — $0.05 USDC — Claude Sonnet`);
  console.log(`Settled via x402.org/facilitator on base-sepolia.`);
});
