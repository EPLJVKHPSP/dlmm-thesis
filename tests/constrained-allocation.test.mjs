import test from "node:test";
import assert from "node:assert/strict";
import { validateAllocation } from "../src/constrained-allocation.mjs";

const limits = {
  minimumAllocation: 5,
  poolCaps: { standalone: 0.6, wrapper: 0.4 },
  protocolCaps: { 1: 0.6, 2: 0.4 },
  tierBudgets: { 1: 0.7, 2: 0.4 },
};

test("accepts a fully allocated proposal within all caps", () => {
  const candidates = [
    { id: "a", protocol: "alpha", tier: 1, poolType: "standalone", allocation: 60 },
    { id: "b", protocol: "beta", tier: 2, poolType: "wrapper", allocation: 40 },
  ];
  assert.deepEqual(validateAllocation({ budget: 100, candidates, limits }).violations, []);
});

test("reports total, pool, protocol, and tier violations", () => {
  const candidates = [
    { id: "a", protocol: "alpha", tier: 2, poolType: "wrapper", allocation: 50 },
    { id: "b", protocol: "alpha", tier: 2, poolType: "standalone", allocation: 45 },
  ];
  const result = validateAllocation({ budget: 100, candidates, limits });
  assert.equal(result.passed, false);
  assert.equal(result.violations.length, 4);
});
