import { positionSnapshot, strategySnapshot } from "./reference-data";

export type ChartDatum = { label: string; value: number; tone?: "lending" | "borrowing" | "staking" | "farming" | "idle" | "gain" | "loss" };

export const activityExposure: ChartDatum[] = [
  { label: "Lending", value: 5_000_000, tone: "lending" },
  { label: "Borrowing", value: 2_000_000, tone: "borrowing" },
  { label: "Staking", value: 1_900_000, tone: "staking" },
  { label: "Farming", value: 100_000, tone: "farming" },
  { label: "Idle", value: 1_000_000, tone: "idle" },
];

export const portfolioComposition: ChartDatum[] = [
  { label: "USDC", value: 6_000_000, tone: "lending" },
  { label: "Borrowed USDC", value: 2_000_000, tone: "borrowing" },
  { label: "stETH", value: 1_900_000, tone: "staking" },
  { label: "DAI / USDC LP", value: 100_000, tone: "farming" },
];

export const exposureByActivity = {
  lending: [{ label: "Aave V3", value: 5_000_000, tone: "lending" as const }],
  borrowing: [{ label: "Kamino Lend", value: 2_000_000, tone: "borrowing" as const }],
  staking: [{ label: "Lido", value: 1_900_000, tone: "staking" as const }],
  farming: [{ label: "Curve", value: 100_000, tone: "farming" as const }],
};

export const navHistory = [
  { period: "2026-04", nav: 9_420_000, invested: 8_600_000 },
  { period: "2026-05", nav: 9_580_000, invested: 8_700_000 },
  { period: "2026-06", nav: 9_730_000, invested: 8_800_000 },
  { period: "2026-07", nav: 9_880_000, invested: 8_900_000 },
  { period: "2026-08", nav: 10_000_000, invested: 9_000_000 },
];

// Assessment-period yield basis. Expected income is pro-rata from displayed
// strategy APYs over elapsedDays; Q2 APY is realized from NAV deltas.
export const assessmentPeriod = {
  id: "2026-Q3",
  opened: "01 Jul 2026",
  elapsedDays: 70,
  totalDays: 92,
  openingNav: 9_730_000,
  currentNav: 10_000_000,
  deployed: 9_000_000,
  history: [
    { id: "2026-Q3", opened: "01 Jul 2026", closed: "—", openingNav: 9_730_000, closingNav: 10_000_000, apy: null as number | null, status: "Open" },
    { id: "2026-Q2", opened: "01 Apr 2026", closed: "30 Jun 2026", openingNav: 9_420_000, closingNav: 9_730_000, apy: 13.2, status: "Closed" },
  ],
};

// Single income engine shared by /profit and /assessment-period. Expected
// income is pro-rata from displayed strategy APYs over elapsedDays; borrowing
// counts as a cost. Net APY is annualized on deployed capital.
export type ActivityIncomeRow = {
  kind: string;
  protocol: string;
  principalUsd: number;
  apy: number;
  income: number;
};

export function periodIncome() {
  const yearFraction = assessmentPeriod.elapsedDays / 365;
  const rows: ActivityIncomeRow[] = positionSnapshot.map((position) => {
    const apy = strategySnapshot.find((s) => s.id === position.strategyId)?.apy ?? 0;
    const income = position.principalUsd * (apy / 100) * yearFraction * (position.kind === "Borrowing" ? -1 : 1);
    return { kind: position.kind, protocol: position.protocol, principalUsd: position.principalUsd, apy, income };
  });
  const netIncome = rows.reduce((sum, row) => sum + row.income, 0);
  const netApy = netIncome / assessmentPeriod.deployed * (365 / assessmentPeriod.elapsedDays) * 100;
  const borrowing = rows.find((row) => row.kind === "Borrowing")!;
  return { rows, netIncome, netApy, borrowingCost: -borrowing.income, yearFraction };
}

export const lendingHealth = {
  borrowed: 2_000_000,
  openPositionLimit: 5_000_000,
  policyLimit: 6_000_000,
  liquidationThreshold: 6_800_000,
  collateral: 8_000_000,
};

export const protocolLendingHealth = [
  { protocol: "Aave V3", borrowed: 850_000, openPositionLimit: 2_500_000, policyLimit: 3_200_000, liquidationThreshold: 3_650_000, collateral: 4_200_000 },
  { protocol: "Kamino Lend", borrowed: 1_150_000, openPositionLimit: 2_100_000, policyLimit: 2_500_000, liquidationThreshold: 2_780_000, collateral: 3_200_000 },
];

export type ProtocolRating = {
  protocol: string;
  chain: string;
  score: number;
  riskTier: number;
  policyTier: number;
  source: string;
  updated: string;
};

