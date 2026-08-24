#!/usr/bin/env node
import { readFile } from "node:fs/promises";

async function json(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
}

const historical = await json("../results/historical-depeg-calibration.json");
const risk = await json("../results/risk-calibration-summary.json");
const sensitivity = await json("../results/risk-sensitivity-summary.json");
const constraints = await json("../results/rebalance-constraint-summary.json");
const synthetic = await json("../results/depeg-benchmark.json");
const engineering = await json("../results/engineering-validation-summary.json");

const checks = [
  [historical.sample.trainRows === 10565, "historical training rows"],
  [historical.sample.testRows === 5040, "historical test rows"],
  [historical.calibratedModel.testMetrics.rocAuc > 0.97, "historical held-out ROC-AUC"],
  [historical.calibratedModel.testEvents.events.every((event) => event.detected), "held-out event detection"],
  [risk.sample.protocols === 24, "pseudonymized risk units"],
  [risk.crossValidation.rocAuc > 0.70, "risk out-of-fold ROC-AUC"],
  [risk.crossValidation.rocAucBootstrap95.lower95 < 0.5, "risk uncertainty disclosed"],
  [sensitivity.baseRecomputation.exactStoredScoreMatchPct === 1, "stored-score recomputation"],
  [constraints.passed === true && constraints.violationCount === 0, "constraint summary"],
  [synthetic.dataset.kind === "deterministic synthetic fixture", "synthetic benchmark labelled"],
  [engineering.applicationTests.passed === 83 && engineering.applicationTests.failed === 0, "application test aggregate"],
  [engineering.browserAndSecurityChecks.passed === engineering.browserAndSecurityChecks.total, "browser and security aggregate"],
];

const failed = checks.filter(([passed]) => !passed).map(([, label]) => label);
if (failed.length) throw new Error(`Evidence verification failed: ${failed.join(", ")}`);

console.log("PASS archived evidence", JSON.stringify({ checks: checks.length, failed: 0 }));
