#!/usr/bin/env node
import "./load-env.mjs";
import {
  formatTestAlert, formatDepegAlert,
  sendTelegramMessage, telegramConfig,
} from "../src/lib/telegram.mjs";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const config = telegramConfig();
if (!config.token) {
  console.log("SKIP telegram examples (BOT_TOKEN not set — sender dormant)");
  process.exit(0);
}
if (config.chatIds.length === 0) {
  console.log("SKIP telegram examples (TELEGRAM_CHAT_IDS empty — no subscribers)");
  process.exit(0);
}

const sequence = [
  ["test connectivity", formatTestAlert()],
  ["depeg opened", formatDepegAlert({ symbol: "USDC", chain: "Ethereum", deviationPct: 3.8, basis: "$1.0000 peg", heldIn: "Aave V3 USDC lending (POS-001)", transition: "opened" })],
  ["recovered", formatDepegAlert({ symbol: "USDC", chain: "Ethereum", deviationPct: 0.1, basis: "$1.0000 peg", heldIn: null, transition: "recovered" })],
];

let failed = 0;
for (const [label, text] of sequence) {
  console.log(`EXPECT (${label}): ${text}`);
  const result = await sendTelegramMessage(text);
  console.log(`SENT (${label}): ${JSON.stringify({ sent: result.sent, failures: result.failures })}`);
  if (result.sent === 0) failed += 1;
  await sleep(2000);
}
console.log("NOTE: an `active` observation must NOT send — confirm only 3 messages arrived, in order.");
if (failed > 0) process.exit(1);
console.log("DONE telegram examples — confirm the three-message sequence described in README.md");
