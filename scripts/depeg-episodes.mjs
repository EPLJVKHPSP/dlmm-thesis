#!/usr/bin/env node
// Replay selected material depeg episodes through the exact 3% transition
// classifier shared by the application monitor and the background worker.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { classifyDepegObservation } from "../src/depeg-monitor.mjs";
import { argValue, artifactVersion } from "./common.mjs";

const OFFLINE = process.argv.includes("--offline");
const LABEL_PATH = resolve(argValue("labels") ?? "data/depeg-event-labels.json");
const SNAPSHOT_PATH = resolve(argValue("snapshot") ?? "data/depeg-real-event-prices.json");
const RESULT_PATH = resolve(argValue("results") ?? "results/depeg-real-event-replay.json");
const SNAPSHOT_OUT = argValue("snapshot-out") ? resolve(argValue("snapshot-out")) : null;
const OUT_PATH = argValue("out") ? resolve(argValue("out")) : null;
const PERIOD_SECONDS = 6 * 60 * 60;
const DAY_SECONDS = 24 * 60 * 60;
const THRESHOLD_PCT = 3;
const MIN_CONFIDENCE = 0.5;

const labels = JSON.parse(await readFile(LABEL_PATH, "utf8"));
const replayEvents = labels.events.filter((event) => event.monitorExpectation);
const epoch = (value) => Math.floor(Date.parse(value) / 1000);
const iso = (value) => new Date(value * 1000).toISOString();
const round = (value, digits = 6) => Number(value.toFixed(digits));

