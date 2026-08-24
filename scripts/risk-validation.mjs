#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const payload = JSON.parse(await readFile(new URL("../data/risk-oof-scores.json", import.meta.url), "utf8"));
const records = payload.records;

function rocAuc(rows) {
  const positives = rows.filter((row) => row.label === 1);
  const negatives = rows.filter((row) => row.label === 0);
  let wins = 0;
  let pairs = 0;
  for (const positive of positives) {
    for (const negative of negatives) {
      wins += positive.score > negative.score ? 1 : positive.score === negative.score ? 0.5 : 0;
      pairs += 1;
    }
  }
  return pairs ? wins / pairs : null;
}

function averagePrecision(rows) {
  const ranked = [...rows].sort((a, b) => b.score - a.score);
  const positives = ranked.filter((row) => row.label === 1).length;
  let seen = 0;
  let total = 0;
  ranked.forEach((row, index) => {
    if (row.label === 1) {
      seen += 1;
      total += seen / (index + 1);
    }
  });
  return total / Math.max(1, positives);
}

function seededRandom(seed = 20260824) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function bootstrap(rows, iterations = 2000) {
  const random = seededRandom();
  const estimates = [];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const sample = Array.from({ length: rows.length }, () => rows[Math.floor(random() * rows.length)]);
    const estimate = rocAuc(sample);
    if (estimate != null) estimates.push(estimate);
  }
  estimates.sort((a, b) => a - b);
  return {
    iterations: estimates.length,
    lower95: estimates[Math.floor(estimates.length * 0.025)],
    upper95: estimates[Math.min(estimates.length - 1, Math.floor(estimates.length * 0.975))],
  };
}

const result = {
  units: records.length,
  incidentAssociatedUnits: records.filter((row) => row.label === 1).length,
  rocAuc: rocAuc(records),
  averagePrecision: averagePrecision(records),
  rocAucBootstrap95: bootstrap(records),
};

const expected = {
  rocAuc: 0.7052631578947368,
  averagePrecision: 0.3404761904761905,
  lower95: 0.48739495798319327,
  upper95: 0.9074074074074074,
};

function close(actual, target, tolerance = 1e-12) {
  return Math.abs(actual - target) <= tolerance;
}

if (!close(result.rocAuc, expected.rocAuc)
  || !close(result.averagePrecision, expected.averagePrecision)
  || !close(result.rocAucBootstrap95.lower95, expected.lower95)
  || !close(result.rocAucBootstrap95.upper95, expected.upper95)) {
  throw new Error(`Risk validation mismatch: ${JSON.stringify(result)}`);
}

console.log("PASS risk validation", JSON.stringify(result));
