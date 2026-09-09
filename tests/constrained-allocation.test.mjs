import test from "node:test";
import assert from "node:assert/strict";
import { validateAllocation } from "../src/constrained-allocation.mjs";

const limits = {
  minimumAllocation: 100_000,
  maximumAllocation: 5_000_000,
  poolCaps: { standalone: 0.6, wrapper: 0.4 },
  protocolCaps: { 1: 0.6, 2: 0.4 },
  tierBudgets: { 1: 0.7, 2: 0.4 },
};

test("accepts a fully allocated proposal within all caps", () => {
  const candidates = [
    { id: "aave-usdc", protocol: "Aave V3", tier: 1, poolType: "standalone", allocation: 600_000 },
    { id: "lido-steth", protocol: "Lido", tier: 2, poolType: "wrapper", allocation: 400_000 },
  ];
  assert.deepEqual(validateAllocation({ budget: 1_000_000, candidates, limits }).violations, []);
});

test("reports total, pool, protocol, and tier violations", () => {
  const candidates = [
    { id: "curve-usdc-a", protocol: "Curve", tier: 2, poolType: "wrapper", allocation: 500_000 },
    { id: "curve-usdc-b", protocol: "Curve", tier: 2, poolType: "standalone", allocation: 450_000 },
  ];
  const result = validateAllocation({ budget: 1_000_000, candidates, limits });
  assert.equal(result.passed, false);
  assert.equal(result.violations.length, 4);
});

test("checks a one-million-dollar rebalance against the full capital base", () => {
  const result = validateAllocation({
    budget: 1_000_000,
    capitalBase: 10_000_000,
    candidates: [
      { id: "aave-usdc", protocol: "Aave V3", tier: 1, poolType: "standalone", allocation: 1_000_000 },
    ],
    limits: {
      minimumAllocation: 100_000,
      maximumAllocation: 5_000_000,
      poolCaps: { standalone: 0.1 },
      protocolCaps: { 1: 0.8 },
      tierBudgets: { 1: 1 },
    },
  });
  assert.equal(result.passed, true);
  assert.equal(result.total, 1_000_000);
});

test("rejects mixed tiers for one protocol", () => {
  const result = validateAllocation({
    budget: 1_000_000,
    candidates: [
      { id: "curve-usdc-a", protocol: "Curve", tier: 1, poolType: "standalone", allocation: 500_000 },
      { id: "curve-usdc-b", protocol: "Curve", tier: 2, poolType: "standalone", allocation: 500_000 },
    ],
    limits,
  });
  assert.equal(result.passed, false);
  assert.equal(result.violations.includes("Curve: mixed tiers"), true);
});

test("handles multiple same-tier rows for one protocol without a mixed-tier violation", () => {
  const result = validateAllocation({
    budget: 1_000_000,
    candidates: [
      { id: "curve-usdc-a", protocol: "Curve", tier: 2, poolType: "standalone", allocation: 500_000 },
      { id: "curve-usdc-b", protocol: "Curve", tier: 2, poolType: "standalone", allocation: 500_000 },
    ],
    limits: {
      minimumAllocation: 100_000,
      maximumAllocation: 5_000_000,
      poolCaps: { standalone: 0.6 },
      protocolCaps: { 2: 0.4 },
      tierBudgets: { 1: 0.7, 2: 0.4 },
    },
  });
  // 1M total vs tier-2 budget 0.4 * 1M capital base = 400k -> budget exceeded expected,
  // but no mixed-tier violation: protocol tier handling itself is homogeneous.
  assert.equal(result.violations.includes("Curve: mixed tiers"), false);
});

test("rejects an allocation above the five-million-dollar position limit", () => {
  const result = validateAllocation({
    budget: 5_100_000,
    capitalBase: 10_000_000,
    candidates: [{ id: "oversized", protocol: "Aave V3", tier: 1, poolType: "standalone", allocation: 5_100_000 }],
    limits: { minimumAllocation: 100_000, maximumAllocation: 5_000_000, poolCaps: { standalone: 1 }, protocolCaps: { 1: 1 }, tierBudgets: { 1: 1 } },
  });
  assert.equal(result.violations.includes("oversized: above maximum allocation"), true);
});
