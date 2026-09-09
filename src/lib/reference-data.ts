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

export const depegSamples = [
  { observedAt: "2023-03-11 07:00 UTC", price: 0.998, referencePrice: 1, transition: "stable", source: "DefiLlama historical study" },
  { observedAt: "2023-03-11 13:00 UTC", price: 0.962, referencePrice: 1, transition: "opened", source: "DefiLlama historical study" },
  { observedAt: "2023-03-11 19:00 UTC", price: 0.954, referencePrice: 1, transition: "active", source: "DefiLlama historical study" },
];

export const notifications = [
  { id: "NOTICE-001", kind: "depeg", title: "DEPEG ALERT", message: "POS-001 · Aave V3 USDC lending · price $0.9620 · deviation 3.80%", status: "Opened", createdAt: "13:00" },
  { id: "NOTICE-002", kind: "rebalance", title: "REBALANCE READY", message: "$1,000,000 USDC · Aave V3 lending · APY 4.20% · risk 7.15/10", status: "Review required", createdAt: "19:05" },
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
  depegSamples: typeof depegSamples;
  notifications: typeof notifications;
  evaluation: typeof evaluationResults;
};

export const referenceModel: AppModel = {
  dataMode: "snapshot",
  wallet: walletSnapshot,
  strategies: strategySnapshot,
  positions: positionSnapshot,
  depegSamples,
  notifications,
  evaluation: evaluationResults,
};