export const protocolRatings: ProtocolRating[] = [
  { protocol: "Aave V3", chain: "Ethereum", score: 8, riskTier: 2, policyTier: 1, source: "DLMM composite", updated: "24 Aug 2026" },
  { protocol: "Lido", chain: "Ethereum", score: 8, riskTier: 2, policyTier: 1, source: "DLMM composite", updated: "24 Aug 2026" },
  { protocol: "Sky", chain: "Ethereum", score: 8, riskTier: 2, policyTier: 1, source: "DLMM composite", updated: "24 Aug 2026" },
  { protocol: "Spark", chain: "Ethereum", score: 8, riskTier: 2, policyTier: 1, source: "DLMM composite", updated: "24 Aug 2026" },
  { protocol: "Compound V3", chain: "Ethereum", score: 7, riskTier: 2, policyTier: 2, source: "DLMM composite", updated: "24 Aug 2026" },
  { protocol: "Curve", chain: "Ethereum", score: 7, riskTier: 2, policyTier: 2, source: "DLMM composite", updated: "24 Aug 2026" },
  { protocol: "Convex Finance", chain: "Ethereum", score: 7, riskTier: 2, policyTier: 2, source: "DLMM composite", updated: "24 Aug 2026" },
  { protocol: "Morpho", chain: "Ethereum", score: 7, riskTier: 2, policyTier: 2, source: "DLMM composite", updated: "24 Aug 2026" },
  { protocol: "Kamino Lend", chain: "Solana", score: 7, riskTier: 2, policyTier: 2, source: "DLMM composite", updated: "24 Aug 2026" },
  { protocol: "Jupiter Lend", chain: "Solana", score: 6, riskTier: 3, policyTier: 2, source: "DLMM composite", updated: "24 Aug 2026" },
  { protocol: "Frax Finance", chain: "Ethereum", score: 6, riskTier: 3, policyTier: 2, source: "DLMM composite", updated: "24 Aug 2026" },
  { protocol: "Stake DAO", chain: "Ethereum", score: 6, riskTier: 3, policyTier: 2, source: "DLMM composite", updated: "24 Aug 2026" },
  { protocol: "Aerodrome", chain: "Base", score: 6, riskTier: 3, policyTier: 2, source: "DLMM composite", updated: "24 Aug 2026" },
  { protocol: "Euler V2", chain: "Ethereum", score: 6, riskTier: 3, policyTier: 2, source: "DLMM composite", updated: "24 Aug 2026" },
];

export const strategyRows = [
  { pool: "USDC supply", exposure: "Stablecoin", protocol: "Aave V3", chain: "Ethereum", tier: 1, apy: 4.20, decisionApy: 3.00, tvl: 2_150_000_000, status: "Active" },
  { pool: "stETH staking", exposure: "ETH", protocol: "Lido", chain: "Ethereum", tier: 1, apy: 3.20, decisionApy: 2.37, tvl: 21_400_000_000, status: "Active" },
  { pool: "DAI / USDC", exposure: "Stablecoin LP", protocol: "Curve", chain: "Ethereum", tier: 2, apy: 4.80, decisionApy: 2.98, tvl: 68_000_000, status: "Active" },
  { pool: "USDC borrowing", exposure: "Stablecoin debt", protocol: "Kamino Lend", chain: "Solana", tier: 2, apy: 5.10, decisionApy: 3.47, tvl: 1_900_000_000, status: "Active" },
  { pool: "USDC supply", exposure: "Stablecoin", protocol: "Spark", chain: "Ethereum", tier: 1, apy: 4.45, decisionApy: 3.56, tvl: 3_800_000_000, status: "Active" },
  { pool: "USDT / USDe", exposure: "Stablecoin LP", protocol: "Stake DAO", chain: "Ethereum", tier: 2, apy: 6.35, decisionApy: 3.81, tvl: 43_000_000, status: "Active" },
  { pool: "FRAX / USDC", exposure: "Stablecoin LP", protocol: "Convex Finance", chain: "Ethereum", tier: 2, apy: 5.70, decisionApy: 3.99, tvl: 61_000_000, status: "Active" },
  { pool: "USDC vault", exposure: "Stablecoin", protocol: "Morpho", chain: "Base", tier: 2, apy: 5.25, decisionApy: 3.68, tvl: 210_000_000, status: "Active" },
  { pool: "USDC supply", exposure: "Stablecoin", protocol: "Euler V2", chain: "Ethereum", tier: 2, apy: 4.90, decisionApy: 3.72, tvl: 150_000_000, status: "Active" },
  { pool: "USDC / sUSD", exposure: "Stablecoin LP", protocol: "Aerodrome", chain: "Base", tier: 2, apy: 5.60, decisionApy: 3.60, tvl: 90_000_000, status: "Active" },
  { pool: "sFRAX staking", exposure: "Stablecoin", protocol: "Frax Finance", chain: "Ethereum", tier: 2, apy: 4.60, decisionApy: 3.40, tvl: 120_000_000, status: "Active" },
];

export type PositionView = Record<string, string | number> & { id: string; status: string };

export const operationalPositions = {
  staking: [
    { id: "POS-003", platform: "Lido", client: "Treasury", token: "ETH", quantity: 542.86, price: 3500, total: 1_900_000, receipt: "stETH", expectedApy: 3.20, realizedApy: 3.14, started: "01 Jul 2026", status: "Active" },
  ],
  farming: [
    { id: "POS-004", platform: "Curve", client: "Treasury", pair: "DAI / USDC", token1: "DAI", token2: "USDC", total: 100_000, expectedApy: 4.80, realizedApy: 4.62, impermanentLoss: -210, started: "15 Jul 2026", status: "Active" },
  ],
  lending: [
    { id: "POS-001", protocol: "Aave V3", client: "Treasury", asset: "USDC", quantity: 5_000_000, price: 1, total: 5_000_000, expectedApy: 4.20, currentApy: 4.08, collateralUse: "Available", started: "01 Jun 2026", status: "Active" },
  ],
  borrowing: [
    { id: "POS-002", protocol: "Kamino Lend", client: "Treasury", asset: "USDC", quantity: 2_000_000, price: 1, total: 2_000_000, collateral: "mSOL", collateralValue: 3_200_000, ltv: 62.50, liquidationLtv: 85.00, started: "20 Jun 2026", status: "Active" },
  ],
};
