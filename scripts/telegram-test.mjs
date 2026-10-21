#!/usr/bin/env node
import "./load-env.mjs";
import { formatTestAlert, sendTelegramMessage, telegramConfig } from "../src/lib/telegram.mjs";

const config = telegramConfig();
if (!config.token) {
  console.log("SKIP telegram test alert (BOT_TOKEN not set — sender dormant)");
  process.exit(0);
}
if (config.chatIds.length === 0) {
  console.log("SKIP telegram test alert (TELEGRAM_CHAT_IDS empty — no subscribers)");
  process.exit(0);
}
const result = await sendTelegramMessage(formatTestAlert("npm run alert:test"));
console.log(`DONE telegram test alert ${JSON.stringify({ sent: result.sent, chats: config.chatIds.length, failures: result.failures })}`);
if (result.sent === 0) process.exit(1);
