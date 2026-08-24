const DEFAULT_BOUNDARIES = [2, 4, 6, 8];

export function calculateCompositeRisk(components, weights, boundaries = DEFAULT_BOUNDARIES) {
  const entries = Object.entries(weights).filter(([, weight]) => Number.isFinite(weight) && weight > 0);
  if (!entries.length) throw new TypeError("at least one positive weight is required");

  let weighted = 0;
  let usedWeight = 0;
  const contributions = {};
  for (const [name, weight] of entries) {
    const value = components[name];
    if (value == null) continue;
    if (!Number.isFinite(value) || value < 0 || value > 10) {
      throw new TypeError(`${name} must be between 0 and 10`);
    }
    contributions[name] = value * weight;
    weighted += contributions[name];
    usedWeight += weight;
  }
  if (!usedWeight) throw new TypeError("no weighted component value was supplied");

  const score = weighted / usedWeight;
  const tierIndex = boundaries.findIndex((upper) => score < upper);
  const tier = tierIndex === -1 ? boundaries.length + 1 : tierIndex + 1;
  return { score, tier, usedWeight, contributions };
}
