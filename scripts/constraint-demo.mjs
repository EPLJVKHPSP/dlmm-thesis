#!/usr/bin/env node

const budget = 100;
const candidates = [
  { id: "candidate-a", protocol: "protocol-alpha", tier: 1, poolType: "standalone", allocation: 10 },
  { id: "candidate-b", protocol: "protocol-beta", tier: 1, poolType: "wrapper", allocation: 10 },
  { id: "candidate-c", protocol: "protocol-gamma", tier: 2, poolType: "underlying", allocation: 5 },
  { id: "candidate-d", protocol: "protocol-delta", tier: 2, poolType: "standalone", allocation: 10 },
  { id: "candidate-e", protocol: "protocol-epsilon", tier: 3, poolType: "wrapper", allocation: 10 },
  { id: "candidate-f", protocol: "protocol-zeta", tier: 1, poolType: "other", allocation: 55 },
];

const limits = {
  minimumAllocation: 5,
  poolCaps: { standalone: 0.10, wrapper: 0.10, underlying: 0.05, other: 1.00 },
  protocolCaps: { 1: 0.80, 2: 0.30, 3: 0.15, 4: 0.05 },
  tierBudgets: { 1: 1.00, 2: 0.75, 3: 0.30, 4: 0.10 },
};

const violations = [];
const allocation = candidates.reduce((sum, row) => sum + row.allocation, 0);
if (allocation !== budget) violations.push(`allocation ${allocation} does not equal budget ${budget}`);

for (const row of candidates) {
  if (row.allocation < limits.minimumAllocation) violations.push(`${row.id}: below minimum allocation`);
  if (row.allocation > budget * limits.poolCaps[row.poolType]) violations.push(`${row.id}: pool cap exceeded`);
  if (row.allocation > budget * limits.protocolCaps[row.tier]) violations.push(`${row.id}: protocol cap exceeded`);
}

for (const tier of [1, 2, 3, 4]) {
  const tierAllocation = candidates.filter((row) => row.tier === tier)
    .reduce((sum, row) => sum + row.allocation, 0);
  if (tierAllocation > budget * limits.tierBudgets[tier]) violations.push(`tier ${tier}: budget exceeded`);
}

if (violations.length) throw new Error(`Constraint fixture failed: ${violations.join("; ")}`);

console.log("PASS synthetic constraint fixture", JSON.stringify({
  normalizedBudget: budget,
  positions: candidates.length,
  ruleFamilies: 4,
  violations: violations.length,
}));
