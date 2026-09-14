import { readSession } from "@/lib/session";
import { formatTestAlert, sendTelegramMessage, telegramConfig } from "@/lib/telegram.mjs";

export async function POST() {
  if (!await readSession()) return Response.json({ error: "Authentication required" }, { status: 401 });
  const config = telegramConfig();
  if (!config.token) return Response.json({ sent: 0, error: "BOT_TOKEN not set — sender dormant" }, { status: 200 });
  if (config.chatIds.length === 0) return Response.json({ sent: 0, error: "TELEGRAM_CHAT_IDS empty — no subscribers" }, { status: 200 });
  const result = await sendTelegramMessage(formatTestAlert());
  return Response.json({ sent: result.sent, chats: config.chatIds.length, failures: result.failures });
}
