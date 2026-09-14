export type PositionRecord = {
  id: string;
  walletId: string;
  strategyId: string;
  kind: string;
  asset: string;
  protocol: string;
  principalUsd: number;
  status: string;
  collateralFor: string | null;
  poolGauge: string;
  assessmentPeriod: string;
};

export const walletSnapshot = {
  id: "TREASURY-USDC",
  label: "USDC Treasury",
  asset: "USDC",
  balanceUsd: 1_000_000,
};

export const strategySnapshot = [
  { id: "STR-AAVE-LEND", source: "DefiLlama", protocol: "Aave V3", activity: "Lending", asset: "USDC", apy: 4.2, riskScore: 7.15 },
  { id: "STR-KAMINO-BORROW", source: "Protocol position", protocol: "Kamino Lend", activity: "Borrowing", asset: "USDC", apy: 5.1, riskScore: 6.8 },
  { id: "STR-LIDO-STAKE", source: "Protocol position", protocol: "Lido", activity: "Staking", asset: "stETH", apy: 3.2, riskScore: 7.4 },
  { id: "STR-CURVE-FARM", source: "DefiLlama", protocol: "Curve", activity: "Farming", asset: "DAI / USDC", apy: 4.8, riskScore: 6.2 },
];

export const positionSnapshot: PositionRecord[] = [
  { id: "POS-001", walletId: walletSnapshot.id, strategyId: "STR-AAVE-LEND", kind: "Lending", asset: "USDC", protocol: "Aave V3", principalUsd: 5_000_000, status: "Alert", collateralFor: null, poolGauge: "AAVE-V3-USDC", assessmentPeriod: "2026-Q3" },
  { id: "POS-002", walletId: walletSnapshot.id, strategyId: "STR-KAMINO-BORROW", kind: "Borrowing", asset: "USDC", protocol: "Kamino Lend", principalUsd: 2_000_000, status: "Active", collateralFor: null, poolGauge: "KAMINO-USDC", assessmentPeriod: "2026-Q3" },
  { id: "POS-003", walletId: walletSnapshot.id, strategyId: "STR-LIDO-STAKE", kind: "Staking", asset: "stETH", protocol: "Lido", principalUsd: 1_900_000, status: "Active", collateralFor: "POS-002", poolGauge: "LIDO-STETH", assessmentPeriod: "2026-Q3" },
  { id: "POS-004", walletId: walletSnapshot.id, strategyId: "STR-CURVE-FARM", kind: "Farming", asset: "DAI / USDC", protocol: "Curve", principalUsd: 100_000, status: "Active", collateralFor: null, poolGauge: "CURVE-DAI-USDC", assessmentPeriod: "2026-Q3" },
];

// Toy wallet-query example (e.g. a 5 USD deposit). Kept outside positionSnapshot
// so dashboard totals and the $9M/$10M reconciliation scenario stay unchanged.
export const demoWallet = {
  id: "DEMO-USDC",
  label: "Demo wallet",
  asset: "USDC",
  balanceUsd: 5,
};

export const demoPositions: PositionRecord[] = [
  { id: "DEMO-POS-001", walletId: demoWallet.id, strategyId: "STR-AAVE-LEND", kind: "Lending", asset: "USDC", protocol: "Aave V3", principalUsd: 5, status: "Demo", collateralFor: null, poolGauge: "AAVE-V3-USDC", assessmentPeriod: "2026-Q3" },
];

// Historical replay rows live in scripts/depeg-episodes.mjs and data/ —
// the interface shows live monitor scope only.
export type MonitorScopeRow = {
  asset: string;
  legs: string;
  reference: string;
  method: string;
  thresholdPct: number;
  lastTransition: string;
};

export const monitorScope: MonitorScopeRow[] = [
  { asset: "USDC", legs: "POS-001, POS-002, POS-004", reference: "$1.0000 peg", method: "DefiLlama market price", thresholdPct: 3, lastTransition: "stable" },
  { asset: "DAI", legs: "POS-004", reference: "$1.0000 peg", method: "DefiLlama market price", thresholdPct: 3, lastTransition: "stable" },
  { asset: "stETH", legs: "POS-003", reference: "1.0000 ETH", method: "DefiLlama stETH/ETH ratio", thresholdPct: 3, lastTransition: "stable" },
];

// When the monitor scope (assets, references, thresholds) was last refreshed.
export const monitorScopeRefresh = {
  value: "9 Sep 2026",
  detail: "09:00 UTC · scope and thresholds",
};

export const notifications = [
  { id: "NOTICE-001", kind: "depeg", title: "DEPEG ALERT", message: "POS-001 · Aave V3 USDC lending · price $0.9620 · deviation 3.80%", status: "Opened", createdAt: "13:00" },
];

export const evaluationResults = [
  { label: "Depeg ROC-AUC", value: "0.973", detail: "Held-out January–June 2023" },
  { label: "Depeg F1", value: "0.500", detail: "Precision 0.667 · recall 0.400" },
  { label: "Protocol ROC-AUC", value: "0.705", detail: "95% interval 0.487–0.907" },
  { label: "Application checks", value: "PASS", detail: "Tests, build, browser, API" },
];

export type AppModel = {
  dataMode: "snapshot" | "postgres";
  wallet: typeof walletSnapshot;
  strategies: typeof strategySnapshot;
  positions: PositionRecord[];
  monitorScope: typeof monitorScope;
  notifications: typeof notifications;
  evaluation: typeof evaluationResults;
};

export const referenceModel: AppModel = {
  dataMode: "snapshot",
  wallet: walletSnapshot,
  strategies: strategySnapshot,
  positions: positionSnapshot,
  monitorScope,
  notifications,
  evaluation: evaluationResults,
};
