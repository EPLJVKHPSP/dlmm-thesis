#!/usr/bin/env node
import postgres from "postgres";
import { monitorHeldAssetsOnce } from "../src/lib/depeg-telegram-monitor.mjs";
import { sendTelegramMessage, telegramConfig } from "../src/lib/telegram.mjs";

const fallbackPositions = [
  { id: "POS-001", walletId: "TREASURY-USDC", kind: "Lending", asset: "USDC", protocol: "Aave V3", status: "Alert" },
  { id: "POS-002", walletId: "TREASURY-USDC", kind: "Borrowing", asset: "USDC", protocol: "Kamino Lend", status: "Active" },
  { id: "POS-003", walletId: "TREASURY-USDC", kind: "Staking", asset: "stETH", protocol: "Lido", status: "Active" },
  { id: "POS-004", walletId: "TREASURY-USDC", kind: "Farming", asset: "DAI / USDC", protocol: "Curve", status: "Active" },
];

const once = process.argv.includes("--once");
const intervalSeconds = Math.max(15, Number(process.env.TELEGRAM_POLL_SECONDS ?? 60));
const config = telegramConfig();
const databaseUrl = process.env.DATABASE_URL?.trim();
const sql = databaseUrl ? postgres(databaseUrl, { max: 1, idle_timeout: 10, connect_timeout: 5 }) : null;
const memoryStates = new Map();

async function ensureStateTable() {
  if (!sql) return;
  await sql`
    create table if not exists depeg_monitor_state (
      asset text primary key,
      active boolean not null default false,
      transition text not null,
      observed_price numeric(24, 10) not null,
      reference_price numeric(24, 10) not null,
      deviation_pct numeric(12, 6) not null,
      confidence numeric(8, 6) not null,
      observed_at timestamptz not null,
      updated_at timestamptz not null default now()
    )
  `;
}

async function loadPositions() {
  if (!sql) return fallbackPositions;
  const rows = await sql`
    select id, wallet_id, kind, asset, protocol, status
    from portfolio_position
    where wallet_id <> 'DEMO-USDC' and status <> 'Demo'
    order by id
  `;
  return rows.map((row) => ({
    id: String(row.id), walletId: String(row.wallet_id), kind: String(row.kind),
    asset: String(row.asset), protocol: String(row.protocol), status: String(row.status),
  }));
}

async function loadStates() {
  if (!sql) return memoryStates;
  const rows = await sql`select asset, active from depeg_monitor_state`;
  return new Map(rows.map((row) => [String(row.asset), { active: Boolean(row.active) }]));
}

async function saveState(result) {
  if (!sql) {
    memoryStates.set(result.asset, { active: result.active });
    return;
  }
  await sql`
    insert into depeg_monitor_state (
      asset, active, transition, observed_price, reference_price,
      deviation_pct, confidence, observed_at, updated_at
    ) values (
      ${result.asset}, ${result.active}, ${result.transition}, ${result.price},
      ${result.referencePrice}, ${result.deviationPct}, ${result.confidence},
      ${result.observedAt}, now()
    )
    on conflict (asset) do update set
      active = excluded.active,
      transition = excluded.transition,
      observed_price = excluded.observed_price,
      reference_price = excluded.reference_price,
      deviation_pct = excluded.deviation_pct,
      confidence = excluded.confidence,
      observed_at = excluded.observed_at,
      updated_at = now()
  `;
}

async function poll() {
  if (!config.token || config.chatIds.length === 0) {
    console.log("DORMANT telegram monitor — set BOT_TOKEN and TELEGRAM_CHAT_IDS, then restart");
    return;
  }
  const positions = await loadPositions();
  const previousStates = await loadStates();
  const results = await monitorHeldAssetsOnce({
    positions,
    previousStates,
    sendAlert: (message) => sendTelegramMessage(message, config),
  });
  for (const result of results) {
    await saveState(result);
    const delivery = result.delivery ? ` sent=${result.delivery.sent}` : "";
    console.log(`${result.observedAt} ${result.asset} ${result.transition} deviation=${result.deviationPct.toFixed(3)}%${delivery}`);
  }
}

try {
  await ensureStateTable();
  do {
    try {
      await poll();
    } catch (error) {
      console.error(`telegram monitor poll failed: ${error instanceof Error ? error.message : error}`);
      if (once) process.exitCode = 1;
    }
    if (!once) await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000));
  } while (!once);
} finally {
  if (sql) await sql.end({ timeout: 2 });
}
