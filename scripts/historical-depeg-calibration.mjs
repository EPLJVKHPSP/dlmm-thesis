#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { argValue, artifactVersion } from "./common.mjs";

const LABEL_PATH = resolve(argValue("labels") ?? "data/depeg-event-labels.json");
const OUT_PATH = resolve(argValue("out") ?? "results/historical-depeg-calibration-rerun.json");
const PERIOD_SECONDS = 6 * 60 * 60;
const MAX_POINTS = 480;
const labels = JSON.parse(await readFile(LABEL_PATH, "utf8"));

function iso(epochSeconds) {
  return new Date(epochSeconds * 1000).toISOString();
}

function epoch(value) {
  return Math.floor(Date.parse(value) / 1000);
}

async function fetchChunk(coin, start, span, attempt = 1) {
  const params = new URLSearchParams({
    start: String(start),
    span: String(span),
    period: "6h",
    searchWidth: "12h",
  });
  const url = `https://coins.llama.fi/chart/${encodeURIComponent(coin)}?${params}`;
  const response = await fetch(url, {
    headers: { "User-Agent": "dlmm-thesis-evidence/1.0" },
    signal: AbortSignal.timeout(30_000),
  });
  if ((response.status === 429 || response.status >= 500) && attempt < 5) {
    await new Promise((done) => setTimeout(done, 250 * 2 ** attempt));
    return fetchChunk(coin, start, span, attempt + 1);
  }
  if (!response.ok) throw new Error(`DefiLlama ${response.status} for ${coin} at ${iso(start)}`);
  const payload = await response.json();
  const series = payload.coins?.[coin]?.prices;
  if (!Array.isArray(series)) throw new Error(`Missing price series for ${coin}`);
  return series;
}

async function fetchRange(coin, startIso, endIso) {
  const start = epoch(startIso);
  const end = epoch(endIso);
  const byTimestamp = new Map();
  for (let cursor = start; cursor < end; cursor += MAX_POINTS * PERIOD_SECONDS) {
    const span = Math.min(MAX_POINTS, Math.ceil((end - cursor) / PERIOD_SECONDS));
    const rows = await fetchChunk(coin, cursor, span);
    for (const row of rows) {
      const timestamp = Number(row.timestamp);
      const price = Number(row.price);
      if (timestamp >= start - PERIOD_SECONDS && timestamp < end + PERIOD_SECONDS && Number.isFinite(price)) {
        byTimestamp.set(timestamp, price);
      }
    }
  }
  return [...byTimestamp.entries()]
    .map(([timestamp, price]) => ({ timestamp, price }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function std(values) {
  const avg = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - avg) ** 2)));
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function activeEvent(symbol, timestamp, split) {
  return labels.events.find(
    (event) => event.symbol === symbol && event.split === split
      && timestamp >= epoch(event.onset) && timestamp < epoch(event.end),
  ) ?? null;
}

function buildRows(symbol, split, prices) {
  const rows = [];
  for (let index = 4; index < prices.length; index += 1) {
    const current = prices[index];
    const recent = prices.slice(index - 4, index + 1);
    const gapsOk = recent.every((row, recentIndex) => recentIndex === 0
      || row.timestamp - recent[recentIndex - 1].timestamp <= PERIOD_SECONDS * 1.75);
    if (!gapsOk || current.price <= 0 || current.price > 1.5) continue;
    const deviations = recent.map((row) => Math.abs(row.price - labels.targetPegUsd));
    const previous = prices[index - 1].price;
    const event = activeEvent(symbol, current.timestamp, split);
    rows.push({
      symbol,
      split,
      timestamp: current.timestamp,
      sampledAt: iso(current.timestamp),
      price: current.price,
      eventId: event?.id ?? null,
      label: event ? 1 : 0,
      features: [
        clamp01(Math.abs(current.price - 1) / 0.03),
        clamp01(mean(deviations) / 0.02),
        clamp01(std(recent.map((row) => row.price)) / 0.02),
        clamp01(Math.max(0, previous - current.price) / 0.02),
      ],
    });
  }
  return rows;
}

function score(row, weights) {
  return row.features.reduce((sum, value, index) => sum + value * weights[index], 0);
}

function confusion(rows, weights, threshold) {
  const out = { tp: 0, fp: 0, tn: 0, fn: 0 };
  for (const row of rows) {
    const predicted = score(row, weights) >= threshold ? 1 : 0;
    if (predicted && row.label) out.tp += 1;
    else if (predicted) out.fp += 1;
    else if (row.label) out.fn += 1;
    else out.tn += 1;
  }
  return out;
}

function metrics(cm) {
  const precision = cm.tp / Math.max(1, cm.tp + cm.fp);
  const recall = cm.tp / Math.max(1, cm.tp + cm.fn);
  const specificity = cm.tn / Math.max(1, cm.tn + cm.fp);
  const f1 = (2 * precision * recall) / Math.max(Number.EPSILON, precision + recall);
  return {
    precision,
    recall,
    specificity,
    balancedAccuracy: (recall + specificity) / 2,
    f1,
    falsePositiveRate: cm.fp / Math.max(1, cm.fp + cm.tn),
  };
}

