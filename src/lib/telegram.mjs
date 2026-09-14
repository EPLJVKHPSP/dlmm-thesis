const API_TIMEOUT_MS = 15_000;

export function telegramConfig(env = process.env) {
  const token = (env.BOT_TOKEN ?? "").trim();
  const chatIds = String(env.TELEGRAM_CHAT_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return { token, chatIds };
}

export function formatDepegAlert({ symbol, chain, deviationPct, basis, heldIn, transition }) {
  const head = transition === "recovered"
    ? `✅ Recovered: ${symbol} (${chain})`
    : `⚠️ Depeg: ${symbol} (${chain}) ${Number(deviationPct).toFixed(2)}%`;
  const lines = [head, `Basis: ${basis}`];
  if (heldIn) lines.push(`Held in: ${heldIn}`);
  return lines.join("\n");
}

export function formatTestAlert() {
  return "DLMM review companion connected. Test delivery works — no action needed.";
}

export async function sendTelegramMessage(text, { token, chatIds, fetchImpl = fetch } = {}) {
  const config = token !== undefined ? { token, chatIds: chatIds ?? [] } : telegramConfig();
  if (!config.token) return { sent: 0, skipped: "BOT_TOKEN not set — sender dormant" };
  if (config.chatIds.length === 0) return { sent: 0, skipped: "TELEGRAM_CHAT_IDS empty — no subscribers" };
  let sent = 0;
  const failures = [];
  await Promise.all(
    config.chatIds.map(async (chatId) => {
      try {
        const response = await fetchImpl(`https://api.telegram.org/bot${config.token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text }),
          signal: AbortSignal.timeout(API_TIMEOUT_MS),
        });
        if (response.ok) sent += 1;
        else failures.push(`${chatId}: ${response.status}`);
      } catch (error) {
        failures.push(`${chatId}: ${error instanceof Error ? error.message : "send failed"}`);
      }
    }),
  );
  return { sent, failures };
}

export async function sendDepegAlert(observation, options) {
  return sendTelegramMessage(formatDepegAlert(observation), options);
}
