import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyObservation, fetchDefiLlamaObservations, heldAssetScope, monitorHeldAssetsOnce,
} from "../src/lib/depeg-telegram-monitor.mjs";

const positions = [
  { id: "POS-001", walletId: "TREASURY-USDC", kind: "Lending", asset: "USDC", protocol: "Aave V3", status: "Active" },
  { id: "POS-003", walletId: "TREASURY-USDC", kind: "Staking", asset: "stETH", protocol: "Lido", status: "Active" },
  { id: "POS-004", walletId: "TREASURY-USDC", kind: "Farming", asset: "DAI / USDC", protocol: "Curve", status: "Active" },
  { id: "DEMO-POS-001", walletId: "DEMO-USDC", kind: "Lending", asset: "USDC", protocol: "Aave V3", status: "Demo" },
];

const payload = {
  coins: {
    "coingecko:usd-coin": { price: 0.962, confidence: 0.99, timestamp: 1_700_000_000 },
    "coingecko:dai": { price: 1.001, confidence: 0.99, timestamp: 1_700_000_000 },
    "coingecko:staked-ether": { price: 1940, confidence: 0.98, timestamp: 1_700_000_000 },
    "coingecko:ethereum": { price: 2000, confidence: 0.99, timestamp: 1_700_000_000 },
  },
};

const fetchImpl = async () => ({ ok: true, json: async () => payload });

test("derives monitor scope only from held, non-demo assets", () => {
  const scope = heldAssetScope(positions);
  assert.deepEqual(scope.map((row) => row.asset).sort(), ["DAI", "USDC", "stETH"]);
  assert.match(scope.find((row) => row.asset === "USDC").heldIn, /POS-001/);
  assert.match(scope.find((row) => row.asset === "USDC").heldIn, /POS-004/);
  assert.doesNotMatch(scope.find((row) => row.asset === "USDC").heldIn, /DEMO/);
});

test("uses ETH as the reference for stETH", async () => {
  const observations = await fetchDefiLlamaObservations(heldAssetScope(positions), { fetchImpl });
  const steth = observations.find((row) => row.asset === "stETH");
  assert.equal(steth.ratio, 0.97);
  assert.equal(steth.basis, "1.0000 ETH");
});

test("classifies opened, active, recovered, and stable transitions", () => {
  const base = { asset: "USDC", ratio: 0.96, confidence: 0.99, thresholdPct: 3 };
  assert.equal(classifyObservation(base).transition, "opened");
  assert.equal(classifyObservation(base, { active: true }).transition, "active");
  assert.equal(classifyObservation({ ...base, ratio: 1 }, { active: true }).transition, "recovered");
  assert.equal(classifyObservation({ ...base, ratio: 1 }, { active: false }).transition, "stable");
});

test("sends only opened and recovered transitions", async () => {
  const sent = [];
  const first = await monitorHeldAssetsOnce({ positions, fetchImpl, sendAlert: async (message) => { sent.push(message); return { sent: 1, failures: [] }; } });
  assert.deepEqual(first.filter((row) => row.delivery).map((row) => row.asset).sort(), ["USDC", "stETH"]);
  assert.equal(sent.length, 2);

  const previousStates = new Map(first.map((row) => [row.asset, { active: row.active }]));
  sent.length = 0;
  await monitorHeldAssetsOnce({ positions, previousStates, fetchImpl, sendAlert: async (message) => { sent.push(message); return { sent: 1, failures: [] }; } });
  assert.equal(sent.length, 0);

  const recoveryFetch = async () => ({ ok: true, json: async () => ({ coins: {
    ...payload.coins,
    "coingecko:usd-coin": { price: 1, confidence: 0.99, timestamp: 1_700_000_060 },
    "coingecko:staked-ether": { price: 1995, confidence: 0.98, timestamp: 1_700_000_060 },
  } }) });
  await monitorHeldAssetsOnce({ positions, previousStates, fetchImpl: recoveryFetch, sendAlert: async (message) => { sent.push(message); return { sent: 1, failures: [] }; } });
  assert.equal(sent.length, 2);
  assert.ok(sent.every((message) => message.includes("Recovered")));
});