function auc(rows, weights) {
  const positives = rows.filter((row) => row.label === 1);
  const negatives = rows.filter((row) => row.label === 0);
  let wins = 0;
  let pairs = 0;
  for (const positive of positives) {
    const p = score(positive, weights);
    for (const negative of negatives) {
      const n = score(negative, weights);
      wins += p > n ? 1 : p === n ? 0.5 : 0;
      pairs += 1;
    }
  }
  return wins / Math.max(1, pairs);
}

function averagePrecision(rows, weights) {
  const ranked = [...rows].sort((a, b) => score(b, weights) - score(a, weights));
  const positives = ranked.filter((row) => row.label).length;
  let seen = 0;
  let sumPrecision = 0;
  ranked.forEach((row, index) => {
    if (row.label) {
      seen += 1;
      sumPrecision += seen / (index + 1);
    }
  });
  return sumPrecision / Math.max(1, positives);
}

function* weightGrid(step = 0.05) {
  const units = Math.round(1 / step);
  for (let a = 0; a <= units; a += 1) {
    for (let b = 0; b <= units - a; b += 1) {
      for (let c = 0; c <= units - a - b; c += 1) {
        const d = units - a - b - c;
        yield [a, b, c, d].map((value) => value / units);
      }
    }
  }
}

function calibrate(trainRows) {
  let best = null;
  for (const weights of weightGrid()) {
    for (let threshold = 0.05; threshold <= 0.95 + 1e-9; threshold += 0.025) {
      const cm = confusion(trainRows, weights, threshold);
      const m = metrics(cm);
      const objective = 0.7 * m.f1 + 0.3 * m.balancedAccuracy;
      const candidate = { weights, threshold: Number(threshold.toFixed(3)), cm, metrics: m, objective };
      if (!best || candidate.objective > best.objective + 1e-12
        || (Math.abs(candidate.objective - best.objective) < 1e-12 && candidate.threshold > best.threshold)) {
        best = candidate;
      }
    }
  }
  return best;
}

function eventMetrics(rows, weights, threshold, split) {
  const events = labels.events.filter((event) => event.split === split);
  const details = events.map((event) => {
    const onset = epoch(event.onset);
    const end = epoch(event.end);
    const eventRows = rows.filter((row) => row.symbol === event.symbol && row.timestamp >= onset && row.timestamp < end);
    const first = eventRows.find((row) => score(row, weights) >= threshold);
    return {
      eventId: event.id,
      detected: Boolean(first),
      firstAlertAt: first?.sampledAt ?? null,
      latencyHours: first ? (first.timestamp - onset) / 3600 : null,
      observations: eventRows.length,
    };
  });
  const outside = rows.filter((row) => !row.label).sort((a, b) => a.timestamp - b.timestamp || a.symbol.localeCompare(b.symbol));
  let falseAlertEpisodes = 0;
  const active = new Map();
  for (const row of outside) {
    const alerted = score(row, weights) >= threshold;
    const prior = active.get(row.symbol) ?? false;
    if (alerted && !prior) falseAlertEpisodes += 1;
    active.set(row.symbol, alerted);
  }
  return {
    events: details,
    eventRecall: details.filter((event) => event.detected).length / Math.max(1, details.length),
    meanLatencyHours: mean(details.filter((event) => event.latencyHours != null).map((event) => event.latencyHours)),
    falseAlertEpisodes,
  };
}

function tierSearch(trainRows, weights, tierCount) {
  const candidates = Array.from({ length: 17 }, (_, index) => 0.05 + index * 0.05);
  let best = null;
  function visit(start, chosen) {
    if (chosen.length === tierCount - 1) {
      const bounds = [0, ...chosen, 1.000001];
      const bins = Array.from({ length: tierCount }, () => ({ positives: 0, total: 0 }));
      for (const row of trainRows) {
        const value = score(row, weights);
        const index = Math.min(tierCount - 1, bounds.findIndex((upper, idx) => idx > 0 && value < upper) - 1);
        bins[index].total += 1;
        bins[index].positives += row.label;
      }
      if (bins.some((bin) => bin.total < 25)) return;
      const smoothedRates = bins.map((bin) => (bin.positives + 0.5) / (bin.total + 1));
      if (smoothedRates.some((rate, index) => index > 0 && rate < smoothedRates[index - 1])) return;
      let logLikelihood = 0;
      for (const bin of bins) {
        const rate = (bin.positives + 0.5) / (bin.total + 1);
        logLikelihood += bin.positives * Math.log(rate) + (bin.total - bin.positives) * Math.log(1 - rate);
      }
      const bic = -2 * logLikelihood + tierCount * Math.log(trainRows.length);
      if (!best || bic < best.bic) best = { boundaries: chosen, bins, bic };
      return;
    }
    for (let index = start; index < candidates.length; index += 1) visit(index + 1, [...chosen, candidates[index]]);
  }
  visit(0, []);
  return best;
}

