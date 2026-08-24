import test from "node:test";
import assert from "node:assert/strict";
import { DepegMonitor } from "../src/depeg-monitor.mjs";

test("tracks an alert and recovery independently for one position", () => {
  const monitor = new DepegMonitor({ thresholdPct: 3, minConfidence: 0.5 });
  assert.equal(monitor.observe({ positionId: "position-a", observedAt: "t1", price: 1 }).transition, "stable");
  assert.equal(monitor.observe({ positionId: "position-a", observedAt: "t2", price: 0.96, confidence: 0.8 }).transition, "opened");
  assert.equal(monitor.observe({ positionId: "position-a", observedAt: "t3", price: 0.95, confidence: 0.8 }).transition, "active");
  assert.equal(monitor.observe({ positionId: "position-a", observedAt: "t4", price: 0.99, confidence: 0.8 }).transition, "recovered");
});

test("does not open an alert below the confidence threshold", () => {
  const monitor = new DepegMonitor({ thresholdPct: 3, minConfidence: 0.5 });
  const result = monitor.observe({ positionId: "position-b", observedAt: "t1", price: 0.9, confidence: 0.4 });
  assert.equal(result.transition, "stable");
});
