import postgres, { type Sql } from "postgres";
import { referenceModel, demoWallet, demoPositions, monitorScope, type AppModel, type PositionRecord } from "./reference-data";

let client: Sql | null = null;

export function databaseClient(): Sql | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!client) client = postgres(url, { max: 3, idle_timeout: 10, connect_timeout: 3 });
  return client;
}

export async function databaseAvailable() {
  const sql = databaseClient();
  if (!sql) return false;
  try {
    await sql`select 1`;
    return true;
  } catch {
    return false;
  }
}

export async function loadAppModel(): Promise<AppModel> {
  const sql = databaseClient();
  if (!sql) return referenceModel;

  try {
    const [walletRows, positionRows, notificationRows, monitorRows] = await Promise.all([
      sql`select id, label, asset, balance_usd from wallet where id = 'TREASURY-USDC' limit 1`,
      sql`select id, wallet_id, strategy_id, kind, asset, protocol, principal_usd, status, collateral_for, pool_gauge, assessment_period from portfolio_position where wallet_id <> 'DEMO-USDC' order by id`,
      sql`select id, kind, title, message, status, created_at from notification order by created_at`,
      sql`select asset, transition from depeg_monitor_state`,
    ]);
    if (!walletRows.length || !positionRows.length) return referenceModel;

    return {
      ...referenceModel,
      dataMode: "postgres",
      wallet: {
        id: String(walletRows[0].id),
        label: String(walletRows[0].label),
        asset: String(walletRows[0].asset),
        balanceUsd: Number(walletRows[0].balance_usd),
      },
      positions: positionRows.map((row) => ({
        id: String(row.id),
        walletId: String(row.wallet_id),
        strategyId: String(row.strategy_id),
        kind: String(row.kind),
        asset: String(row.asset),
        protocol: String(row.protocol),
        principalUsd: Number(row.principal_usd),
        status: String(row.status),
        collateralFor: row.collateral_for ? String(row.collateral_for) : null,
        poolGauge: String(row.pool_gauge),
        assessmentPeriod: String(row.assessment_period),
      })),
      monitorScope: monitorScope.map((scope) => ({
        ...scope,
        lastTransition: String(monitorRows.find((row) => String(row.asset) === scope.asset)?.transition ?? scope.lastTransition),
      })),
      notifications: notificationRows.map((row) => ({
        id: String(row.id),
        kind: String(row.kind),
        title: String(row.title),
        message: String(row.message),
        status: String(row.status),
        createdAt: new Date(row.created_at).toISOString().slice(11, 16),
      })),
    };
  } catch {
    return referenceModel;
  }
}

export type DemoPortfolio = {
  dataMode: "snapshot" | "postgres";
  wallet: typeof demoWallet;
  positions: PositionRecord[];
};

export async function loadDemoPortfolio(): Promise<DemoPortfolio> {
  const sql = databaseClient();
  if (!sql) return { dataMode: "snapshot", wallet: demoWallet, positions: demoPositions };
  try {
    const [walletRows, positionRows] = await Promise.all([
      sql`select id, label, asset, balance_usd from wallet where id = 'DEMO-USDC' limit 1`,
      sql`select id, wallet_id, strategy_id, kind, asset, protocol, principal_usd, status, collateral_for, pool_gauge, assessment_period from portfolio_position where wallet_id = 'DEMO-USDC' order by id`,
    ]);
    if (!walletRows.length || !positionRows.length) return { dataMode: "snapshot", wallet: demoWallet, positions: demoPositions };
    return {
      dataMode: "postgres",
      wallet: {
        id: String(walletRows[0].id),
        label: String(walletRows[0].label),
        asset: String(walletRows[0].asset),
        balanceUsd: Number(walletRows[0].balance_usd),
      },
      positions: positionRows.map((row) => ({
        id: String(row.id),
        walletId: String(row.wallet_id),
        strategyId: String(row.strategy_id),
        kind: String(row.kind),
        asset: String(row.asset),
        protocol: String(row.protocol),
        principalUsd: Number(row.principal_usd),
        status: String(row.status),
        collateralFor: row.collateral_for ? String(row.collateral_for) : null,
        poolGauge: String(row.pool_gauge),
        assessmentPeriod: String(row.assessment_period),
      })),
    };
  } catch {
    return { dataMode: "snapshot", wallet: demoWallet, positions: demoPositions };
  }
}
