import test from "node:test";
import assert from "node:assert/strict";
import { calculateCompositeRisk } from "../src/composite-risk.mjs";

test("returns the transparent weighted score and tier", () => {
  const result = calculateCompositeRisk(
    { internal: 6, hindenrank: 8, tokenInsight: 4 },
    { internal: 0.05, hindenrank: 0.60, tokenInsight: 0.35 },
  );
  assert.ok(Math.abs(result.score - 6.5) < 1e-12);
  assert.equal(result.tier, 4);
  assert.ok(Math.abs(result.contributions.internal - 0.3) < 1e-12);
  assert.equal(result.contributions.hindenrank, 4.8);
  assert.equal(result.contributions.tokenInsight, 1.4);
});

test("renormalizes when an optional component is unavailable", () => {
  const result = calculateCompositeRisk({ internal: 6 }, { internal: 0.25, external: 0.75 });
  assert.equal(result.score, 6);
  assert.equal(result.usedWeight, 0.25);
});
