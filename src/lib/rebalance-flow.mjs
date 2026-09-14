import { validateAllocation } from "../constrained-allocation.mjs";

/**
 * @typedef {Object} FlowPosition
 * @property {string} id
 * @property {string} kind
 * @property {string} asset
 * @property {string} protocol
 * @property {number} principalUsd
 * @property {string} [status]
 * @property {string} [strategyId]
 * @property {string} [walletId]
 * @property {string | null} [collateralFor]
 * @property {string} [poolGauge]
 * @property {string} [assessmentPeriod]
 */

/**
 * @typedef {Object} FlowPool
 * @property {string} pool
 * @property {string} protocol
 * @property {number} tier
 * @property {number} decisionApy
 * @property {string} exposure
 * @property {string} status
 * @property {number} tvl
 */

/**
 * @typedef {Object} SkippedPool
 * @property {string} id
 * @property {string} protocol
 * @property {string} reason
 */

/**
 * @typedef {Object} FlowCandidate
 * @property {string} id
 * @property {string} protocol
 * @property {string} pool
 * @property {number} tier
 * @property {string} poolType
 * @property {number} apy
 * @property {number} risk
 * @property {number} tvl
 * @property {number} allocation
 * @property {string} bindingCap
 */

/**
 * @typedef {Object} GuidelineAction
 * @property {string} leg
 * @property {"exit" | "enter"} action
 * @property {string} label
 * @property {string} platform
 * @property {number} usd
 */

export const FLOW_CAPITAL_BASE = 10_000_000;
export const FLOW_DEFAULT_IDLE = 1_000_000;

export const FLOW_LIMITS = {
  minimumAllocation: 100_000,
  maximumAllocation: 5_000_000,
  poolCaps: { standalone: 0.5 },
  protocolCaps: { 1: 0.8, 2: 0.3 },
  tierBudgets: { 1: 1, 2: 0.75 },
  poolTvlShare: 0.1,
};

const RISK_FLOOR = 6;

/** @param {string | string[] | undefined} raw @param {string[]} knownIds @returns {string[]} */
export function parseIds(raw, knownIds) {
  const parts = Array.isArray(raw) ? raw.flatMap((v) => String(v).split(",")) : String(raw ?? "").split(",");
  const known = new Set(knownIds);
  return [...new Set(parts.map((v) => v.trim()).filter((v) => known.has(v)))];
}

