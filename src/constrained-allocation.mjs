const EPSILON = 1e-9;

export function validateAllocation({ budget, capitalBase = budget, candidates, limits }) {
  if (!Number.isFinite(budget) || budget <= 0) throw new TypeError("budget must be positive");
  if (!Number.isFinite(capitalBase) || capitalBase <= 0) {
    throw new TypeError("capitalBase must be positive");
  }
  if (!Array.isArray(candidates)) throw new TypeError("candidates must be an array");

  const violations = [];
  const total = candidates.reduce((sum, row) => sum + row.allocation, 0);
  if (Math.abs(total - budget) > EPSILON) violations.push(`allocation ${total} does not equal budget ${budget}`);

  const protocolTotals = new Map();
  const protocolTiers = new Map();
  const tierTotals = new Map();
  for (const row of candidates) {
    if (!Number.isFinite(row.allocation) || row.allocation < limits.minimumAllocation) {
      violations.push(`${row.id}: below minimum allocation`);
    }
    if (Number.isFinite(limits.maximumAllocation) && row.allocation > limits.maximumAllocation + EPSILON) {
      violations.push(`${row.id}: above maximum allocation`);
    }
    const poolCap = limits.poolCaps[row.poolType];
    if (poolCap == null) violations.push(`${row.id}: unknown pool type`);
    else if (row.allocation > capitalBase * poolCap + EPSILON) violations.push(`${row.id}: pool cap exceeded`);
    protocolTotals.set(row.protocol, (protocolTotals.get(row.protocol) ?? 0) + row.allocation);
    if (!protocolTiers.has(row.protocol)) protocolTiers.set(row.protocol, new Set());
    protocolTiers.get(row.protocol).add(row.tier);
    tierTotals.set(row.tier, (tierTotals.get(row.tier) ?? 0) + row.allocation);
  }

  for (const [protocol, amount] of protocolTotals) {
    const tiers = protocolTiers.get(protocol);
    if (tiers.size > 1) {
      violations.push(`${protocol}: mixed tiers`);
      continue;
    }
    const tier = [...tiers][0];
    const cap = limits.protocolCaps[tier];
    if (cap == null) violations.push(`${protocol}: unknown protocol tier`);
    else if (amount > capitalBase * cap + EPSILON) violations.push(`${protocol}: protocol cap exceeded`);
  }
  for (const [tier, amount] of tierTotals) {
    const cap = limits.tierBudgets[tier];
    if (cap == null) violations.push(`tier ${tier}: missing budget`);
    else if (amount > capitalBase * cap + EPSILON) violations.push(`tier ${tier}: budget exceeded`);
  }

  return { passed: violations.length === 0, total, violations };
}