async function fetchEvent(event) {
  const coin = labels.assets.find((asset) => asset.symbol === event.symbol)?.coin;
  if (!coin) throw new Error(`No DefiLlama coin id for ${event.symbol}`);
  const start = epoch(event.onset) - DAY_SECONDS;
  const end = epoch(event.end) + DAY_SECONDS;
  const params = new URLSearchParams({
    start: String(start),
    span: String(Math.ceil((end - start) / PERIOD_SECONDS)),
    period: "6h",
    searchWidth: "12h",
  });
  const response = await fetch(`https://coins.llama.fi/chart/${encodeURIComponent(coin)}?${params}`, {
    headers: { "User-Agent": "dlmm-thesis-evidence/1.0" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`DefiLlama ${response.status} for ${coin}`);
  const rows = (await response.json()).coins?.[coin]?.prices;
  if (!Array.isArray(rows)) throw new Error(`Missing DefiLlama price series for ${coin}`);
  return {
    eventId: event.id,
    symbol: event.symbol,
    coin,
    observations: rows
      .map((row) => ({ timestamp: Number(row.timestamp), price: Number(row.price) }))
      .filter((row) => row.timestamp >= start && row.timestamp <= end
        && Number.isFinite(row.price) && row.price > 0 && row.price <= 1.5)
      .sort((a, b) => a.timestamp - b.timestamp),
  };
}

function replayEvent(event, series) {
  const onset = epoch(event.onset);
  const end = epoch(event.end);
  let previousActive = false;
  let firstOpen = null;
  let firstRecovery = null;
  let minimumPrice = Infinity;
  let maximumDeviationPct = 0;
  let evaluatedObservations = 0;

  for (const row of series.observations) {
    if (row.timestamp < onset || row.timestamp > end + DAY_SECONDS) continue;
    const state = classifyDepegObservation({
      price: row.price,
      referencePrice: labels.targetPegUsd,
      confidence: 1,
      thresholdPct: THRESHOLD_PCT,
      minConfidence: MIN_CONFIDENCE,
      previousActive,
    });
    previousActive = state.active;
    if (row.timestamp < end) {
      minimumPrice = Math.min(minimumPrice, row.price);
      maximumDeviationPct = Math.max(maximumDeviationPct, state.deviationPct);
      evaluatedObservations += 1;
    }
    if (!firstOpen && row.timestamp < end && state.transition === "opened") {
      firstOpen = { timestamp: row.timestamp, price: row.price };
    } else if (firstOpen && !firstRecovery && state.transition === "recovered") {
      firstRecovery = { timestamp: row.timestamp, price: row.price };
    }
  }

  const expected = event.monitorExpectation;
  if (!expected) throw new Error(`No monitor expectation for ${event.id}`);
  const opened = Boolean(firstOpen);
  const recovered = Boolean(firstRecovery);
  return {
    eventId: event.id,
    symbol: event.symbol,
    expected,
    observed: { opened, recovered },
    passed: opened === expected.opened && recovered === expected.recovered,
    firstOpenAt: firstOpen ? iso(firstOpen.timestamp) : null,
    openLatencyHours: firstOpen ? round((firstOpen.timestamp - onset) / 3600, 2) : null,
    firstOpenPrice: firstOpen ? round(firstOpen.price, 6) : null,
    firstRecoveryAt: firstRecovery ? iso(firstRecovery.timestamp) : null,
    minimumPrice: Number.isFinite(minimumPrice) ? round(minimumPrice, 6) : null,
    maximumDeviationPct: round(maximumDeviationPct, 3),
    evaluatedObservations,
  };
}

const snapshot = OFFLINE
  ? JSON.parse(await readFile(SNAPSHOT_PATH, "utf8"))
  : {
      schemaVersion: 1,
      source: labels.priceSource,
      fetchedAt: new Date().toISOString(),
      samplingPeriod: "6h",
      events: await Promise.all(replayEvents.map(fetchEvent)),
    };

if (SNAPSHOT_OUT) {
  await mkdir(dirname(SNAPSHOT_OUT), { recursive: true });
  await writeFile(SNAPSHOT_OUT, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
}

const byId = new Map(snapshot.events.map((event) => [event.eventId, event]));
const events = replayEvents.map((event) => {
  const series = byId.get(event.id);
  if (!series) throw new Error(`Snapshot missing ${event.id}`);
  return replayEvent(event, series);
});
const snapshotSha256 = createHash("sha256")
  .update(JSON.stringify(snapshot.events))
  .digest("hex");
const report = {
  evaluation: "exact-monitor-real-event-replay",
  publicArtifactVersion: artifactVersion(),
  generatedAt: new Date().toISOString(),
  implementation: "src/depeg-monitor.mjs classifyDepegObservation",
  settings: { thresholdPct: THRESHOLD_PCT, minConfidence: MIN_CONFIDENCE },
  source: snapshot.source,
  snapshotSha256,
  events,
  summary: {
    passed: events.filter((event) => event.passed).length,
    total: events.length,
    materialBreachesOpened: events.filter((event) => event.expected.opened && event.observed.opened).length,
  },
  limitations: [
    "The replay uses six-hour DefiLlama observations, while the live worker normally polls every 60 seconds.",
    "The replay validates contemporaneous threshold behavior; it does not claim advance prediction.",
  ],
};

if (OUT_PATH) {
  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
} else if (OFFLINE) {
  const published = JSON.parse(await readFile(RESULT_PATH, "utf8"));
  const signature = (items) => JSON.stringify(items.map(({ eventId, observed, passed }) => ({ eventId, observed, passed })));
  if (published.snapshotSha256 !== snapshotSha256 || signature(published.events) !== signature(events)) {
    throw new Error("Exact-monitor replay does not match the published evidence");
  }
}

for (const event of events) {
  const outcome = event.observed.opened
    ? `opened at ${event.firstOpenAt} (${event.maximumDeviationPct.toFixed(2)}% max deviation)${event.observed.recovered ? `; recovered at ${event.firstRecoveryAt}` : "; no recovery"}`
    : `stayed stable (${event.maximumDeviationPct.toFixed(2)}% max deviation)`;
  console.log(`${event.passed ? "PASS" : "FAIL"} ${event.symbol} ${event.eventId} - ${outcome}`);
}
console.log(`DONE exact monitor replay - ${report.summary.passed}/${report.summary.total} expected outcomes passed`);
if (report.summary.passed !== report.summary.total) process.exitCode = 1;
