import { formatDepegAlert } from "./telegram.mjs";
import { classifyDepegObservation } from "../depeg-monitor.mjs";

export const MONITORED_ASSETS = {
  USDC: { coin: "coingecko:usd-coin", referenceCoin: null, chain: "Ethereum", basis: "$1.0000 peg" },
  DAI: { coin: "coingecko:dai", referenceCoin: null, chain: "Ethereum", basis: "$1.0000 peg" },
  stETH: { coin: "coingecko:staked-ether", referenceCoin: "coingecko:ethereum", chain: "Ethereum", basis: "1.0000 ETH" },
};

export function heldAssetScope(positions, thresholdPct = 3) {
  const byAsset = new Map();
  for (const position of positions) {
    if (position.walletId === "DEMO-USDC" || position.status === "Demo") continue;
    const symbols = String(position.asset).split("/").map((value) => value.trim()).filter(Boolean);
    for (const symbol of symbols) {
      const spec = MONITORED_ASSETS[symbol];
      if (!spec) continue;
      const row = byAsset.get(symbol) ?? { asset: symbol, ...spec, thresholdPct, heldIn: [] };
      row.heldIn.push(`${position.protocol} ${position.asset} ${String(position.kind).toLowerCase()} (${position.id})`);
      byAsset.set(symbol, row);
    }
  }
  return [...byAsset.values()].map((row) => ({ ...row, heldIn: row.heldIn.join("; ") }));
}

export async function fetchDefiLlamaObservations(scope, { fetchImpl = fetch } = {}) {
  const ids = [...new Set(scope.flatMap((row) => [row.coin, row.referenceCoin]).filter(Boolean))];
  if (ids.length === 0) return [];
  const url = `https://coins.llama.fi/prices/current/${ids.map(encodeURIComponent).join(",")}`;
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`DefiLlama current-price request failed with ${response.status}`);
  const coins = (await response.json()).coins ?? {};
  return scope.map((row) => {
    const observed = coins[row.coin];
    const reference = row.referenceCoin ? coins[row.referenceCoin] : { price: 1, confidence: 1 };
    if (!observed || !reference || !Number.isFinite(Number(observed.price)) || !Number.isFinite(Number(reference.price))) {
      throw new Error(`DefiLlama response is missing ${row.asset} or its reference`);
    }
    const price = Number(observed.price);
    const referencePrice = Number(reference.price);
    const ratio = price / referencePrice;
    const confidence = Math.min(Number(observed.confidence ?? 0), Number(reference.confidence ?? 1));
    return {
      ...row,
      price,
      referencePrice,
      ratio,
      confidence,
      observedAt: new Date(Number(observed.timestamp) * 1000).toISOString(),
    };
  });
}

export function classifyObservation(observation, previous = null, minConfidence = 0.5) {
  return {
    ...observation,
    ...classifyDepegObservation({
      price: observation.ratio,
      referencePrice: 1,
      confidence: observation.confidence,
      thresholdPct: observation.thresholdPct,
      minConfidence,
      previousActive: Boolean(previous?.active),
    }),
  };
}

export async function monitorHeldAssetsOnce({
  positions,
  previousStates = new Map(),
  fetchImpl = fetch,
  sendAlert,
  thresholdPct = 3,
  minConfidence = 0.5,
} = {}) {
  const scope = heldAssetScope(positions ?? [], thresholdPct);
  const observations = await fetchDefiLlamaObservations(scope, { fetchImpl });
  const results = [];
  for (const observation of observations) {
    const result = classifyObservation(observation, previousStates.get(observation.asset), minConfidence);
    let delivery = null;
    if (result.transition === "opened" || result.transition === "recovered") {
      const message = formatDepegAlert({
        symbol: result.asset,
        chain: result.chain,
        deviationPct: result.deviationPct,
        basis: result.basis,
        heldIn: result.transition === "opened" ? result.heldIn : null,
        transition: result.transition,
      });
      delivery = await sendAlert(message, result);
    }
    results.push({ ...result, delivery });
  }
  return results;
}
