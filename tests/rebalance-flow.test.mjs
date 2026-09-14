import test from "node:test";
import assert from "node:assert/strict";
import {
  parseIds, parseIdle, selectionStats, deployableUsd,
  rankCandidates, buildTarget, flowSignature, buildGuidelineActions,
} from "../src/lib/rebalance-flow.mjs";

const positions = [
  { id: "POS-001", kind: "Lending", asset: "USDC", protocol: "Aave V3", principalUsd: 5_000_000 },
  { id: "POS-002", kind: "Borrowing", asset: "USDC", protocol: "Kamino Lend", principalUsd: 2_000_000 },
  { id: "POS-003", kind: "Staking", asset: "stETH", protocol: "Lido", principalUsd: 1_900_000 },
  { id: "POS-004", kind: "Farming", asset: "DAI / USDC", protocol: "Curve", principalUsd: 100_000 },
];

const pools = [
  { pool: "USDC supply", protocol: "Aave V3", tier: 1, decisionApy: 3.0, exposure: "Stablecoin", status: "Active", tvl: 2_150_000_000 },
  { pool: "FRAX / USDC", protocol: "Convex Finance", tier: 2, decisionApy: 3.99, exposure: "Stablecoin LP", status: "Active", tvl: 61_000_000 },
  { pool: "USDT / USDe", protocol: "Stake DAO", tier: 2, decisionApy: 3.81, exposure: "Stablecoin LP", status: "Active", tvl: 43_000_000 },
  { pool: "USDC borrowing", protocol: "Kamino Lend", tier: 2, decisionApy: 3.47, exposure: "Stablecoin debt", status: "Active", tvl: 1_900_000_000 },
  { pool: "Old vault", protocol: "Retired", tier: 1, decisionApy: 9.99, exposure: "Stablecoin", status: "Watch", tvl: 5_000_000 },
];

const ratings = [
  { protocol: "Aave V3", score: 8 },
  { protocol: "Convex Finance", score: 7 },
  { protocol: "Stake DAO", score: 6 },
  { protocol: "Shady", score: 3 },
];

test("parseIds keeps known ids, dedupes, drops unknown", () => {
  assert.deepEqual(parseIds("POS-001,POS-001,NOPE", positions.map((p) => p.id)), ["POS-001"]);
  assert.deepEqual(parseIds(["POS-002", "POS-003,POS-004"], positions.map((p) => p.id)), ["POS-002", "POS-003", "POS-004"]);
  assert.deepEqual(parseIds(undefined, positions.map((p) => p.id)), []);
});

test("selection stats split ticked and retained capital", () => {
  const stats = selectionStats(positions, ["POS-004"]);
  assert.equal(stats.tickedCount, 1);
  assert.equal(stats.retainedCount, 3);
  assert.equal(stats.freedUsd, 100_000);
  assert.equal(stats.activeCapital, 9_000_000);
});

test("deployable adds freed exits to idle cash", () => {
  assert.equal(deployableUsd(positions, ["POS-004"], 1_000_000), 1_100_000);
  assert.equal(deployableUsd(positions, [], 0), 0);
});

test("ranking orders by decision APY and records skips", () => {
  const { ranked, skipped } = rankCandidates(pools, ratings);
  assert.equal(ranked[0].protocol, "Convex Finance");
  assert.ok(ranked[0].apy >= ranked[1].apy);
  assert.ok(!ranked.some((c) => c.protocol === "Kamino Lend"));
  assert.ok(!ranked.some((c) => c.protocol === "Retired"));
  assert.ok(skipped.some((s) => s.reason.includes("borrowing")));
  assert.ok(skipped.some((s) => s.reason.includes("not eligible")));
});

test("pools below the risk floor are skipped", () => {
  const low = [...pools, { pool: "Junk", protocol: "Shady", tier: 2, decisionApy: 9.0, exposure: "Stablecoin", status: "Active", tvl: 1_000_000 }];
  const { ranked, skipped } = rankCandidates(low, ratings);
  assert.ok(!ranked.some((c) => c.protocol === "Shady"));
  assert.ok(skipped.some((s) => s.protocol === "Shady" && s.reason.includes("floor")));
});

test("one-million target fills the top pool and validates cleanly", () => {
  const { candidates, validation } = buildTarget(pools, ratings, 1_000_000);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].protocol, "Convex Finance");
  assert.equal(candidates[0].allocation, 1_000_000);
  assert.equal(validation.passed, true);
});

test("large deployable spills across protocol caps", () => {
  const { candidates, validation } = buildTarget(pools, ratings, 6_000_000);
  assert.ok(candidates.length >= 2);
  const convex = candidates.find((c) => c.protocol === "Convex Finance");
  assert.equal(convex.allocation, 3_000_000);
  assert.equal(convex.bindingCap, "protocol cap");
  assert.equal(validation.total, 6_000_000);
  assert.equal(validation.passed, true);
});

test("dust below the ticket is placed and flagged by the validator", () => {
  const { candidates, validation } = buildTarget(pools, ratings, 50_000);
  assert.equal(validation.total, 50_000);
  assert.equal(validation.passed, false);
  assert.ok(validation.violations.some((v) => v.includes("below minimum")));
  assert.ok(candidates.length >= 1);
});

test("oversize deployable fails position caps visibly", () => {
  const { validation } = buildTarget(pools, ratings, 20_000_000);
  assert.equal(validation.passed, false);
  assert.ok(validation.violations.length > 0);
});

test("flow signature is stable and input-sensitive", () => {
  assert.equal(flowSignature(["POS-001"], 1_000_000, "standalone"), flowSignature(["POS-001"], 1_000_000, "standalone"));
  assert.notEqual(flowSignature(["POS-001"], 1_000_000, "standalone"), flowSignature(["POS-001"], 500_000, "standalone"));
});

test("guideline lists exits before the enters", () => {
  const actions = buildGuidelineActions(positions, pools, ratings, ["POS-004"], 1_100_000);
  assert.equal(actions[0].action, "exit");
  assert.equal(actions.at(-1).action, "enter");
  assert.equal(actions.reduce((sum, a) => sum + (a.action === "enter" ? a.usd : 0), 0), 1_100_000);
});

test("same inputs produce the same book", () => {
  const first = buildTarget(pools, ratings, 6_000_000);
  const second = buildTarget(pools, ratings, 6_000_000);
  assert.deepEqual(first.candidates, second.candidates);
});