/** @param {string | string[] | undefined} raw @param {number} [fallback] @returns {number} */
export function parseIdle(raw, fallback = FLOW_DEFAULT_IDLE) {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

/** @param {FlowPosition[]} positions @param {string[]} ids */
export function selectionStats(positions, ids) {
  const picked = new Set(ids);
  const selected = positions.filter((p) => picked.has(p.id));
  const retained = positions.filter((p) => !picked.has(p.id));
  const freedUsd = selected.reduce((sum, p) => sum + p.principalUsd, 0);
  const activeCapital = positions.reduce((sum, p) => sum + p.principalUsd, 0);
  return { selected, retained, tickedCount: selected.length, retainedCount: retained.length, freedUsd, activeCapital };
}

/** @param {FlowPosition[]} positions @param {string[]} ids @param {number} idleUsd @returns {number} */
export function deployableUsd(positions, ids, idleUsd) {
  return selectionStats(positions, ids).freedUsd + idleUsd;
}

/** @param {FlowPool[]} strategyRows @param {{ protocol: string, score: number }[]} [ratings] @param {number} [floor] @returns {{ ranked: FlowCandidate[], skipped: SkippedPool[] }} */
export function rankCandidates(strategyRows, ratings = [], floor = RISK_FLOOR) {
  const scoreOf = new Map(ratings.map((r) => [r.protocol, r.score]));
  const ranked = [];
  const skipped = [];
  const sorted = [...strategyRows].sort((a, b) => b.decisionApy - a.decisionApy);
  for (const row of sorted) {
    const id = `${row.protocol} ${row.pool}`;
    if (row.status !== "Active") {
      skipped.push({ id, protocol: row.protocol, reason: `status ${row.status} — not eligible` });
      continue;
    }
    if (row.exposure === "Stablecoin debt") {
      skipped.push({ id, protocol: row.protocol, reason: "borrowing exposure excluded" });
      continue;
    }
    const risk = scoreOf.get(row.protocol) ?? floor;
    if (risk < floor) {
      skipped.push({ id, protocol: row.protocol, reason: `risk ${risk} below floor ${floor}` });
      continue;
    }
    ranked.push({
      id,
      protocol: row.protocol,
      pool: row.pool,
      tier: row.tier,
      poolType: "standalone",
      apy: row.decisionApy,
      risk,
      tvl: row.tvl ?? 0,
      allocation: 0,
      bindingCap: "",
    });
  }
  return { ranked, skipped };
}

/**
 * Deterministic constrained allocator: fills ranked pools to their binding
 * cap (position max, protocol cap, tier budget, pool cap, pool-TVL share),
 * spills over to the next pool, and places any dust remainder so the
 * validator — not the allocator — judges ticket violations.
 * @param {FlowPool[]} strategyRows
 * @param {{ protocol: string, score: number }[]} [ratings]
 * @param {number} deployable
 * @returns {{ candidates: FlowCandidate[], skipped: SkippedPool[], validation: { passed: boolean, total: number, violations: string[] }, top: FlowCandidate | null }}
 */
export function buildTarget(strategyRows, ratings, deployable, limits = FLOW_LIMITS, capitalBase = FLOW_CAPITAL_BASE) {
  const { ranked, skipped } = rankCandidates(strategyRows, ratings);
  const top = ranked[0] ?? null;
  const protocolUsed = new Map();
  const tierUsed = new Map();
  const candidates = [];
  let remaining = deployable;
  for (const pool of ranked) {
    if (remaining <= 0) break;
    const caps = [
      ["position max", limits.maximumAllocation],
      ["protocol cap", (limits.protocolCaps[pool.tier] ?? 0) * capitalBase - (protocolUsed.get(pool.protocol) ?? 0)],
      ["tier budget", (limits.tierBudgets[pool.tier] ?? 0) * capitalBase - (tierUsed.get(pool.tier) ?? 0)],
      ["pool cap", (limits.poolCaps[pool.poolType] ?? 0) * capitalBase],
      ["pool-TVL share", (pool.tvl ?? 0) * (limits.poolTvlShare ?? 0)],
    ];
    const binding = caps.reduce((a, b) => (a[1] <= b[1] ? a : b));
    const take = Math.min(remaining, Math.max(0, binding[1]));
    if (take <= 0) {
      skipped.push({ id: pool.id, protocol: pool.protocol, reason: `capped by ${binding[0]} — no headroom` });
      continue;
    }
    candidates.push({ ...pool, allocation: take, bindingCap: binding[0] });
    protocolUsed.set(pool.protocol, (protocolUsed.get(pool.protocol) ?? 0) + take);
    tierUsed.set(pool.tier, (tierUsed.get(pool.tier) ?? 0) + take);
    remaining -= take;
  }
  if (remaining > 0) {
    skipped.push({ id: "unallocated remainder", protocol: "—", reason: `${remaining} USD could not be placed within caps` });
  }
  const dust = candidates.find((c) => c.allocation > 0 && c.allocation < limits.minimumAllocation);
  if (dust) {
    skipped.push({ id: dust.id, protocol: dust.protocol, reason: `dust remainder below ${limits.minimumAllocation} ticket — flagged by validator` });
  }
  const validation = validateAllocation({
    budget: deployable,
    capitalBase,
    candidates: candidates.map(({ id, protocol, tier, poolType, allocation }) => ({ id, protocol, tier, poolType, allocation })),
    limits,
  });
  return { candidates, skipped, validation, top };
}

/** @param {string[]} ids @param {number} idleUsd @param {string} exposure @returns {string} */
export function flowSignature(ids, idleUsd, exposure) {
  const input = `${[...ids].sort().join(",")}|${idleUsd}|${exposure}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}

/** @param {FlowPosition[]} positions @param {FlowPool[]} strategyRows @param {{ protocol: string, score: number }[]} [ratings] @param {string[]} ids @param {number} deployable @returns {GuidelineAction[]} */
export function buildGuidelineActions(positions, strategyRows, ratings, ids, deployable) {
  const { selected } = selectionStats(positions, ids);
  const { candidates } = buildTarget(strategyRows, ratings, deployable);
  const exits = selected.map((p) => ({ leg: p.kind, action: "exit", label: `${p.id} ${p.asset}`, platform: p.protocol, usd: p.principalUsd }));
  const enters = candidates.map((c) => ({ leg: "Target", action: "enter", label: c.pool, platform: c.protocol, usd: c.allocation }));
  return [...exits, ...enters];
}
