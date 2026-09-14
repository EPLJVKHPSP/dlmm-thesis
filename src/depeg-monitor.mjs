function finitePositive(value, label) {
  if (!Number.isFinite(value) || value <= 0) throw new TypeError(`${label} must be positive`);
}

export function classifyDepegObservation({
  price,
  referencePrice = 1,
  confidence = 1,
  thresholdPct = 3,
  minConfidence = 0.5,
  previousActive = false,
} = {}) {
  finitePositive(price, "price");
  finitePositive(referencePrice, "referencePrice");
  finitePositive(thresholdPct, "thresholdPct");
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new TypeError("confidence must be between 0 and 1");
  }
  if (!Number.isFinite(minConfidence) || minConfidence < 0 || minConfidence > 1) {
    throw new TypeError("minConfidence must be between 0 and 1");
  }

  const deviationPct = Math.abs(price - referencePrice) / referencePrice * 100;
  const active = deviationPct >= thresholdPct && confidence >= minConfidence;
  const transition = active && !previousActive ? "opened"
    : !active && previousActive ? "recovered"
      : active ? "active" : "stable";
  return { deviationPct, active, transition };
}

export class DepegMonitor {
  constructor({ thresholdPct = 3, minConfidence = 0.5 } = {}) {
    finitePositive(thresholdPct, "thresholdPct");
    if (!Number.isFinite(minConfidence) || minConfidence < 0 || minConfidence > 1) {
      throw new TypeError("minConfidence must be between 0 and 1");
    }
    this.thresholdPct = thresholdPct;
    this.minConfidence = minConfidence;
    this.states = new Map();
  }

  observe({ positionId, observedAt, price, referencePrice = 1, confidence = 1 }) {
    if (!positionId) throw new TypeError("positionId is required");
    const prior = this.states.get(positionId) ?? { active: false, openedAt: null };
    const { deviationPct, active, transition } = classifyDepegObservation({
      price,
      referencePrice,
      confidence,
      thresholdPct: this.thresholdPct,
      minConfidence: this.minConfidence,
      previousActive: prior.active,
    });
    const next = {
      active,
      openedAt: transition === "opened" ? observedAt : active ? prior.openedAt : null,
      lastObservedAt: observedAt,
      deviationPct,
      confidence,
    };
    this.states.set(positionId, next);
    return { positionId, transition, ...next };
  }
}