function evaluateTiers(rows, weights, tierModel) {
  const bounds = [0, ...tierModel.boundaries, 1.000001];
  const bins = Array.from({ length: bounds.length - 1 }, (_, index) => ({ tier: index + 1, positives: 0, total: 0 }));
  for (const row of rows) {
    const value = score(row, weights);
    const index = Math.min(bins.length - 1, bounds.findIndex((upper, idx) => idx > 0 && value < upper) - 1);
    bins[index].total += 1;
    bins[index].positives += row.label;
  }
  return bins.map((bin) => ({ ...bin, eventRate: bin.positives / Math.max(1, bin.total) }));
}

const allRows = [];
const sourceSeries = [];
for (const asset of labels.assets) {
  for (const split of ["train", "test"]) {
    if (asset.splits && !asset.splits.includes(split)) continue;
    const splitWindow = labels[split];
    const end = split === "train" && asset.trainEnd ? asset.trainEnd : splitWindow.end;
    if (Date.parse(end) <= Date.parse(splitWindow.start)) continue;
    process.stderr.write(`fetch ${asset.symbol} ${split}\n`);
    const prices = await fetchRange(asset.coin, splitWindow.start, end);
    const rows = buildRows(asset.symbol, split, prices);
    allRows.push(...rows);
    sourceSeries.push({ symbol: asset.symbol, coin: asset.coin, split, observations: prices.length, usableRows: rows.length });
  }
}

const trainRows = allRows.filter((row) => row.split === "train");
const testRows = allRows.filter((row) => row.split === "test");
const calibration = calibrate(trainRows);
const testCm = confusion(testRows, calibration.weights, calibration.threshold);
const tierModels = [3, 4, 5].map((tierCount) => ({ tierCount, ...tierSearch(trainRows, calibration.weights, tierCount) }));
const selectedTierModel = [...tierModels].sort((a, b) => a.bic - b.bic)[0];
const normalizedForHash = allRows.map((row) => [row.symbol, row.split, row.timestamp, row.price]);
const report = {
  evaluation: "historical-depeg-time-split-calibration",
  publicArtifactVersion: artifactVersion(),
  generatedAt: new Date().toISOString(),
  design: {
    samplingPeriod: labels.samplingPeriod,
    train: labels.train,
    test: labels.test,
    leakageControl: "Weights, alert threshold, and tier boundaries are selected only on the 2022 training period; 2023 USDC and DAI event windows are held out until final evaluation.",
    featureOrder: ["current absolute peg deviation", "24-hour mean absolute deviation", "24-hour price volatility", "6-hour downside momentum"],
    featureScaling: ["3%", "2%", "2%", "2%"],
    target: "Externally documented event-window membership; contemporaneous detector evaluation, not a causal forecast.",
  },
  sources: {
    price: labels.priceSource,
    labels: labels.events,
    series: sourceSeries,
    normalizedSampleSha256: createHash("sha256").update(JSON.stringify(normalizedForHash)).digest("hex"),
  },
  sample: {
    trainRows: trainRows.length,
    trainPositives: trainRows.filter((row) => row.label).length,
    testRows: testRows.length,
    testPositives: testRows.filter((row) => row.label).length,
  },
  calibratedModel: {
    weights: Object.fromEntries(calibration.weights.map((value, index) => [["currentDeviation", "meanDeviation24h", "volatility24h", "downsideMomentum6h"][index], value])),
    alertThreshold: calibration.threshold,
    trainConfusionMatrix: calibration.cm,
    trainMetrics: { ...calibration.metrics, rocAuc: auc(trainRows, calibration.weights), averagePrecision: averagePrecision(trainRows, calibration.weights) },
    testConfusionMatrix: testCm,
    testMetrics: { ...metrics(testCm), rocAuc: auc(testRows, calibration.weights), averagePrecision: averagePrecision(testRows, calibration.weights) },
    trainEvents: eventMetrics(trainRows, calibration.weights, calibration.threshold, "train"),
    testEvents: eventMetrics(testRows, calibration.weights, calibration.threshold, "test"),
  },
  tierComparison: tierModels.map((model) => ({
    tierCount: model.tierCount,
    boundaries: model.boundaries,
    trainingBic: model.bic,
    trainBins: evaluateTiers(trainRows, calibration.weights, model),
    testBins: evaluateTiers(testRows, calibration.weights, model),
  })),
  selectedTierModel: {
    tierCount: selectedTierModel.tierCount,
    boundaries: selectedTierModel.boundaries,
    selectionRule: "Lowest training-period BIC among 3-, 4-, and 5-tier binomial calibration models; test data were not used for selection.",
    trainBins: evaluateTiers(trainRows, calibration.weights, selectedTierModel),
    testBins: evaluateTiers(testRows, calibration.weights, selectedTierModel),
  },
  limitations: [
    "Only four externally documented event windows are labelled: two training events and two held-out test events.",
    "Six-hour aggregated prices cannot establish sub-hour alert latency and may smooth exchange-specific extremes.",
    "The model is a contemporaneous depeg detector; it does not prove advance prediction before market prices move.",
    "The calibrated depeg weights do not statistically identify the application's broader protocol/token/chain/pool policy weights.",
  ],
};

await mkdir(dirname(OUT_PATH), { recursive: true });
await writeFile(OUT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`wrote ${OUT_PATH}`);
