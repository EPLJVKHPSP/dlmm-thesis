import test from "node:test";
import assert from "node:assert/strict";
import { calculateLayeredRisk, calculateProtocolData } from "../src/protocol-risk.mjs";

test("protocol data equally weights age and share of chain TVL", () => {
  assert.equal(calculateProtocolData({ protocolAge: 7.4, shareOfChainTvl: 6.8 }), 7.1);
});

test("layered risk exposes the configured final blend", () => {
  const result = calculateLayeredRisk({
    internal: 7.233333333333333,
    hindenrank: 7.5,
    tokenInsight: 6.5,
    incidentHistory: 7,
  });
  assert.ok(Math.abs(result.score - 7.153333333333333) < 1e-12);
});
