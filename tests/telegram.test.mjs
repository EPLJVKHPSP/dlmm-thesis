import test from "node:test";
import assert from "node:assert/strict";
import {
  telegramConfig, formatDepegAlert, formatTestAlert, sendTelegramMessage, sendDepegAlert,
} from "../src/lib/telegram.mjs";

test("reads token and chat allowlist from env", () => {
  const config = telegramConfig({ BOT_TOKEN: "abc", TELEGRAM_CHAT_IDS: "1, 2,,3 " });
  assert.equal(config.token, "abc");
  assert.deepEqual(config.chatIds, ["1", "2", "3"]);
});

test("stays dormant without a token and never calls fetch", async () => {
  let called = 0;
  const result = await sendTelegramMessage("hi", {
    token: "",
    chatIds: ["1"],
    fetchImpl: async () => { called += 1; throw new Error("must not be called"); },
  });
  assert.equal(result.sent, 0);
  assert.match(result.skipped, /BOT_TOKEN/);
  assert.equal(called, 0);
});

test("stays silent without subscribers", async () => {
  let called = 0;
  const result = await sendTelegramMessage("hi", {
    token: "abc",
    chatIds: [],
    fetchImpl: async () => { called += 1; return { ok: true }; },
  });
  assert.equal(result.sent, 0);
  assert.match(result.skipped, /CHAT_IDS/);
  assert.equal(called, 0);
});

test("posts one sendMessage per chat id", async () => {
  const calls = [];
  const result = await sendTelegramMessage("hello", {
    token: "TOKEN",
    chatIds: ["11", "22"],
    fetchImpl: async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return { ok: true };
    },
  });
  assert.equal(result.sent, 2);
  assert.deepEqual(result.failures, []);
  assert.ok(calls[0].url.includes("/botTOKEN/sendMessage"));
  assert.deepEqual(calls[0].body, { chat_id: "11", text: "hello" });
});

test("counts failures without throwing", async () => {
  const result = await sendTelegramMessage("hello", {
    token: "TOKEN",
    chatIds: ["11", "22"],
    fetchImpl: async (url, init) => (JSON.parse(init.body).chat_id === "11" ? { ok: true } : { ok: false, status: 403 }),
  });
  assert.equal(result.sent, 1);
  assert.deepEqual(result.failures, ["22: 403"]);
});

test("network errors cannot disclose the bot URL or token", async () => {
  const token = "test-only-token";
  const result = await sendTelegramMessage("hello", {
    token,
    chatIds: ["11"],
    fetchImpl: async (url) => { throw new Error(`Unable to reach ${url}`); },
  });
  assert.equal(result.sent, 0);
  assert.deepEqual(result.failures, ["11: request failed"]);
  assert.equal(JSON.stringify(result).includes(token), false);
});

test("depeg alert matches the production design", () => {
  assert.equal(
    formatDepegAlert({ symbol: "USDC", chain: "Ethereum", deviationPct: 3.8, basis: "$1.0000 peg", heldIn: "Aave V3 USDC lending (POS-001)", transition: "opened" }),
    "⚠️ Depeg: USDC (Ethereum) 3.80%\nBasis: $1.0000 peg\nHeld in: Aave V3 USDC lending (POS-001)",
  );
  assert.equal(
    formatDepegAlert({ symbol: "USDC", chain: "Ethereum", deviationPct: 0.1, basis: "$1.0000 peg", heldIn: null, transition: "recovered" }),
    "✅ Recovered: USDC (Ethereum)\nBasis: $1.0000 peg",
  );
});

test("sendDepegAlert composes formatting with delivery", async () => {
  const bodies = [];
  const result = await sendDepegAlert(
    { symbol: "USDC", chain: "Ethereum", deviationPct: 3.8, basis: "$1.0000 peg", heldIn: "Aave V3 USDC lending (POS-001)", transition: "opened" },
    { token: "TOKEN", chatIds: ["11"], fetchImpl: async (_url, init) => { bodies.push(JSON.parse(init.body).text); return { ok: true }; } },
  );
  assert.equal(result.sent, 1);
  assert.match(bodies[0], /⚠️ Depeg/);
});

test("test alert is explicit about doing nothing", () => {
  assert.match(formatTestAlert(), /no action needed/i);
});
