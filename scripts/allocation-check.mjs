#!/usr/bin/env node
import { validateAllocation } from "../src/constrained-allocation.mjs";

const budget = 9_000_000;
const capitalBase = 10_000_000;
const candidates = [
  { id: "POS-001", protocol: "Aave V3", tier: 1, poolType: "standalone", allocation: 5_000_000 },
  { id: "POS-002", protocol: "Kamino Lend", tier: 2, poolType: "standalone", allocation: 2_000_000 },
  { id: "POS-003", protocol: "Lido", tier: 1, poolType: "wrapper", allocation: 1_900_000 },
  { id: "POS-004", protocol: "Curve", tier: 3, poolType: "underlying", allocation: 100_000 },
];

const limits = {
  minimumAllocation: 100_000,
  maximumAllocation: 5_000_000,
  poolCaps: { standalone: 0.50, wrapper: 0.20, underlying: 0.10 },
  protocolCaps: { 1: 0.80, 2: 0.30, 3: 0.15, 4: 0.05 },
  tierBudgets: { 1: 0.80, 2: 0.30, 3: 0.15, 4: 0.05 },
};

const { violations } = validateAllocation({ budget, capitalBase, candidates, limits });

if (violations.length) throw new Error(`Constraint scenario failed: ${violations.join("; ")}`);

console.log("PASS allocation constraint scenario", JSON.stringify({
  allocatedCapital: budget,
  capitalBase,
  minimumPosition: limits.minimumAllocation,
  maximumPosition: limits.maximumAllocation,
  positions: candidates.length,
  ruleFamilies: 5,
  violations: violations.length,
}));
