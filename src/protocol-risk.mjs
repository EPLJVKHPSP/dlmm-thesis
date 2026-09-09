import { calculateCompositeRisk } from "./composite-risk.mjs";

export function calculateProtocolData({ protocolAge, shareOfChainTvl }) {
  for (const [name, value] of Object.entries({ protocolAge, shareOfChainTvl })) {
    if (!Number.isFinite(value) || value < 0 || value > 10) {
      throw new TypeError(`${name} must be between 0 and 10`);
    }
  }
  return 0.5 * protocolAge + 0.5 * shareOfChainTvl;
}

export function calculateLayeredRisk({ internal, hindenrank, tokenInsight, incidentHistory }) {
  return calculateCompositeRisk(
    { internal, hindenrank, tokenInsight, incidentHistory },
    { internal: 0.55, hindenrank: 0.2, tokenInsight: 0.15, incidentHistory: 0.1 },
  );
}
